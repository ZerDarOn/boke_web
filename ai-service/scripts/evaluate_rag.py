"""Run model-free retrieval evaluation against the configured knowledge index."""

import argparse
import asyncio
import json
from pathlib import Path
import sys

SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from app.services.knowledge_base import get_kb
from app.services.rag_evaluation import evaluate_retrieval_cases

DEFAULT_CASES_PATH = SERVICE_ROOT / "evals" / "rag_cases.json"


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate RAG retrieval without calling a chat model")
    parser.add_argument("--cases", type=Path, default=DEFAULT_CASES_PATH)
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--min-hit-rate", type=float, default=0.7)
    parser.add_argument("--min-answerability", type=float, default=0.7)
    return parser.parse_args()


async def evaluate(cases_path: Path, top_k: int) -> dict:
    cases = json.loads(cases_path.read_text(encoding="utf-8"))
    if not isinstance(cases, list) or not cases:
        raise ValueError("RAG evaluation cases must be a non-empty JSON array")

    knowledge_base = get_kb()
    observations = {}
    for case in cases:
        chunks, needs_knowledge = await knowledge_base.search(
            str(case["query"]),
            top_k=top_k,
        )
        observations[str(case["id"])] = {
            "needs_knowledge": needs_knowledge,
            "slugs": [chunk["slug"] for chunk in chunks],
        }

    return evaluate_retrieval_cases(cases, observations)


async def main() -> int:
    args = parse_arguments()
    metrics = await evaluate(args.cases.resolve(), max(1, min(args.top_k, 20)))
    print(json.dumps(metrics, ensure_ascii=False, indent=2))
    passed = (
        metrics["retrieval_hit_rate"] >= args.min_hit_rate
        and metrics["answerability_accuracy"] >= args.min_answerability
    )
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
