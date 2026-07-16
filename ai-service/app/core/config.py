"""
Configuration settings using Pydantic
"""

from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # App Info
    APP_NAME: str = "INK.SPIRIT AI Service"
    APP_DESCRIPTION: str = "AI-powered features for INK.SPIRIT Blog"
    VERSION: str = "1.0.0"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    LOG_LEVEL: str = "info"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """解析环境变量：逗号分隔字符串 → list，或 JSON 数组 → list"""
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                import json
                return json.loads(v)
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    # Database
    DATABASE_URL: str = ""
    
    # AI Services
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4"
    OPENAI_TEMPERATURE: float = 0.7
    OPENAI_MAX_TOKENS: int = 4000
    OPENAI_TIMEOUT: int = 30
    
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-opus-20240229"
    ANTHROPIC_MAX_TOKENS: int = 4000
    
    # Local LLM
    LOCAL_LLM_URL: str = ""
    LOCAL_LLM_MODEL: str = ""
    
    # Cache
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL: int = 3600  # 1 hour
    
    # Analytics
    ANALYTICS_WINDOW_DAYS: int = 30
    TRENDING_MIN_VIEWS: int = 100

    # Knowledge Base (RAG)
    KB_RELEVANCE_THRESHOLD: float = 0.45
    KB_CHUNK_SIZE: int = 600
    KB_CHUNK_OVERLAP: int = 80
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
