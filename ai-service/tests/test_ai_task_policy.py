import unittest
from tempfile import TemporaryDirectory
from pathlib import Path

from app.services.ai_task_policy import AITask, get_task_policy, parse_json_object
from app.services.knowledge_base import KnowledgeBase


class AITaskPolicyTests(unittest.TestCase):
    def test_content_analysis_tasks_require_structured_output(self):
        for task in (AITask.SUMMARIZE, AITask.KEYWORDS, AITask.TAGS):
            policy = get_task_policy(task)
            self.assertTrue(policy.structured_output)
            self.assertLessEqual(policy.max_output_tokens, 1200)

    def test_chat_uses_text_output_and_a_bounded_history(self):
        policy = get_task_policy(AITask.CHAT)
        self.assertFalse(policy.structured_output)
        self.assertEqual(policy.max_history_messages, 10)

    def test_json_parser_accepts_fenced_model_output(self):
        payload = parse_json_object('```json\n{"tags": ["AI"]}\n```')
        self.assertEqual(payload, {"tags": ["AI"]})

    def test_active_index_pointer_round_trips(self):
        knowledge_base = KnowledgeBase.__new__(KnowledgeBase)
        with TemporaryDirectory() as temporary_directory:
            knowledge_base._active_collection_path = str(Path(temporary_directory) / "active.txt")
            knowledge_base._write_active_collection_name("blog_posts_version_a")
            self.assertEqual(knowledge_base._read_active_collection_name(), "blog_posts_version_a")

    def test_collection_cleanup_keeps_active_and_one_rollback_version(self):
        knowledge_base = KnowledgeBase.__new__(KnowledgeBase)
        knowledge_base._client = FakeClient([
            "blog_posts_old",
            "blog_posts_previous",
            "blog_posts_active",
            "unrelated_collection",
        ])

        knowledge_base._cleanup_superseded_collections(
            active_name="blog_posts_active",
            rollback_name="blog_posts_previous",
        )

        self.assertEqual(knowledge_base._client.deleted, ["blog_posts_old"])

    def test_search_matches_are_filtered_by_current_public_post_ids(self):
        matches = KnowledgeBase._filter_public_matches(
            chunk_ids=["chunk-public", "chunk-private"],
            documents=["public text", "private text"],
            metadatas=[
                {"post_id": "public", "post_title": "Public", "post_slug": "public"},
                {"post_id": "private", "post_title": "Private", "post_slug": "private"},
            ],
            distances=[0.1, 0.05],
            public_post_ids={"public"},
        )

        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0][0]["post_id"], "public")
        self.assertEqual(matches[0][3], "chunk-public")


class KnowledgeEmbeddingTests(unittest.IsolatedAsyncioTestCase):
    async def test_embeddings_are_requested_in_bounded_batches(self):
        knowledge_base = KnowledgeBase.__new__(KnowledgeBase)
        knowledge_base.EMBEDDING_BATCH_SIZE = 2
        batches = []

        def embed(texts):
            batches.append(list(texts))
            return [[float(len(text))] for text in texts]

        knowledge_base._get_embed_fn = lambda: embed
        embeddings = await knowledge_base._embed_texts(["a", "bb", "ccc", "dddd", "eeeee"])

        self.assertEqual([len(batch) for batch in batches], [2, 2, 1])
        self.assertEqual(embeddings, [[1.0], [2.0], [3.0], [4.0], [5.0]])

    def test_long_paragraphs_are_split_to_the_hard_chunk_limit(self):
        chunks = KnowledgeBase._chunk_post(
            "Long post",
            "x" * 1500,
            chunk_size=600,
            overlap=80,
        )

        self.assertGreater(len(chunks), 1)
        self.assertTrue(all(len(chunk) <= 600 for chunk in chunks))

    async def test_incremental_index_skips_unchanged_content(self):
        knowledge_base = KnowledgeBase.__new__(KnowledgeBase)
        post = {
            "id": "post-1",
            "title": "Title",
            "slug": "title",
            "content": "First paragraph.",
        }
        content_hash = knowledge_base._content_hash(post)
        collection = FakeCollection(
            ids=["chunk-1"],
            metadatas=[{"post_id": "post-1", "content_hash": content_hash}],
        )
        knowledge_base._collection = collection

        async def unexpected_embedding(_texts):
            self.fail("unchanged content must not request embeddings")

        knowledge_base._embed_texts = unexpected_embedding
        result = await knowledge_base._upsert_post_unlocked(post)

        self.assertEqual(result["action"], "unchanged")
        self.assertEqual(collection.upserts, [])

    async def test_incremental_index_removes_stale_chunks_after_upsert(self):
        knowledge_base = KnowledgeBase.__new__(KnowledgeBase)
        knowledge_base.CHUNK_SIZE = 20
        knowledge_base.CHUNK_OVERLAP = 0
        collection = FakeCollection(
            ids=["old-1", "old-2", "old-3"],
            metadatas=[
                {"post_id": "post-1", "content_hash": "old"},
                {"post_id": "post-1", "content_hash": "old"},
                {"post_id": "post-1", "content_hash": "old"},
            ],
        )
        knowledge_base._collection = collection

        async def embed(texts):
            return [[float(index)] for index, _text in enumerate(texts)]

        knowledge_base._embed_texts = embed
        result = await knowledge_base._upsert_post_unlocked({
            "id": "post-1",
            "title": "Title",
            "slug": "title",
            "content": "Short content.",
        })

        self.assertEqual(result["action"], "updated")
        self.assertEqual(len(collection.upserts), 1)
        self.assertEqual(collection.deleted_ids, ["old-1", "old-2", "old-3"])


class FakeCollection:
    def __init__(self, ids=None, metadatas=None):
        self.ids = list(ids or [])
        self.metadatas = list(metadatas or [])
        self.upserts = []
        self.deleted_ids = []

    def get(self, where=None, include=None):
        post_id = where.get("post_id") if where else None
        matching = [
            (chunk_id, metadata)
            for chunk_id, metadata in zip(self.ids, self.metadatas)
            if post_id is None or metadata.get("post_id") == post_id
        ]
        return {
            "ids": [item[0] for item in matching],
            "metadatas": [item[1] for item in matching],
        }

    def upsert(self, **payload):
        self.upserts.append(payload)

    def delete(self, ids=None, where=None):
        if ids:
            self.deleted_ids.extend(ids)


class FakeClient:
    def __init__(self, collection_names):
        self.collection_names = collection_names
        self.deleted = []

    def list_collections(self):
        return self.collection_names

    def delete_collection(self, name):
        self.deleted.append(name)


if __name__ == "__main__":
    unittest.main()
