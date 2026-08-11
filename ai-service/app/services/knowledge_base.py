"""
Knowledge Base Service — Smart RAG with embedding + semantic search

Architecture:
  Query → Embed → vector search → relevance check →
    ├─ HIGH relevance → prepend context → LLM (knowledge-grounded answer)
    └─ LOW  relevance → system prompt only → LLM (chat normally)

Indexing:
  Fetches published posts from PostgreSQL, chunks by paragraph,
  embeds via OpenAI, stores in a persistent pure-Python vector index
  (numpy cosine search — no native compilation dependencies).
"""

import os
import json
import hashlib
import logging
import asyncio
import uuid
from datetime import datetime, timezone
from typing import Any, List, Mapping, Optional
from dataclasses import dataclass

import numpy as np

logger = logging.getLogger("ai-service.kb")

# ─────────────────────────────────────────────────────────
# Pure-Python vector store (drop-in replacement for the subset
# of the ChromaDB API used below — no chroma-hnswlib needed)
# ─────────────────────────────────────────────────────────


class MemoryCollection:
    """In-memory collection with cosine search, persisted as .npz snapshots."""

    def __init__(self, name: str, metadata: Optional[dict] = None):
        self.name = name
        self.metadata = metadata or {}
        self._ids: List[str] = []
        self._documents: List[str] = []
        self._metadatas: List[dict] = []
        self._embeddings: List[List[float]] = []

    def count(self) -> int:
        return len(self._ids)

    def get(
        self,
        where: Optional[dict] = None,
        include: Optional[List[str]] = None,
    ) -> dict:
        include = include or []
        ids: List[str] = []
        metadatas: List[dict] = []
        documents: List[str] = []
        for i, chunk_id in enumerate(self._ids):
            if where is not None:
                metadata = self._metadatas[i]
                if any(metadata.get(key) != value for key, value in where.items()):
                    continue
            ids.append(chunk_id)
            if "metadatas" in include:
                metadatas.append(self._metadatas[i])
            if "documents" in include:
                documents.append(self._documents[i])
        result: dict = {"ids": ids}
        if "metadatas" in include:
            result["metadatas"] = metadatas
        if "documents" in include:
            result["documents"] = documents
        return result

    def add(
        self,
        ids=None,
        embeddings=None,
        documents=None,
        metadatas=None,
    ) -> None:
        self._ids.extend(ids or [])
        self._embeddings.extend(embeddings or [])
        self._documents.extend(documents or [])
        self._metadatas.extend(metadatas or [])

    def upsert(
        self,
        ids=None,
        embeddings=None,
        documents=None,
        metadatas=None,
    ) -> None:
        index_by_id = {chunk_id: i for i, chunk_id in enumerate(self._ids)}
        for chunk_id, embedding, document, metadata in zip(
            ids or [],
            embeddings or [],
            documents or [],
            metadatas or [],
        ):
            index = index_by_id.get(chunk_id)
            if index is None:
                index_by_id[chunk_id] = len(self._ids)
                self._ids.append(chunk_id)
                self._embeddings.append(embedding)
                self._documents.append(document)
                self._metadatas.append(metadata)
            else:
                self._embeddings[index] = embedding
                self._documents[index] = document
                self._metadatas[index] = metadata

    def delete(self, ids=None, where=None) -> None:
        if ids is not None:
            to_delete = set(ids)
            kept = [
                (chunk_id, embedding, document, metadata)
                for chunk_id, embedding, document, metadata in zip(
                    self._ids,
                    self._embeddings,
                    self._documents,
                    self._metadatas,
                )
                if chunk_id not in to_delete
            ]
            self._ids = [item[0] for item in kept]
            self._embeddings = [item[1] for item in kept]
            self._documents = [item[2] for item in kept]
            self._metadatas = [item[3] for item in kept]
        elif where is not None:
            kept = [
                (chunk_id, embedding, document, metadata)
                for chunk_id, embedding, document, metadata in zip(
                    self._ids,
                    self._embeddings,
                    self._documents,
                    self._metadatas,
                )
                if not any(metadata.get(key) != value for key, value in where.items())
            ]
            self._ids = [item[0] for item in kept]
            self._embeddings = [item[1] for item in kept]
            self._documents = [item[2] for item in kept]
            self._metadatas = [item[3] for item in kept]

    def query(
        self,
        query_embeddings=None,
        n_results: int = 10,
        include: Optional[List[str]] = None,
    ) -> dict:
        include = include or []
        empty = {"ids": [[]], "documents": [[]], "metadatas": [[]], "distances": [[]]}
        query_embeddings = list(query_embeddings or [])
        if not self._ids or not query_embeddings:
            return empty

        matrix = np.asarray(self._embeddings, dtype=np.float32)
        norms = np.linalg.norm(matrix, axis=1)
        ids_out: List[List[str]] = []
        documents_out: List[List[str]] = []
        metadatas_out: List[List[dict]] = []
        distances_out: List[List[float]] = []

        for query in query_embeddings:
            query = np.asarray(query, dtype=np.float32).ravel()
            query_norm = np.linalg.norm(query)
            similarities = (matrix @ query) / np.maximum(norms * query_norm, 1e-9)
            k = min(int(n_results), len(self._ids))
            if k <= 0:
                ids_out.append([])
                documents_out.append([])
                metadatas_out.append([])
                distances_out.append([])
                continue
            order = np.argsort(-similarities)[:k].tolist()
            ids_out.append([self._ids[i] for i in order])
            if "documents" in include:
                documents_out.append([self._documents[i] for i in order])
            if "metadatas" in include:
                metadatas_out.append([self._metadatas[i] for i in order])
            distances_out.append([float(1 - similarities[i]) for i in order])

        result: dict = {"ids": ids_out, "distances": distances_out}
        if "documents" in include:
            result["documents"] = documents_out
        if "metadatas" in include:
            result["metadatas"] = metadatas_out
        return result

    # ── persistence ────────────────────────────────────

    def persist(self, path: str) -> None:
        """Atomically write the collection snapshot to <path> (.npz)."""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        embeddings = (
            np.asarray(self._embeddings, dtype=np.float32)
            if self._embeddings
            else np.zeros((0, 1), dtype=np.float32)
        )
        payload = json.dumps(
            {
                "ids": self._ids,
                "documents": self._documents,
                "metadatas": self._metadatas,
            },
            ensure_ascii=False,
        )
        # np.savez appends ".npz" to the given path, so the temp file is
        # <path>.<uuid>.npz; replace() then moves it into place atomically.
        temporary = f"{path}.{uuid.uuid4().hex}"
        try:
            np.savez_compressed(
                temporary,
                embeddings=embeddings,
                payload=np.array([payload], dtype="U"),
            )
            os.replace(f"{temporary}.npz", path)
        finally:
            leftover = f"{temporary}.npz"
            if os.path.exists(leftover):
                os.remove(leftover)

    @classmethod
    def load(cls, name: str, path: str) -> "MemoryCollection":
        collection = cls(name=name)
        if not os.path.exists(path):
            return collection
        with np.load(path, allow_pickle=False) as data:
            payload = json.loads(str(data["payload"][0]))
            collection._ids = list(payload["ids"])
            collection._documents = list(payload["documents"])
            collection._metadatas = list(payload["metadatas"])
            collection._embeddings = data["embeddings"].tolist()
        return collection


class MemoryIndexClient:
    """Manages versioned collection snapshots on disk (no native deps)."""

    def __init__(self, persist_dir: str):
        self._persist_dir = persist_dir
        os.makedirs(persist_dir, exist_ok=True)

    def collection_path(self, name: str) -> str:
        return os.path.join(self._persist_dir, f"{name}.npz")

    def create_collection(self, name: str, metadata: Optional[dict] = None) -> MemoryCollection:
        return MemoryCollection(name=name, metadata=metadata)

    def get_or_create_collection(self, name: str, metadata: Optional[dict] = None) -> MemoryCollection:
        path = self.collection_path(name)
        if os.path.exists(path):
            return MemoryCollection.load(name, path)
        return MemoryCollection(name=name, metadata=metadata)

    def list_collections(self) -> List[str]:
        return [
            filename[: -len(".npz")]
            for filename in os.listdir(self._persist_dir)
            if filename.endswith(".npz")
        ]

    def delete_collection(self, name: str) -> None:
        path = self.collection_path(name)
        if os.path.exists(path):
            os.remove(path)

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
# Knowledge Base
# ─────────────────────────────────────────────────────────


class KnowledgeBase:
    """Smart RAG knowledge base backed by a pure-Python vector index."""

    COLLECTION_NAME = "blog_posts"
    ACTIVE_COLLECTION_FILE = "active_collection.txt"
    EMBEDDING_BATCH_SIZE = 10  # Qwen text-embedding-v3 单批上限 10 条
    RELEVANCE_THRESHOLD = 0.6  # Qwen embedding 相似度偏高，0.45 会把闲聊误判为知识问题
    CHUNK_SIZE = 600             # 每个 chunk 的字符数
    CHUNK_OVERLAP = 80           # 相邻 chunk 的重叠字符数

    def __init__(self, persist_dir: str = None):
        if persist_dir is None:
            persist_dir = os.path.join(os.path.dirname(__file__), "..", "..", "kb_data")

        os.makedirs(persist_dir, exist_ok=True)
        self._persist_dir = os.path.abspath(persist_dir)
        self._active_collection_path = os.path.join(self._persist_dir, self.ACTIVE_COLLECTION_FILE)

        self._client = MemoryIndexClient(persist_dir)
        self._collection = self._client.get_or_create_collection(
            name=self._read_active_collection_name(),
            metadata={"space": "cosine"},
        )
        self._embedding_fn = None  # lazy init
        self._mutation_lock = asyncio.Lock()
        self._last_operation: Optional[str] = None
        self._last_mutation_at: Optional[str] = None
        self._last_error: Optional[str] = None

    def _persist_active_collection(self) -> None:
        """Write the active collection snapshot to disk."""
        self._collection.persist(self._client.collection_path(self._collection.name))

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
            # 优先使用独立的 embedding 配置，未配置则回退到 OPENAI_API_KEY
            api_key = settings.EMBEDDING_API_KEY or settings.OPENAI_API_KEY
            if not api_key:
                raise RuntimeError("EMBEDDING_API_KEY / OPENAI_API_KEY not configured — needed for embeddings")
            extra = {}
            base_url = settings.EMBEDDING_BASE_URL or settings.OPENAI_BASE_URL
            if base_url:
                extra["base_url"] = base_url
            client = OpenAI(api_key=api_key, **extra)
            model = settings.EMBEDDING_MODEL or "text-embedding-3-small"

            def embed(texts: List[str]) -> List[List[float]]:
                resp = client.embeddings.create(
                    model=model,
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

    # ── 占卜知识（内置，无需数据库）─────────────────────

    DIVINATION_POST_ID_PREFIX = "div-"

    @staticmethod
    def _is_divination_post_id(post_id: str) -> bool:
        return post_id.startswith(KnowledgeBase.DIVINATION_POST_ID_PREFIX)

    def _load_divination_documents(self) -> List[dict]:
        """
        从 frontend 读取占卜数据（塔罗/易经/星座），构造成与 posts 同构的文档
        （{id, title, slug, content}），id 以 "div-" 开头。文件缺失时返回空列表。
        """
        base = os.path.join(
            os.path.dirname(__file__),
            "..", "..", "..",
            "frontend", "src", "pages", "divination",
        )
        documents: List[dict] = []

        # 塔罗（tarot-zhtw.json）
        tarot_path = os.path.join(base, "tarot-zhtw.json")
        if os.path.exists(tarot_path):
            try:
                with open(tarot_path, encoding="utf-8") as fp:
                    cards = json.load(fp)
                for card_id, card in (cards or {}).items():
                    if not isinstance(card, dict):
                        continue
                    name = card.get("name", f"牌{card_id}")
                    positive = card.get("positive") or {}
                    reversed_ = card.get("reversed") or {}
                    content = (
                        f"塔罗牌「{name}」。牌面象征：{card.get('explain', '')}\n"
                        f"正位解读：含义 {positive.get('meaning', '')}；行为特质 {positive.get('behavior', '')}；"
                        f"感情 {positive.get('marriage', '')}；两性关系 {positive.get('sexuality', '')}；相关 {positive.get('related', '')}\n"
                        f"逆位解读：含义 {reversed_.get('meaning', '')}；行为特质 {reversed_.get('behavior', '')}；"
                        f"感情 {reversed_.get('marriage', '')}；两性关系 {reversed_.get('sexuality', '')}；相关 {reversed_.get('related', '')}"
                    )
                    documents.append({
                        "id": f"{self.DIVINATION_POST_ID_PREFIX}tarot-{card_id}",
                        "title": f"塔罗牌·{name}",
                        "slug": f"tarot-{card_id}",
                        "content": content,
                    })
            except (OSError, ValueError) as error:
                logger.warning("Knowledge divination tarot load failed error=%s", type(error).__name__)

        # 易经（zhouyi.json）
        zhouyi_path = os.path.join(base, "zhouyi.json")
        if os.path.exists(zhouyi_path):
            try:
                with open(zhouyi_path, encoding="utf-8") as fp:
                    hexagrams = json.load(fp)
                for num, gua in (hexagrams or {}).items():
                    if not isinstance(gua, dict):
                        continue
                    name = gua.get("name", f"第{num}卦")
                    reading = gua.get("reading") or {}
                    content = (
                        f"易经「{name}」卦（第{num}卦，{gua.get('fullName', '')}）。"
                        f"卦辞：{gua.get('judgment', '')} {gua.get('judgmentTrans', '')}\n"
                        f"彖传：{gua.get('tuan', '')}\n象传：{gua.get('image', '')}\n"
                        f"古解：{gua.get('guaYi', '')} 吉凶：{gua.get('jixiong', '')}\n"
                        f"事业：{reading.get('shiyi', '')}\n爱情：{reading.get('aiqing', '')}\n财运：{reading.get('caiyun', '')}\n"
                        f"学业：{reading.get('kaoshi', '')}\n健康：{reading.get('jiankang', '')}\n出行：{reading.get('chuxing', '')}\n"
                        f"官司：{reading.get('guansi', '')}\n家宅：{reading.get('jiazhai', '')}\n"
                        f"宜：{'、'.join(gua.get('yi') or [])}\n忌：{'、'.join(gua.get('ji') or [])}"
                    )
                    documents.append({
                        "id": f"{self.DIVINATION_POST_ID_PREFIX}zhouyi-{num}",
                        "title": f"易经·{name}",
                        "slug": f"zhouyi-{num}",
                        "content": content,
                    })
            except (OSError, ValueError) as error:
                logger.warning("Knowledge divination zhouyi load failed error=%s", type(error).__name__)

        # 星座（zodiac-deep.json）
        zodiac_path = os.path.join(base, "zodiac-deep.json")
        if os.path.exists(zodiac_path):
            try:
                with open(zodiac_path, encoding="utf-8") as fp:
                    signs = json.load(fp)
                for key, sign in (signs or {}).items():
                    if not isinstance(sign, dict):
                        continue
                    name = sign.get("name", key)
                    content = (
                        f"星座「{name}」({sign.get('nameEn', '')}，{sign.get('dateRange', '')})。"
                        f"关键词：{sign.get('keyword', '')}；元素：{sign.get('element', '')}；"
                        f"特质：{'、'.join(sign.get('coreTraits') or [])}\n"
                        f"性格：{sign.get('personality', '')}\n内心世界：{sign.get('innerWorld', '')}\n"
                        f"爱情：{sign.get('love', '')}\n事业：{sign.get('career', '')}\n财运：{sign.get('finance', '')}\n"
                        f"健康：{sign.get('health', '')}\n成长课题：{sign.get('growth', '')}"
                    )
                    documents.append({
                        "id": f"{self.DIVINATION_POST_ID_PREFIX}zodiac-{key}",
                        "title": f"星座·{name}",
                        "slug": f"zodiac-{key}",
                        "content": content,
                    })
            except (OSError, ValueError) as error:
                logger.warning("Knowledge divination zodiac load failed error=%s", type(error).__name__)

        return documents

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
                await asyncio.to_thread(self._persist_active_collection)
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
                await asyncio.to_thread(self._persist_active_collection)
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
        embed, and replace the active collection.
        """
        rows = await self._fetch_public_posts()
        div_docs = self._load_divination_documents()

        # 分块（文章 + 占卜知识）
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
        for doc in div_docs:
            doc_chunks = self._chunk_post(doc["title"], doc["content"], self.CHUNK_SIZE, self.CHUNK_OVERLAP)
            for i, chunk_text in enumerate(doc_chunks):
                chunk_id = self._chunk_id(doc["id"], i)
                all_chunks.append(DocumentChunk(
                    id=chunk_id,
                    post_id=doc["id"],
                    post_title=doc["title"],
                    post_slug=doc["slug"],
                    content=chunk_text,
                    index=i,
                ))

        # 嵌入 & 写入向量库
        texts = [f"[{c.post_title}]\n{c.content}" for c in all_chunks]
        embeddings = await self._embed_texts(texts) if texts else []
        content_hashes = {
            str(row["id"]): self._content_hash(row) for row in rows
        }
        for doc in div_docs:
            content_hashes[doc["id"]] = self._content_hash(doc)

        # Build a complete version before atomically switching the active pointer.
        staging_name = f"{self.COLLECTION_NAME}_{uuid.uuid4().hex}"
        staging_collection = self._client.create_collection(
            name=staging_name,
            metadata={"space": "cosine"},
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

        # Persist the snapshot first, then atomically switch the active pointer.
        try:
            await asyncio.to_thread(
                staging_collection.persist,
                self._client.collection_path(staging_name),
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
                div_docs = self._load_divination_documents()
                public_ids = {str(row["id"]) for row in rows} | {
                    doc["id"] for doc in div_docs
                }
                summary = {"updated": 0, "unchanged": 0, "removed": 0}
                for row in rows:
                    result = await self._upsert_post_unlocked(row)
                    summary[result["action"]] += 1
                for doc in div_docs:
                    result = await self._upsert_post_unlocked(doc)
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

                await asyncio.to_thread(self._persist_active_collection)
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
        # 占卜知识（div-*）为内置内容，无需数据库校验；其余以数据库为
        # 授权来源，Fail closed——无法验证当前公开状态时宁可丢弃。
        db_post_ids = {
            post_id
            for post_id in candidate_post_ids
            if not self._is_divination_post_id(post_id)
        }
        div_post_ids = candidate_post_ids - db_post_ids
        public_post_ids = await self._fetch_public_post_ids(db_post_ids)
        public_post_ids |= div_post_ids
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
