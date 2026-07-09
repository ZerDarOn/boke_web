"""
Knowledge Base Service — Smart RAG with embedding + semantic search

Architecture:
  Query → Embed → ChromaDB search → relevance check →
    ├─ HIGH relevance → prepend context → LLM (knowledge-grounded answer)
    └─ LOW  relevance → system prompt only → LLM (chat normally)

Indexing:
  Fetches published posts from PostgreSQL, chunks by paragraph,
  embeds via OpenAI, stores in persistent ChromaDB.
"""

import os
import hashlib
import logging
from typing import List, Optional
from dataclasses import dataclass

logger = logging.getLogger("ai-service.kb")

# ─────────────────────────────────────────────────────────
# Types
# ─────────────────────────────────────────────────────────


@dataclass
class DocumentChunk:
    id: str
    post_id: str
    post_title: str
    post_slug: str
    content: str
    index: int  # chunk position within the post


# ─────────────────────────────────────────────────────────
# ChromaDB Wrapper
# ─────────────────────────────────────────────────────────


class KnowledgeBase:
    """Smart RAG knowledge base backed by ChromaDB."""

    COLLECTION_NAME = "blog_posts"
    RELEVANCE_THRESHOLD = 0.45  # 低于此分数视为不相关，走纯聊天模式
    CHUNK_SIZE = 600             # 每个 chunk 的字符数
    CHUNK_OVERLAP = 80           # 相邻 chunk 的重叠字符数

    def __init__(self, persist_dir: str = None):
        import chromadb
        from chromadb.config import Settings as ChromaSettings

        if persist_dir is None:
            persist_dir = os.path.join(os.path.dirname(__file__), "..", "..", "chroma_data")

        os.makedirs(persist_dir, exist_ok=True)

        self._client = chromadb.PersistentClient(
            path=persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self._collection = self._client.get_or_create_collection(
            name=self.COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        self._embedding_fn = None  # lazy init

    # ── embedding ─────────────────────────────────────

    def _get_embed_fn(self):
        if self._embedding_fn is None:
            from app.core.config import settings
            from openai import OpenAI
            api_key = settings.OPENAI_API_KEY
            if not api_key:
                raise RuntimeError("OPENAI_API_KEY not configured — needed for embeddings")
            client = OpenAI(api_key=api_key)

            def embed(texts: List[str]) -> List[List[float]]:
                resp = client.embeddings.create(
                    model="text-embedding-3-small",
                    input=texts,
                )
                return [d.embedding for d in resp.data]

            self._embedding_fn = embed
        return self._embedding_fn

    # ── indexing ──────────────────────────────────────

    @staticmethod
    def _chunk_post(title: str, content: str, chunk_size: int = 600, overlap: int = 80) -> List[str]:
        """Split post content into overlapping chunks by paragraphs."""
        paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
        chunks: List[str] = []
        current = ""
        for para in paragraphs:
            if len(current) + len(para) < chunk_size:
                current = (current + "\n\n" + para).strip() if current else para
            else:
                if current:
                    chunks.append(current)
                # 重叠: 从 current 尾部取 overlap 字符拼到新段落前
                tail = current[-overlap:] if current and overlap > 0 else ""
                current = (tail + "\n\n" + para).strip() if tail else para
        if current:
            chunks.append(current)
        return chunks

    async def reindex(self) -> dict:
        """
        Fetch all published posts from PostgreSQL, chunk them,
        embed, and replace the ChromaDB collection.
        """
        import asyncpg
        from app.core.config import settings

        db_url = settings.DATABASE_URL
        if not db_url:
            return {"error": "DATABASE_URL not configured", "indexed": 0}

        # 连接 PostgreSQL
        conn = await asyncpg.connect(db_url)
        try:
            rows = await conn.fetch(
                "SELECT id, title, slug, content FROM \"Post\" WHERE \"isPublished\" = true"
            )
        finally:
            await conn.close()

        if not rows:
            logger.warning("No published posts found in database")
            return {"indexed": 0, "posts": 0, "chunks": 0}

        # 分块
        all_chunks: List[DocumentChunk] = []
        for row in rows:
            post_chunks = self._chunk_post(row["title"], row["content"], self.CHUNK_SIZE, self.CHUNK_OVERLAP)
            for i, chunk_text in enumerate(post_chunks):
                chunk_id = hashlib.md5(f"{row['id']}:{i}".encode()).hexdigest()[:16]
                all_chunks.append(DocumentChunk(
                    id=chunk_id,
                    post_id=row["id"],
                    post_title=row["title"],
                    post_slug=row["slug"],
                    content=chunk_text,
                    index=i,
                ))

        # 嵌入 & 写入 ChromaDB
        embed_fn = self._get_embed_fn()
        texts = [f"[{c.post_title}]\n{c.content}" for c in all_chunks]
        embeddings = embed_fn(texts)

        # 重建 collection（先删后插）
        self._client.delete_collection(name=self.COLLECTION_NAME)
        self._collection = self._client.create_collection(
            name=self.COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )

        if all_chunks:
            self._collection.add(
                ids=[c.id for c in all_chunks],
                embeddings=embeddings,
                documents=texts,
                metadatas=[
                    {
                        "post_id": c.post_id,
                        "post_title": c.post_title,
                        "post_slug": c.post_slug,
                        "chunk_index": c.index,
                    }
                    for c in all_chunks
                ],
            )

        logger.info(f"Reindexed {len(rows)} posts → {len(all_chunks)} chunks")
        return {
            "indexed": len(all_chunks),
            "posts": len(rows),
            "chunks": len(all_chunks),
        }

    # ── retrieval ─────────────────────────────────────

    @staticmethod
    def _needs_knowledge(scores: List[float], threshold: float) -> bool:
        """Top-1 相似度超过阈值才启用 RAG，否则纯聊天。"""
        return bool(scores) and scores[0] >= threshold

    async def search(self, query: str, top_k: int = 5) -> tuple[List[dict], bool]:
        """
        Retur (chunks, needsKnowledge).
        needsKnowledge=False 时 chunks 为空——调用方应走纯聊天。
        """
        embed_fn = self._get_embed_fn()
        q_embedding = embed_fn([query])[0]

        results = self._collection.query(
            query_embeddings=[q_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"],
        )

        if not results["ids"] or not results["ids"][0]:
            return [], False

        # ChromaDB with cosine → distance 越小越相关，1-distance = similarity
        similarities = [1 - d for d in results["distances"][0]]
        needs_kb = self._needs_knowledge(similarities, self.RELEVANCE_THRESHOLD)

        if not needs_kb:
            return [], False

        chunks = []
        for i, doc in enumerate(results["documents"][0]):
            meta = results["metadatas"][0][i]
            chunks.append({
                "content": doc,
                "title": meta["post_title"],
                "slug": meta["post_slug"],
                "score": round(similarities[i], 3),
            })

        return chunks, True


# ── Singleton ─────────────────────────────────────────
_kb: Optional[KnowledgeBase] = None


def get_kb() -> KnowledgeBase:
    global _kb
    if _kb is None:
        _kb = KnowledgeBase()
    return _kb
