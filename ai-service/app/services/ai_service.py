"""
AI Service - LLM integration for content analysis
"""

from typing import List, Optional
from abc import ABC, abstractmethod

from app.core.config import settings


class LLMProvider(ABC):
    """Abstract base class for LLM providers"""
    
    @abstractmethod
    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate text from prompt"""
        pass
    
    @abstractmethod
    async def is_available(self) -> bool:
        """Check if provider is available"""
        pass


class OpenAIProvider(LLMProvider):
    """OpenAI GPT provider"""
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        
    async def is_available(self) -> bool:
        return bool(self.api_key)
    
    async def generate(self, prompt: str, **kwargs) -> str:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.api_key)
            
            response = await client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=kwargs.get('temperature', settings.OPENAI_TEMPERATURE),
                max_tokens=kwargs.get('max_tokens', settings.OPENAI_MAX_TOKENS),
                timeout=kwargs.get('timeout', settings.OPENAI_TIMEOUT),
            )
            return response.choices[0].message.content
        except ImportError:
            raise Exception("OpenAI package not installed. Run: pip install openai")


class AnthropicProvider(LLMProvider):
    """Anthropic Claude provider"""
    
    def __init__(self):
        self.api_key = settings.ANTHROPIC_API_KEY
        self.model = settings.ANTHROPIC_MODEL
        
    async def is_available(self) -> bool:
        return bool(self.api_key)
    
    async def generate(self, prompt: str, **kwargs) -> str:
        try:
            from anthropic import AsyncAnthropic
            client = AsyncAnthropic(api_key=self.api_key)
            
            response = await client.messages.create(
                model=self.model,
                max_tokens=kwargs.get('max_tokens', settings.ANTHROPIC_MAX_TOKENS),
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text
        except ImportError:
            raise Exception("Anthropic package not installed. Run: pip install anthropic")


class LocalLLMProvider(LLMProvider):
    """Local LLM provider (Ollama, etc.)"""
    
    def __init__(self):
        self.base_url = settings.LOCAL_LLM_URL
        self.model = settings.LOCAL_LLM_MODEL
        
    async def is_available(self) -> bool:
        return bool(self.base_url)
    
    async def generate(self, prompt: str, **kwargs) -> str:
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    json={
                        "model": self.model or "llama2",
                        "messages": [{"role": "user", "content": prompt}],
                        "stream": False,
                    },
                    timeout=60.0,
                )
                return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            raise Exception(f"Local LLM error: {str(e)}")


class AIService:
    """Main AI Service with provider management"""
    
    def __init__(self):
        self.providers: List[LLMProvider] = [
            OpenAIProvider(),
            AnthropicProvider(),
            LocalLLMProvider(),
        ]
    
    async def get_available_provider(self) -> LLMProvider:
        """Get first available provider"""
        for provider in self.providers:
            if await provider.is_available():
                return provider
        raise Exception("No AI provider available. Configure OPENAI_API_KEY, ANTHROPIC_API_KEY, or LOCAL_LLM_URL")
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate text using first available provider"""
        provider = await self.get_available_provider()
        return await provider.generate(prompt, **kwargs)


class ContentAnalyzer:
    """Content analysis using LLM"""
    
    def __init__(self):
        self.ai_service = AIService()
    
    async def summarize(self, content: str, max_length: int = 200) -> dict:
        """Summarize article content"""
        prompt = f"""请将以下文章总结为{max_length}字以内的摘要，提取关键要点：

{content}

请以JSON格式返回，包含：
- summary: 摘要
- key_points: 关键要点列表（最多3个）
- word_count: 摘要字数
"""
        
        response = await self.ai_service.generate(prompt)
        
        import json
        try:
            result = json.loads(response)
            return {
                "summary": result.get("summary", ""),
                "key_points": result.get("key_points", []),
                "word_count": len(result.get("summary", ""))
            }
        except json.JSONDecodeError:
            return {
                "summary": response[:max_length],
                "key_points": [],
                "word_count": len(response)
            }
    
    async def extract_keywords(self, content: str, max_keywords: int = 10) -> dict:
        """Extract keywords from content"""
        prompt = f"""从以下内容中提取{max_keywords}个最重要的关键词和5个标签：

{content}

请以JSON格式返回，包含：
- keywords: 关键词列表，每个包含"word"和"score"（重要性0-1）
- tags: 标签列表
"""
        
        response = await self.ai_service.generate(prompt)
        
        import json
        try:
            result = json.loads(response)
            return {
                "keywords": result.get("keywords", []),
                "tags": result.get("tags", [])
            }
        except json.JSONDecodeError:
            return {
                "keywords": [],
                "tags": []
            }
    
    async def generate_tags(self, title: str, content: str, max_tags: int = 5) -> dict:
        """Generate tags for article"""
        prompt = f"""为以下文章生成{max_tags}个合适的标签：

标题：{title}

内容：{content}

请返回JSON格式的标签列表，标签应该简洁且相关。
"""
        
        response = await self.ai_service.generate(prompt)
        
        import json
        try:
            tags = json.loads(response)
            return {
                "tags": tags if isinstance(tags, list) else [response],
                "confidence": [1.0] * len(tags if isinstance(tags, list) else 1)
            }
        except json.JSONDecodeError:
            return {
                "tags": [response],
                "confidence": [1.0]
            }
