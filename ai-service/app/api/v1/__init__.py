"""
API v1 Routes
"""

import secrets
import logging

from fastapi import APIRouter, Depends, Header, HTTPException
from app.models.schemas import (
    SummarizeRequest,
    SummarizeResponse,
    ExtractKeywordsRequest,
    ExtractKeywordsResponse,
    GenerateTagsRequest,
    GenerateTagsResponse,
    SentimentAnalysisRequest,
    SentimentAnalysisResponse,
    RecommendPostsRequest,
    RecommendPostsResponse,
    SimilarContentRequest,
    SimilarContentResponse,
    AnalyticsOverviewRequest,
    AnalyticsOverviewResponse,
    UserSegmentRequest,
    UserSegmentResponse,
)
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from app.services.ai_service import ContentAnalyzer, AIService
from app.services.analytics_service import AnalyticsService
from app.services.knowledge_base import get_kb
from app.services.grounded_answer_service import GroundedAnswerService
from app.services.companion_persona_service import get_companion_persona
from app.core.config import settings

ai_router = APIRouter(prefix="/ai")

# Initialize services
content_analyzer = ContentAnalyzer()
analytics_service = AnalyticsService()
ai_client = AIService()
companion_persona = get_companion_persona()
grounded_answer_service = GroundedAnswerService(ai_client, companion_persona)
logger = logging.getLogger("ai-service.api")


@ai_router.post("/reload-config", response_model=dict)
async def reload_config():
    """后台修改 AI 模型配置后调用此接口，无需重启 Python 进程即可重新加载 .env"""
    try:
        from app.core.config import get_settings
        from app.services.ai_service import AIService

        # 清除 pydantic-settings 缓存，重新读取 .env
        get_settings.cache_clear()
        new_settings = get_settings()

        # 重建 AI 客户端（带上新的 API Key / Base URL）
        global ai_client
        ai_client = AIService()

        logger.info(
            "Config reloaded: openai=%s model=%s base_url=%s",
            bool(new_settings.OPENAI_API_KEY),
            new_settings.OPENAI_MODEL,
            new_settings.OPENAI_BASE_URL or "(default)",
        )
        return {
            "success": True,
            "providers": await ai_client.provider_status(),
            "model": new_settings.OPENAI_MODEL,
        }
    except Exception as e:
        raise service_error("Config reload", e)


def service_error(operation: str, error: Exception) -> HTTPException:
    logger.error("AI API operation failed operation=%s error_type=%s", operation, type(error).__name__)
    return HTTPException(status_code=500, detail=f"{operation} unavailable")


async def require_internal_access(
    x_ai_internal_token: Optional[str] = Header(default=None),
):
    """Protect maintenance endpoints when a shared internal token is configured."""
    expected = settings.AI_INTERNAL_TOKEN
    if expected and (
        not x_ai_internal_token
        or not secrets.compare_digest(x_ai_internal_token, expected)
    ):
        raise HTTPException(status_code=401, detail="Invalid internal AI token")


@ai_router.post("/summarize", response_model=SummarizeResponse)
async def summarize_content(req: SummarizeRequest):
    """Summarize article content using AI"""
    try:
        result = await content_analyzer.summarize(
            content=req.content,
            max_length=req.max_length
        )
        return SummarizeResponse(**result)
    except Exception as e:
        raise service_error("Summarization", e)


@ai_router.post("/extract-keywords", response_model=ExtractKeywordsResponse)
async def extract_keywords(req: ExtractKeywordsRequest):
    """Extract keywords from content"""
    try:
        result = await content_analyzer.extract_keywords(
            content=req.content,
            max_keywords=req.max_keywords
        )
        return ExtractKeywordsResponse(**result)
    except Exception as e:
        raise service_error("Keyword extraction", e)


@ai_router.post("/generate-tags", response_model=GenerateTagsResponse)
async def generate_tags(req: GenerateTagsRequest):
    """Generate tags for article"""
    try:
        result = await content_analyzer.generate_tags(
            title=req.title,
            content=req.content,
            max_tags=req.max_tags
        )
        return GenerateTagsResponse(**result)
    except Exception as e:
        raise service_error("Tag generation", e)


@ai_router.post("/sentiment", response_model=SentimentAnalysisResponse)
async def analyze_sentiment(req: SentimentAnalysisRequest):
    """Analyze sentiment of content"""
    try:
        # Simple sentiment analysis (can be enhanced with NLP libraries)
        from textblob import TextBlob
        blob = TextBlob(req.content)
        sentiment = blob.sentiment.polarity
        
        sentiment_label = "positive" if sentiment > 0.1 else \
                        "negative" if sentiment < -0.1 else "neutral"
        
        return SentimentAnalysisResponse(
            sentiment=sentiment_label,
            score=sentiment,
            emotions={
                "positive": max(0, sentiment),
                "negative": min(0, sentiment),
            }
        )
    except ImportError:
        # Fallback to simple keyword-based sentiment
        positive_words = ["好", "优秀", "喜欢", "推荐", "赞"]
        negative_words = ["差", "不好", "讨厌", "失望"]
        
        content_lower = req.content.lower()
        positive_count = sum(1 for word in positive_words if word in content_lower)
        negative_count = sum(1 for word in negative_words if word in content_lower)
        
        score = (positive_count - negative_count) / (positive_count + negative_count + 1)
        sentiment_label = "positive" if score > 0.3 else \
                           "negative" if score < -0.3 else "neutral"
        
        return SentimentAnalysisResponse(
            sentiment=sentiment_label,
            score=score,
            emotions={"positive": positive_count, "negative": negative_count}
        )
    except Exception as e:
        raise service_error("Sentiment analysis", e)


# ── Chat 请求/响应模型 ──
class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=4000)


class CompanionPageContext(BaseModel):
    page_type: Literal[
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
    ] = "default"
    pathname: str = Field(default="/", max_length=240)
    title: str = Field(default="", max_length=160)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="用户消息")
    history: List[ChatMessage] = Field(default_factory=list, max_length=10, description="对话历史")
    context: Optional[CompanionPageContext] = None


class ChatSource(BaseModel):
    citation: str = Field(..., pattern=r"^S\d+$")
    title: str
    url: str
    score: float = Field(..., ge=0, le=1)
    excerpt: str = Field(..., max_length=240)


class ChatResponse(BaseModel):
    reply: str = Field(..., description="AI 回复")
    sources: List[ChatSource] = Field(default_factory=list, description="经过校验的知识来源")
    grounded: bool = Field(default=False, description="回答是否通过证据引用校验")
    confidence: float = Field(default=0, ge=0, le=1)
    refusal_reason: Optional[Literal[
        "insufficient_evidence",
        "invalid_citations",
        "invalid_model_output",
    ]] = None


@ai_router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """博客 AI 助手对话（AiCompanion 右下角浮窗）— Smart RAG"""
    try:
        kb = get_kb()
        try:
            chunks, needs_kb = await kb.search(req.message)
        except Exception as e:
            logger.warning("KB search failed, falling back to chat-only mode: %s", e)
            chunks, needs_kb = [], False
        page_context = req.context.model_dump() if req.context else None
        logger.info(
            "Companion chat context page_type=%s has_title=%s",
            req.context.page_type if req.context else "default",
            bool(req.context and req.context.title),
        )
        # 无知识库片段时走纯聊天模式，不用 grounded answer（否则会返回"依据不足"）
        if not needs_kb or not chunks:
            persona_context = companion_persona.prompt_context(page_context or {})
            reply = await ai_client.generate(
                f"{persona_context}\n\n用户: {req.message}\n助手:"
            )
            result = {
                "reply": reply.strip(),
                "sources": [],
                "grounded": False,
                "confidence": 0.0,
                "refusal_reason": None,
            }
        else:
            result = await grounded_answer_service.answer(
                req.message,
                req.history,
                chunks,
                page_context,
            )
        return ChatResponse(**result)
    except Exception as e:
        raise service_error("AI chat", e)


@ai_router.get("/companion/profile", response_model=dict)
async def companion_profile():
    """Return the public presentation layer of the configured companion persona."""
    return companion_persona.public_profile()


@ai_router.get(
    "/grounding/status",
    response_model=dict,
    dependencies=[Depends(require_internal_access)],
)
async def grounding_status():
    """Return aggregate grounding outcomes without prompts or response content."""
    return {"success": True, **grounded_answer_service.metrics_snapshot()}


@ai_router.put(
    "/index/posts/{post_id}",
    response_model=dict,
    dependencies=[Depends(require_internal_access)],
)
async def sync_knowledge_post(post_id: str):
    """Synchronize one post from the database into the active index."""
    try:
        return {"success": True, **(await get_kb().sync_post(post_id))}
    except Exception as e:
        raise service_error("Post index sync", e)


@ai_router.delete(
    "/index/posts/{post_id}",
    response_model=dict,
    dependencies=[Depends(require_internal_access)],
)
async def remove_knowledge_post(post_id: str):
    """Remove all chunks for a deleted post."""
    try:
        return {"success": True, **(await get_kb().remove_post(post_id))}
    except Exception as e:
        raise service_error("Post index removal", e)


@ai_router.get(
    "/index/status",
    response_model=dict,
    dependencies=[Depends(require_internal_access)],
)
async def knowledge_index_status():
    """Return active collection and last mutation state without article content."""
    try:
        return {"success": True, **(await get_kb().status())}
    except Exception as e:
        raise service_error("Index status", e)


@ai_router.post(
    "/index/reconcile",
    response_model=dict,
    dependencies=[Depends(require_internal_access)],
)
async def reconcile_knowledge_index():
    """Repair missed updates and remove content that is no longer public."""
    try:
        return {"success": True, **(await get_kb().reconcile())}
    except Exception as e:
        raise service_error("Index reconciliation", e)


@ai_router.post(
    "/reindex",
    response_model=dict,
    dependencies=[Depends(require_internal_access)],
)
async def reindex_knowledge_base():
    """重建博客知识库索引（文章新增/修改后调用）"""
    try:
        kb = get_kb()
        result = await kb.reindex()
        return {"success": True, **result}
    except Exception as e:
        raise service_error("Index rebuild", e)


analytics_router = APIRouter(prefix="/analytics")


@analytics_router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_analytics_overview(req: AnalyticsOverviewRequest):
    """Get analytics overview"""
    try:
        result = await analytics_service.get_overview(days=req.days)
        return AnalyticsOverviewResponse(**result)
    except Exception as e:
        raise service_error("Analytics overview", e)


@analytics_router.get("/trending", response_model=dict)
async def get_trending_topics(limit: int = 10):
    """Get trending topics"""
    try:
        result = await analytics_service.get_trending_topics(limit=limit)
        return {"trending": result}
    except Exception as e:
        raise service_error("Trending topics", e)


@analytics_router.get("/user-segments", response_model=UserSegmentResponse)
async def analyze_user_segments(req: UserSegmentRequest):
    """Analyze and segment users"""
    try:
        result = await analytics_service.segment_users(
            include_features=req.include_features,
            n_segments=req.n_segments
        )
        return UserSegmentResponse(**result)
    except Exception as e:
        raise service_error("User segmentation", e)


recommend_router = APIRouter(prefix="/recommend")


@recommend_router.post("/posts", response_model=RecommendPostsResponse)
async def recommend_posts(req: RecommendPostsRequest):
    """Get recommended posts for user"""
    try:
        result = await analytics_service.recommend_posts(
            user_id=req.user_id,
            post_id=req.post_id,
            limit=req.limit
        )
        return RecommendPostsResponse(
            posts=result["posts"],
            algorithm=result["algorithm"]
        )
    except Exception as e:
        raise service_error("Post recommendation", e)


@recommend_router.post("/similar", response_model=SimilarContentResponse)
async def find_similar_content(req: SimilarContentRequest):
    """Find similar content"""
    try:
        result = await analytics_service.find_similar_content(
            content=req.content,
            limit=req.limit
        )
        return SimilarContentResponse(
            similar_items=result["items"],
            similarity_scores=result["scores"]
        )
    except Exception as e:
        raise service_error("Similar content", e)


# Combine all routers
api_router = APIRouter()
api_router.include_router(ai_router)
api_router.include_router(analytics_router)
api_router.include_router(recommend_router)
