"""Stable task contracts shared by AI providers and content features."""

from dataclasses import dataclass
from enum import Enum
import json
from typing import Any, Dict


class AITask(str, Enum):
    SUMMARIZE = "summarize"
    KEYWORDS = "keywords"
    TAGS = "tags"
    CHAT = "chat"
    GROUNDED_CHAT = "grounded_chat"


@dataclass(frozen=True)
class AITaskPolicy:
    model_tier: str
    max_output_tokens: int
    structured_output: bool = False
    max_history_messages: int = 0


_TASK_POLICIES = {
    AITask.SUMMARIZE: AITaskPolicy("fast", 800, structured_output=True),
    AITask.KEYWORDS: AITaskPolicy("fast", 800, structured_output=True),
    AITask.TAGS: AITaskPolicy("fast", 500, structured_output=True),
    AITask.CHAT: AITaskPolicy("standard", 1600, max_history_messages=10),
    AITask.GROUNDED_CHAT: AITaskPolicy(
        "standard",
        1600,
        structured_output=True,
        max_history_messages=10,
    ),
}


def get_task_policy(task: AITask) -> AITaskPolicy:
    return _TASK_POLICIES[task]


def parse_json_object(raw_output: str) -> Dict[str, Any]:
    """Parse an object response while tolerating common Markdown fences."""
    normalized = raw_output.strip()
    if normalized.startswith("```"):
        lines = normalized.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        normalized = "\n".join(lines).strip()

    parsed = json.loads(normalized)
    if not isinstance(parsed, dict):
        raise ValueError("AI structured output must be a JSON object")
    return parsed
