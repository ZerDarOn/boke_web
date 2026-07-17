"""Deterministic retrieval metrics for model-free RAG evaluation runs."""

from typing import Any, Dict, List, Mapping


def _safe_ratio(numerator: float, denominator: int) -> float:
    return round(numerator / denominator, 4) if denominator else 0.0


def evaluate_retrieval_cases(
    cases: List[Mapping[str, Any]],
    observations: Mapping[str, Mapping[str, Any]],
) -> Dict[str, Any]:
    answerability_matches = 0
    answerable_count = 0
    retrieval_hits = 0
    reciprocal_rank_total = 0.0
    refusal_count = 0
    correct_refusals = 0
    details = []

    for case in cases:
        case_id = str(case["id"])
        should_answer = bool(case["should_answer"])
        expected_slugs = {str(slug) for slug in case.get("expected_slugs", [])}
        observation = observations.get(case_id, {})
        needs_knowledge = bool(observation.get("needs_knowledge", False))
        retrieved_slugs = [str(slug) for slug in observation.get("slugs", [])]

        answerability_matches += int(needs_knowledge == should_answer)
        first_relevant_rank = next(
            (
                index
                for index, slug in enumerate(retrieved_slugs, start=1)
                if slug in expected_slugs
            ),
            None,
        )

        if should_answer:
            answerable_count += 1
            if first_relevant_rank is not None:
                retrieval_hits += 1
                reciprocal_rank_total += 1 / first_relevant_rank
        else:
            refusal_count += 1
            correct_refusals += int(not needs_knowledge)

        details.append({
            "id": case_id,
            "should_answer": should_answer,
            "needs_knowledge": needs_knowledge,
            "first_relevant_rank": first_relevant_rank,
        })

    return {
        "case_count": len(cases),
        "answerability_accuracy": _safe_ratio(answerability_matches, len(cases)),
        "retrieval_hit_rate": _safe_ratio(retrieval_hits, answerable_count),
        "mean_reciprocal_rank": _safe_ratio(reciprocal_rank_total, answerable_count),
        "refusal_accuracy": _safe_ratio(correct_refusals, refusal_count),
        "details": details,
    }
