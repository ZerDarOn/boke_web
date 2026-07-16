"""
Configuration settings using Pydantic
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache, cached_property


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

    # CORS — 存为字符串让 pydantic-settings 能直接解析 .env，
    # 通过 @property 转为 list 给 FastAPI 使用
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    @cached_property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
    
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
        extra = "ignore"  # 忽略 .env 中未定义的字段，避免字段名不匹配时拒绝启动


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
