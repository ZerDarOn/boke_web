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
import asyncio
import uuid
from datetime import datetime, timezone
from typing import Any, List, Mapping, Optional
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
    ACTIVE_COLLECTION_FILE = "active_collection.txt"
    EMBEDDING_BATCH_SIZE = 64
    RELEVANCE_THRESHOLD = 0.45  # 低于此分数视为不相关，走纯聊天模式
    CHUNK_SIZE = 600             # 每个 chunk 的字符数
    CHUNK_OVERLAP = 80           # 相邻 chunk 的重叠字符数

    def __init__(self, persist_dir: str = None):
        import chromadb
        from chromadb.config import Settings as ChromaSettings

        if persist_dir is None:
            persist_dir = os.path.join(os.path.dirname(__file__), "..", "..", "chroma_data")

        os.makedirs(persist_dir, exist_ok=True)
        self._persist_dir = os.path.abspath(persist_dir)
        self._active_collection_path = os.path.join(self._persist_dir, self.ACTIVE_COLLECTION_FILE)

        self._client = chromadb.PersistentClient(
            path=persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self._collection = self._client.get_or_create_collection(
            name=self._read_active_collection_name(),
            metadata={"hnsw:space": "cosine"},
        )
        self._embedding_fn = None  # lazy init
        self._mutation_lock = asyncio.Lock()
        self._last_operation: Optional[str] = None
        self._last_mutation_at: Optional[str] = None
        self._last_error: Optional[str] = None

    def _read_active_collection_name(self) -> str:
        try:
            with open(self._active_collection_path, "r", encoding="utf-8") as pointer:
                name = pointer.read().strip()
            if name == self.COLLECTION_NAME or name.startswith(f"{self.COLLECTION_NAME}_"):
                return name
        except FileNotFoundError:
            pass
        return self.COLLECTION_NAME

    def _write_active_collection_name(self, name: str) -> None:
        temporary_path = f"{self._active_collection_path}.{uuid.uuid4().hex}.tmp"
        with open(temporary_path, "w", encoding="utf-8") as pointer:
            pointer.write(name)
        os.replace(temporary_path, self._active_collection_path)

    def _cleanup_superseded_collections(
        self,
        active_name: str,
        rollback_name: str,
    ) -> None:
        retained = {active_name, rollback_name}
        for collection in self._client.list_collections():
            collection_name = getattr(collection, "name", str(collection))
            if (
                collection_name.startswith(f"{self.COLLECTION_NAME}_")
                and collection_name not in retained
            ):
                self._client.delete_collection(name=collection_name)

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

    async def _embed_texts(self, texts: List[str]) -> List[List[float]]:
        embed_fn = self._get_embed_fn()
        embeddings: List[List[float]] = []
        for offset in range(0, len(texts), self.EMBEDDING_BATCH_SIZE):
            batch = texts[offset:offset + self.EMBEDDING_BATCH_SIZE]
            embeddings.extend(await asyncio.to_thread(embed_fn, batch))
        return embeddings

    # ── indexing ──────────────────────────────────────

    @staticmethod
    def _content_hash(post: Mapping[str, Any]) -> str:
        source = "\0".join(
            str(post[field]) for field in ("title", "slug", "content")
        )
        return hashlib.sha256(source.encode("utf-8")).hexdigest()

    @staticmethod
    def _chunk_id(post_id: str, index: int) -> str:
        return hashlib.md5(f"{post_id}:{index}".encode()).hexdigest()[:16]

    def _record_operation(self, operation: str, error: Optional[Exception] = None) -> None:
        self._last_operation = operation
        self._last_mutation_at = datetime.now(timezone.utc).isoformat()
        self._last_error = type(error).__name__ if error else None

    @staticmethod
    def _chunk_post(title: str, content: str, chunk_size: int = 600, overlap: int = 80) -> List[str]:
        """Split post content into overlapping chunks by paragraphs."""
        del title
        if chunk_size <= 0:
            raise ValueError("chunk_size must be positive")
        overlap = max(0, min(overlap, chunk_size - 1))
        normalized = "\n\n".join(
            paragraph.strip()
            for paragraph in content.split("\n\n")
            if paragraph.strip()
        )
        if not normalized:
            return []

        chunks: List[str] = []
        start = 0
        while start < len(normalized):
            hard_end = min(start + chunk_size, len(normalized))
            end = hard_end
            if hard_end < len(normalized):
                boundary = normalized.rfind(
                    "\n\n",
                    start + max(1, chunk_size // 2),
                    hard_end,
                )
                if boundary > start:
                    end = boundary

            chunk = normalized[start:end].strip()
            if chunk:
                chunks.append(chunk)
            if end >= len(normalized):
                break
            start = max(end - overlap, start + 1)
        return chunks

    async def _fetch_public_posts(self, post_id: Optional[str] = None) -> list:
        import asyncpg
        from app.core.config import settings

        if not settings.DATABASE_URL:
            raise RuntimeError("DATABASE_URL not configured")

        conn = await asyncpg.connect(settings.DATABASE_URL)
        try:
            query = (
                "SELECT id, title, slug, content FROM posts "
                "WHERE \"isPublished\" = true AND \"accessLevel\" = 'PUBLIC'"
            )
            if post_id is None:
                return await conn.fetch(query)
            row = await conn.fetchrow(f"{query} AND id = $1", post_id)
            return [row] if row else []
        finally:
            await conn.close()

    async def _fetch_public_post_ids(self, post_ids: set[str]) -> set[str]:
        import asyncpg
        from app.core.config import settings

        if not post_ids:
            return set()
        if not settings.DATABASE_URL:
            raise RuntimeError("DATABASE_URL not configured")

        conn = await asyncpg.connect(settings.DATABASE_URL)
        try:
            rows = await conn.fetch(
                "SELECT id FROM posts WHERE id = ANY($1::text[]) "
                "AND \"isPublished\" = true AND \"accessLevel\" = 'PUBLIC'",
                list(post_ids),
            )
            return {str(row["id"]) for row in rows}
        finally:
            await conn.close()

    async def _remove_post_unlocked(self, post_id: str) -> dict:
        existing = await asyncio.to_thread(
            self._collection.get,
            where={"post_id": post_id},
            include=["metadatas"],
        )
        ids = existing.get("ids") or []
        if ids:
            await asyncio.to_thread(self._collection.delete, ids=ids)
        return {"post_id": post_id, "action": "removed", "chunks": len(ids)}

    async def _upsert_post_unlocked(self, post: Mapping[str, Any]) -> dict:
        post_id = str(post["id"])
        content_hash = self._content_hash(post)
        existing = await asyncio.to_thread(
            self._collection.get,
            where={"post_id": post_id},
            include=["metadatas"],
        )
        existing_ids = existing.get("ids") or []
        existing_metadatas = existing.get("metadatas") or []
        if existing_ids and all(
            metadata and metadata.get("content_hash") == content_hash
            for metadata in existing_metadatas
        ):
            return {
                "post_id": post_id,
                "action": "unchanged",
                "chunks": len(existing_ids),
            }

        chunk_texts = self._chunk_post(
            str(post["title"]),
            str(post["content"]),
            self.CHUNK_SIZE,
            self.CHUNK_OVERLAP,
        )
        if not chunk_texts:
            return await self._remove_post_unlocked(post_id)

        chunk_ids = [self._chunk_id(post_id, index) for index in range(len(chunk_texts))]
        documents = [f"[{post['title']}]\n{text}" for text in chunk_texts]
        embeddings = await self._embed_texts(documents)
        metadatas = [
            {
                "post_id": post_id,
                "post_title": str(post["title"]),
                "post_slug": str(post["slug"]),
                "chunk_index": index,
                "content_hash": content_hash,
            }
            for index in range(len(chunk_texts))
        ]

        # Upsert first, then remove stale chunks. A failed embedding/upsert leaves the
        # previous searchable version intact.
        await asyncio.to_thread(
            self._collection.upsert,
            ids=chunk_ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
        )
        stale_ids = [chunk_id for chunk_id in existing_ids if chunk_id not in chunk_ids]
        if stale_ids:
            await asyncio.to_thread(self._collection.delete, ids=stale_ids)

        return {"post_id": post_id, "action": "updated", "chunks": len(chunk_ids)}

    async def sync_post(self, post_id: str) -> dict:
        async with self._mutation_lock:
            try:
                rows = await self._fetch_public_posts(post_id)
                result = (
                    await self._upsert_post_unlocked(rows[0])
                    if rows
                    else await self._remove_post_unlocked(post_id)
                )
                self._record_operation("sync_post")
                logger.info(
                    "Knowledge index post sync post_id=%s action=%s chunks=%d",
                    post_id,
                    result["action"],
                    result["chunks"],
                )
                return result
            except Exception as error:
                self._record_operation("sync_post", error)
                logger.exception("Knowledge index post sync failed post_id=%s", post_id)
                raise

    async def remove_post(self, post_id: str) -> dict:
        async with self._mutation_lock:
            try:
                result = await self._remove_post_unlocked(post_id)
                self._record_operation("remove_post")
                logger.info(
                    "Knowledge index post removal post_id=%s chunks=%d",
                    post_id,
                    result["chunks"],
                )
                return result
            except Exception as error:
                self._record_operation("remove_post", error)
                logger.exception("Knowledge index post removal failed post_id=%s", post_id)
                raise

    async def reindex(self) -> dict:
        async with self._mutation_lock:
            try:
                result = await self._reindex_unlocked()
                self._record_operation("reindex")
                return result
            except Exception as error:
                self._record_operation("reindex", error)
                raise

    async def _reindex_unlocked(self) -> dict:
        """
        Fetch all published posts from PostgreSQL, chunk them,
        embed, and replace the ChromaDB collection.
        """
        rows = await self._fetch_public_posts()

        # 分块
        all_chunks: List[DocumentChunk] = []
        for row in rows:
            post_chunks = self._chunk_post(row["title"], row["content"], self.CHUNK_SIZE, self.CHUNK_OVERLAP)
            for i, chunk_text in enumerate(post_chunks):
                chunk_id = self._chunk_id(row["id"], i)
                all_chunks.append(DocumentChunk(
                    id=chunk_id,
                    post_id=row["id"],
                    post_title=row["title"],
                    post_slug=row["slug"],
                    content=chunk_text,
                    index=i,
                ))

        # 嵌入 & 写入 ChromaDB
        texts = [f"[{c.post_title}]\n{c.content}" for c in all_chunks]
        embeddings = await self._embed_texts(texts) if texts else []
        content_hashes = {
            str(row["id"]): self._content_hash(row) for row in rows
        }

        # Build a complete version before atomically switching the active pointer.
        staging_name = f"{self.COLLECTION_NAME}_{uuid.uuid4().hex}"
        staging_collection = self._client.create_collection(
            name=staging_name,
            metadata={"hnsw:space": "cosine"},
        )

        try:
            if all_chunks:
                await asyncio.to_thread(
                    staging_collection.add,
                    ids=[c.id for c in all_chunks],
                    embeddings=embeddings,
                    documents=texts,
                    metadatas=[
                        {
                            "post_id": c.post_id,
                            "post_title": c.post_title,
                            "post_slug": c.post_slug,
                            "chunk_index": c.index,
                            "content_hash": content_hashes[c.post_id],
                        }
                        for c in all_chunks
                    ],
                )
        except Exception:
            self._client.delete_collection(name=staging_name)
            logger.exception("Knowledge index build failed; active collection preserved")
            raise

        previous_name = self._collection.name
        try:
            self._write_active_collection_name(staging_name)
        except Exception:
            self._client.delete_collection(name=staging_name)
            logger.exception("Knowledge index activation failed; active collection preserved")
            raise
        self._collection = staging_collection

        try:
            await asyncio.to_thread(
                self._cleanup_superseded_collections,
                staging_name,
                previous_name,
            )
        except Exception as error:
            logger.warning(
                "Knowledge index cleanup failed error_type=%s",
                type(error).__name__,
            )

        logger.info(
            "Knowledge index activated collection=%s previous_collection=%s posts=%d chunks=%d",
            staging_name,
            previous_name,
            len(rows),
            len(all_chunks),
        )
        return {
            "indexed": len(all_chunks),
            "posts": len(rows),
            "chunks": len(all_chunks),
        }

    async def status(self) -> dict:
        snapshot = await asyncio.to_thread(
            self._collection.get,
            include=["metadatas"],
        )
        metadatas = snapshot.get("metadatas") or []
        post_ids = {
            metadata.get("post_id") for metadata in metadatas if metadata
        }
        return {
            "collection": self._collection.name,
            "posts": len(post_ids),
            "chunks": len(snapshot.get("ids") or []),
            "last_operation": self._last_operation,
            "last_mutation_at": self._last_mutation_at,
            "last_error_type": self._last_error,
        }

    async def reconcile(self) -> dict:
        async with self._mutation_lock:
            try:
                rows = await self._fetch_public_posts()
                public_ids = {str(row["id"]) for row in rows}
                summary = {"updated": 0, "unchanged": 0, "removed": 0}
                for row in rows:
                    result = await self._upsert_post_unlocked(row)
                    summary[result["action"]] += 1

                snapshot = await asyncio.to_thread(
                    self._collection.get,
                    include=["metadatas"],
                )
                indexed_ids = {
                    metadata.get("post_id")
                    for metadata in (snapshot.get("metadatas") or [])
                    if metadata and metadata.get("post_id")
                }
                for orphan_id in indexed_ids - public_ids:
                    await self._remove_post_unlocked(orphan_id)
                    summary["removed"] += 1

                self._record_operation("reconcile")
                logger.info(
                    "Knowledge index reconciled updated=%d unchanged=%d removed=%d",
                    summary["updated"],
                    summary["unchanged"],
                    summary["removed"],
                )
                return summary
            except Exception as error:
                self._record_operation("reconcile", error)
                logger.exception("Knowledge index reconciliation failed")
                raise

    # ── retrieval ─────────────────────────────────────

    @staticmethod
    def _needs_knowledge(scores: List[float], threshold: float) -> bool:
        """Top-1 相似度超过阈值才启用 RAG，否则纯聊天。"""
        return bool(scores) and scores[0] >= threshold

    @staticmethod
    def _filter_public_matches(
        chunk_ids: list,
        documents: list,
        metadatas: list,
        distances: list,
        public_post_ids: set[str],
    ) -> list:
        matches = []
        for chunk_id, document, metadata, distance in zip(
            chunk_ids,
            documents,
            metadatas,
            distances,
        ):
            if metadata and metadata.get("post_id") in public_post_ids:
                similarity = max(0.0, min(1.0, 1 - distance))
                matches.append((metadata, document, similarity, chunk_id))
        return matches

    async def search(self, query: str, top_k: int = 5) -> tuple[List[dict], bool]:
        """
        Retur (chunks, needsKnowledge).
        needsKnowledge=False 时 chunks 为空——调用方应走纯聊天。
        """
        q_embedding = (await self._embed_texts([query]))[0]

        results = await asyncio.to_thread(
            self._collection.query,
            query_embeddings=[q_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"],
        )

        if not results["ids"] or not results["ids"][0]:
            return [], False

        candidate_post_ids = {
            metadata.get("post_id")
            for metadata in results["metadatas"][0]
            if metadata and metadata.get("post_id")
        }
        # The database is the authorization source of truth. Fail closed when the
        # current public state cannot be verified, even if stale vectors exist.
        public_post_ids = await self._fetch_public_post_ids(candidate_post_ids)
        matches = self._filter_public_matches(
            results["ids"][0],
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
            public_post_ids,
        )
        similarities = [match[2] for match in matches]
        needs_kb = self._needs_knowledge(similarities, self.RELEVANCE_THRESHOLD)

        logger.info(
            "Knowledge search completed candidate_count=%d public_count=%d relevant=%s top_score=%.3f",
            len(candidate_post_ids),
            len(public_post_ids),
            needs_kb,
            similarities[0] if similarities else 0.0,
        )

        if not needs_kb:
            return [], False

        chunks = []
        for meta, doc, similarity, chunk_id in matches:
            chunks.append({
                "chunk_id": chunk_id,
                "post_id": meta["post_id"],
                "content": doc,
                "title": meta["post_title"],
                "slug": meta["post_slug"],
                "score": round(similarity, 3),
            })

        return chunks, True


# ── Singleton ─────────────────────────────────────────
_kb: Optional[KnowledgeBase] = None


def get_kb() -> KnowledgeBase:
    global _kb
    if _kb is None:
        _kb = KnowledgeBase()
    return _kb
