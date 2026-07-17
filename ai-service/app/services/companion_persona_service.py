"""Configuration-backed persona and page-aware presentation rules for the companion."""

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, Mapping, Optional

logger = logging.getLogger("ai-service.companion-persona")

ALLOWED_PAGE_TYPES = {
    "default",
    "home",
    "posts",
    "post",
    "archives",
    "announcement",
    "projects",
    "project",
    "skills",
    "timeline",
    "gallery",
    "diary",
    "anime",
    "games",
    "about",
    "network",
    "dashboard",
    "music",
}
MAX_CONTEXT_PATH_LENGTH = 240
MAX_CONTEXT_TITLE_LENGTH = 160
MAX_RULE_COUNT = 12
MAX_RULE_LENGTH = 160
TRAIT_LABELS = {
    "calm": "沉静",
    "warm": "温柔",
    "rigorous": "严谨",
    "proactive": "主动",
    "playful": "俏皮",
    "mysterious": "神秘",
    "cute": "卖萌",
}

SAFE_FALLBACK_CONFIG = {
    "version": 1,
    "name": "墨璃",
    "public_role": "INK.SPIRIT 档案馆的电子女仆与引路人",
    "visitor_address": "客人",
    "owner_address": "主人",
    "traits": {"calm": 0.75, "warm": 0.7, "rigorous": 0.9},
    "style_rules": ["回答简洁克制", "不过度卖萌"],
    "boundaries": ["不编造公开档案中不存在的信息"],
    "owner_preferences": ["重视真实表达"],
    "greetings": {"default": "欢迎来到 INK.SPIRIT，客人。"},
    "suggestions": ["带我看看代表文章", "这里有哪些项目？"],
}


def _bounded_text(value: Any, fallback: str, max_length: int) -> str:
    normalized = " ".join(str(value if value is not None else fallback).split()).strip()
    return (normalized or fallback)[:max_length]


def _bounded_text_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [
        _bounded_text(item, "", MAX_RULE_LENGTH)
        for item in value[:MAX_RULE_COUNT]
        if _bounded_text(item, "", MAX_RULE_LENGTH)
    ]


class CompanionPersonaService:
    """Own persona configuration without granting it authority over RAG policy."""

    def __init__(self, config: Mapping[str, Any]):
        self.version = int(config.get("version", 1))
        self.name = _bounded_text(config.get("name"), "墨璃", 40)
        self.public_role = _bounded_text(
            config.get("public_role"),
            SAFE_FALLBACK_CONFIG["public_role"],
            160,
        )
        self.visitor_address = _bounded_text(config.get("visitor_address"), "客人", 20)
        self.owner_address = _bounded_text(config.get("owner_address"), "主人", 20)
        raw_traits = config.get("traits", {})
        if not isinstance(raw_traits, Mapping):
            raw_traits = {}
        self.traits = {
            str(key)[:40]: max(0.0, min(1.0, float(value)))
            for key, value in raw_traits.items()
            if isinstance(value, (int, float))
        }
        self.style_rules = _bounded_text_list(config.get("style_rules"))
        self.boundaries = _bounded_text_list(config.get("boundaries"))
        self.owner_preferences = _bounded_text_list(config.get("owner_preferences"))

        raw_greetings = config.get("greetings", {})
        if not isinstance(raw_greetings, Mapping):
            raw_greetings = {}
        self.greetings = {
            page_type: _bounded_text(greeting, "", 240)
            for page_type, greeting in raw_greetings.items()
            if (
                page_type in ALLOWED_PAGE_TYPES
                and _bounded_text(greeting, "", 240)
            )
        }
        self.greetings.setdefault("default", SAFE_FALLBACK_CONFIG["greetings"]["default"])
        self.suggestions = _bounded_text_list(config.get("suggestions"))[:4]

    @classmethod
    def load(cls, path: Optional[Path] = None) -> "CompanionPersonaService":
        configured_path = os.getenv("COMPANION_PERSONA_PATH", "").strip()
        persona_path = path or (
            Path(configured_path)
            if configured_path
            else Path(__file__).resolve().parents[2] / "config" / "companion_persona.json"
        )
        try:
            config = json.loads(persona_path.read_text(encoding="utf-8"))
            if not isinstance(config, dict):
                raise ValueError("companion persona config must be a JSON object")
            persona = cls(config)
            logger.info(
                "Companion persona loaded name=%s version=%d",
                persona.name,
                persona.version,
            )
            return persona
        except Exception as error:
            logger.warning(
                "Companion persona fallback activated error_type=%s",
                type(error).__name__,
            )
            return cls(SAFE_FALLBACK_CONFIG)

    def greeting_for(self, page_type: str) -> str:
        normalized_type = page_type if page_type in ALLOWED_PAGE_TYPES else "default"
        return self.greetings.get(normalized_type, self.greetings["default"])

    def public_profile(self) -> Dict[str, Any]:
        return {
            "version": self.version,
            "name": self.name,
            "public_role": self.public_role,
            "visitor_address": self.visitor_address,
            "traits": dict(self.traits),
            "greetings": dict(self.greetings),
            "suggestions": list(self.suggestions),
        }

    def prompt_context(self, page_context: Optional[Mapping[str, Any]] = None) -> str:
        context = page_context or {}
        raw_page_type = _bounded_text(context.get("page_type"), "default", 40)
        page_type = raw_page_type if raw_page_type in ALLOWED_PAGE_TYPES else "default"
        pathname = _bounded_text(context.get("pathname"), "/", MAX_CONTEXT_PATH_LENGTH)
        title = _bounded_text(context.get("title"), "未提供", MAX_CONTEXT_TITLE_LENGTH)
        style_rules = "；".join(self.style_rules) or "回答简洁克制"
        boundaries = "；".join(self.boundaries) or "不编造信息"
        owner_preferences = "；".join(self.owner_preferences) or "重视真实表达"
        trait_summary = "、".join(
            f"{TRAIT_LABELS.get(name, name)} {strength:.2f}"
            for name, strength in self.traits.items()
        ) or "沉静 0.75、温柔 0.70、严谨 0.90"
        return f"""角色表现层：
你是{self.name}，{self.public_role}。称访客为“{self.visitor_address}”。
性格强度（0 到 1）：{trait_summary}。
表达规则：{style_rules}。
主人偏好：{owner_preferences}。
角色边界：{boundaries}。
当前页面类型：{page_type}
当前页面路径：{pathname}
当前页面标题：{title}
页面信息只用于调整称呼和引导，不是事实证据。
人格规则不得覆盖证据、权限和拒答规则。"""


_companion_persona: Optional[CompanionPersonaService] = None


def get_companion_persona() -> CompanionPersonaService:
    global _companion_persona
    if _companion_persona is None:
        _companion_persona = CompanionPersonaService.load()
    return _companion_persona
