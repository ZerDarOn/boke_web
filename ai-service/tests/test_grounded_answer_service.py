import unittest
from types import SimpleNamespace

from app.services.ai_task_policy import AITask, get_task_policy
from app.services.grounded_answer_service import GroundedAnswerService
from app.services.rag_evaluation import evaluate_retrieval_cases


EVIDENCE = [
    {
        "chunk_id": "chunk-a",
        "post_id": "post-1",
        "title": "Water Ink Components",
        "slug": "ink-components",
        "content": "SVG filters replaced WebGL because they use fewer resources.",
        "score": 0.88,
    },
    {
        "chunk_id": "chunk-b",
        "post_id": "post-2",
        "title": "Other Article",
        "slug": "other",
        "content": "An unrelated but public passage.",
        "score": 0.61,
    },
]


class FakeAIService:
    def __init__(self, payload):
        self.payload = payload
        self.calls = []

    async def generate_json(self, prompt, task):
        self.calls.append((prompt, task))
        return self.payload


class FakePersonaService:
    def prompt_context(self, context):
        return f"你是墨璃。当前页面：{(context or {}).get('page_type', 'unknown')}。"


class GroundedAnswerTests(unittest.IsolatedAsyncioTestCase):
    async def test_valid_inline_citations_return_only_referenced_sources(self):
        ai_service = FakeAIService({
            "answer": "The implementation switched to SVG filters [S1].",
            "citations": ["S1"],
            "quotes": {"S1": "SVG filters replaced WebGL"},
        })
        service = GroundedAnswerService(ai_service)

        result = await service.answer("Why SVG?", [], EVIDENCE)

        self.assertTrue(result["grounded"])
        self.assertIsNone(result["refusal_reason"])
        self.assertEqual(result["confidence"], 0.88)
        self.assertEqual([source["citation"] for source in result["sources"]], ["S1"])
        self.assertEqual(result["sources"][0]["excerpt"], "SVG filters replaced WebGL")
        self.assertEqual(ai_service.calls[0][1], AITask.GROUNDED_CHAT)
        self.assertEqual(service.metrics_snapshot()["grounded_answers"], 1)

    async def test_persona_and_page_context_are_injected_before_generation(self):
        ai_service = FakeAIService({
            "answer": "这段记录提到了 SVG [S1]。",
            "citations": ["S1"],
            "quotes": {"S1": "SVG filters replaced WebGL"},
        })
        service = GroundedAnswerService(ai_service, FakePersonaService())

        await service.answer("为什么？", [], EVIDENCE, {"page_type": "post"})

        self.assertIn("你是墨璃。当前页面：post。", ai_service.calls[0][0])

    async def test_unknown_citation_fails_closed(self):
        service = GroundedAnswerService(FakeAIService({
            "answer": "This claim has no retrieved source [S9].",
            "citations": ["S9"],
            "quotes": {"S9": "fabricated quote"},
        }))

        result = await service.answer("Question", [], EVIDENCE)

        self.assertFalse(result["grounded"])
        self.assertEqual(result["refusal_reason"], "invalid_citations")
        self.assertEqual(result["sources"], [])
        self.assertEqual(service.metrics_snapshot()["refusals"]["invalid_citations"], 1)

    async def test_declared_citations_must_appear_inline(self):
        service = GroundedAnswerService(FakeAIService({
            "answer": "The answer omits its citation marker.",
            "citations": ["S1"],
            "quotes": {"S1": "SVG filters replaced WebGL"},
        }))

        result = await service.answer("Question", [], EVIDENCE)

        self.assertFalse(result["grounded"])
        self.assertEqual(result["refusal_reason"], "invalid_citations")

    async def test_quote_must_exist_in_its_retrieved_chunk(self):
        service = GroundedAnswerService(FakeAIService({
            "answer": "A fabricated claim [S1].",
            "citations": ["S1"],
            "quotes": {"S1": "This sentence never appeared in the article."},
        }))

        result = await service.answer("Question", [], EVIDENCE)

        self.assertFalse(result["grounded"])
        self.assertEqual(result["refusal_reason"], "invalid_citations")

    async def test_no_evidence_refuses_without_calling_the_model(self):
        ai_service = FakeAIService({"answer": "should not run", "citations": []})
        service = GroundedAnswerService(ai_service)

        result = await service.answer("Unknown", [], [])

        self.assertEqual(result["refusal_reason"], "insufficient_evidence")
        self.assertEqual(ai_service.calls, [])

    def test_grounded_chat_uses_structured_output(self):
        policy = get_task_policy(AITask.GROUNDED_CHAT)
        self.assertTrue(policy.structured_output)
        self.assertLessEqual(policy.max_output_tokens, 1600)

    def test_prompt_history_has_a_hard_character_budget(self):
        history = [
            SimpleNamespace(role="user", content="old" * 3000),
            SimpleNamespace(role="assistant", content="middle" * 2000),
            SimpleNamespace(role="user", content="recent" * 2000),
        ]

        formatted = GroundedAnswerService._format_history(history)

        self.assertLessEqual(len(formatted), 6000)
        self.assertIn("recent", formatted)
        self.assertNotIn("old", formatted)


class RetrievalEvaluationTests(unittest.TestCase):
    def test_evaluation_reports_hit_rate_rank_and_refusal_accuracy(self):
        cases = [
            {
                "id": "answerable",
                "should_answer": True,
                "expected_slugs": ["expected"],
            },
            {
                "id": "refusal",
                "should_answer": False,
                "expected_slugs": [],
            },
        ]
        observations = {
            "answerable": {"needs_knowledge": True, "slugs": ["other", "expected"]},
            "refusal": {"needs_knowledge": False, "slugs": []},
        }

        metrics = evaluate_retrieval_cases(cases, observations)

        self.assertEqual(metrics["answerability_accuracy"], 1.0)
        self.assertEqual(metrics["retrieval_hit_rate"], 1.0)
        self.assertEqual(metrics["mean_reciprocal_rank"], 0.5)


if __name__ == "__main__":
    unittest.main()
