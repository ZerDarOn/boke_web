"""Provider-neutral AI gateway and bounded content-analysis tasks."""

from abc import ABC, abstractmethod
import logging
import time
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.services.ai_task_policy import AITask, get_task_policy, parse_json_object

logger = logging.getLogger("ai-service.gateway")


class AIProviderUnavailableError(RuntimeError):
    pass


class LLMProvider(ABC):
    @property
    def name(self) -> str:
        return self.__class__.__name__.removesuffix("Provider").lower()

    @abstractmethod
    async def generate(self, prompt: str, **kwargs: Any) -> str:
        raise NotImplementedError

    @abstractmethod
    async def is_available(self) -> bool:
        raise NotImplementedError


class OpenAIProvider(LLMProvider):
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self._client = None

    async def is_available(self) -> bool:
        return bool(self.api_key)

    def _get_client(self):
        if self._client is None:
            from openai import AsyncOpenAI
            init_params = {"api_key": self.api_key}
            if settings.OPENAI_BASE_URL:
                init_params["base_url"] = settings.OPENAI_BASE_URL
            self._client = AsyncOpenAI(**init_params)
        return self._client

    @staticmethod
    def _select_model(task: AITask) -> str:
        policy = get_task_policy(task)
        if policy.model_tier == "fast" and settings.OPENAI_FAST_MODEL:
            return settings.OPENAI_FAST_MODEL
        if policy.model_tier == "standard" and settings.OPENAI_STANDARD_MODEL:
            return settings.OPENAI_STANDARD_MODEL
        return settings.OPENAI_MODEL

    async def generate(self, prompt: str, **kwargs: Any) -> str:
        task = kwargs.get("task", AITask.CHAT)
        policy = get_task_policy(task)
        request: Dict[str, Any] = {
            "model": self._select_model(task),
            "messages": [{"role": "user", "content": prompt}],
            "temperature": kwargs.get("temperature", settings.OPENAI_TEMPERATURE),
            "max_tokens": kwargs.get("max_tokens", policy.max_output_tokens),
            "timeout": kwargs.get("timeout", settings.OPENAI_TIMEOUT),
        }
        if policy.structured_output:
            request["response_format"] = {"type": "json_object"}

        response = await self._get_client().chat.completions.create(**request)
        return response.choices[0].message.content or ""


class AnthropicProvider(LLMProvider):
    def __init__(self):
        self.api_key = settings.ANTHROPIC_API_KEY
        self._client = None

    async def is_available(self) -> bool:
        return bool(self.api_key)

    def _get_client(self):
        if self._client is None:
            from anthropic import AsyncAnthropic
            self._client = AsyncAnthropic(api_key=self.api_key)
        return self._client

    async def generate(self, prompt: str, **kwargs: Any) -> str:
        task = kwargs.get("task", AITask.CHAT)
        policy = get_task_policy(task)
        response = await self._get_client().messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=kwargs.get("max_tokens", min(policy.max_output_tokens, settings.ANTHROPIC_MAX_TOKENS)),
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text


class LocalLLMProvider(LLMProvider):
    def __init__(self):
        self.base_url = settings.LOCAL_LLM_URL.rstrip("/")
        self.model = settings.LOCAL_LLM_MODEL

    async def is_available(self) -> bool:
        return bool(self.base_url)

    async def generate(self, prompt: str, **kwargs: Any) -> str:
        import httpx

        task = kwargs.get("task", AITask.CHAT)
        policy = get_task_policy(task)
        payload: Dict[str, Any] = {
            "model": self.model or "llama3.2",
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "max_tokens": kwargs.get("max_tokens", policy.max_output_tokens),
        }
        if policy.structured_output:
            payload["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=settings.OPENAI_TIMEOUT) as client:
            response = await client.post(f"{self.base_url}/chat/completions", json=payload)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]


class AIService:
    def __init__(self, providers: Optional[List[LLMProvider]] = None):
        self.providers = providers if providers is not None else [OpenAIProvider(), AnthropicProvider(), LocalLLMProvider()]

    async def generate(self, prompt: str, task: AITask = AITask.CHAT, **kwargs: Any) -> str:
        failures: List[str] = []
        for provider in self.providers:
            if not await provider.is_available():
                continue

            started_at = time.monotonic()
            logger.info("AI task started provider=%s task=%s", provider.name, task.value)
            try:
                result = await provider.generate(prompt, task=task, **kwargs)
                logger.info(
                    "AI task completed provider=%s task=%s duration_ms=%d",
                    provider.name,
                    task.value,
                    int((time.monotonic() - started_at) * 1000),
                )
                return result
            except Exception as exc:
                failures.append(f"{provider.name}:{type(exc).__name__}")
                logger.warning(
                    "AI provider failed provider=%s task=%s duration_ms=%d error_type=%s",
                    provider.name,
                    task.value,
                    int((time.monotonic() - started_at) * 1000),
                    type(exc).__name__,
                )

        failure_summary = ",".join(failures) if failures else "no-provider-configured"
        raise AIProviderUnavailableError(f"No AI provider completed the task ({failure_summary})")

    async def generate_json(self, prompt: str, task: AITask) -> Dict[str, Any]:
        return parse_json_object(await self.generate(prompt, task=task))

    async def provider_status(self) -> Dict[str, Any]:
        """Return availability of each configured provider (used by /reload-config)."""
        result = {}
        for p in self.providers:
            try:
                result[p.name] = await p.is_available()
            except Exception:
                result[p.name] = False
        return result


class ContentAnalyzer:
    def __init__(self, ai_service: Optional[AIService] = None):
        self.ai_service = ai_service or AIService()

    async def summarize(self, content: str, max_length: int = 200) -> dict:
        result = await self.ai_service.generate_json(
            f"""请将以下文章总结为不超过 {max_length} 字的摘要，并只返回 JSON 对象：
{{"summary":"摘要","key_points":["要点"],"word_count":0}}

文章：
{content}""",
            AITask.SUMMARIZE,
        )
        summary = str(result.get("summary", ""))[:max_length]
        raw_key_points = result.get("key_points", [])
        key_points = (
            [str(item) for item in raw_key_points if str(item).strip()][:5]
            if isinstance(raw_key_points, list)
            else []
        )
        return {"summary": summary, "key_points": key_points, "word_count": len(summary)}

    async def extract_keywords(self, content: str, max_keywords: int = 10) -> dict:
        result = await self.ai_service.generate_json(
            f"""从以下内容提取最多 {max_keywords} 个关键词和最多 5 个标签，只返回 JSON 对象：
{{"keywords":[{{"word":"关键词","score":0.9}}],"tags":["标签"]}}

内容：
{content}""",
            AITask.KEYWORDS,
        )
        keywords = result.get("keywords", [])
        tags = result.get("tags", [])
        return {
            "keywords": keywords[:max_keywords] if isinstance(keywords, list) else [],
            "tags": [str(tag) for tag in tags[:5]] if isinstance(tags, list) else [],
        }

    async def generate_tags(self, title: str, content: str, max_tags: int = 5) -> dict:
        result = await self.ai_service.generate_json(
            f"""为文章生成最多 {max_tags} 个简洁且相关的标签，只返回 JSON 对象：
{{"tags":["标签"]}}

标题：{title}
内容：{content}""",
            AITask.TAGS,
        )
        raw_tags = result.get("tags", [])
        tags = [str(tag).strip() for tag in raw_tags if str(tag).strip()][:max_tags] if isinstance(raw_tags, list) else []
        return {"tags": tags, "confidence": [1.0] * len(tags)}
