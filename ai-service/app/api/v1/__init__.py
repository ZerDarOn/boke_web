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
from app.services.ai_task_policy import AITask
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


# 纯闲聊词（问候/寒暄/感谢/道别等）。命中时不触发 RAG，直接按人设聊天。
_SMALLTALK_PATTERNS = (
    "你好", "您好", "哈喽", "嗨", "嗨嗨", "hello", "hi", "hey",
    "早上好", "中午好", "下午好", "晚上好", "晚安", "早安",
    "在吗", "在不在", "有人吗",
    "谢谢", "多谢", "感谢", "thanks", "thank you",
    "再见", "拜拜", "下次见", "回见", "bye",
    "你是谁", "你叫什么", "你是什么", "介绍一下你",
    "你能做什么", "你会做什么", "能干什么",
)


def _is_smalltalk(message: str) -> bool:
    """判断消息是否为纯闲聊（问候/寒暄/自我介绍类），是则不需要知识库。"""
    text = (message or "").strip().lower()
    if not text:
        return False
    # 纯闲聊句往往很短（<= 12 字）且直接命中词表
    if len(text) <= 12:
        for pattern in _SMALLTALK_PATTERNS:
            if pattern in text:
                return True
    return False


async def _fetch_blog_summary() -> str:
    """
    从数据库拉取博客公开文章和项目的标题列表，作为聊天上下文注入。
    这样墨璃即使不触发 RAG（如"博客有什么文章"这类列举型问题），
    也能基于真实数据回答，而不是凭空编造。
    """
    from app.core.config import settings

    if not settings.DATABASE_URL:
        return ""

    try:
        import asyncpg
        conn = await asyncpg.connect(settings.DATABASE_URL)
        try:
            posts = await conn.fetch(
                "SELECT title FROM posts "
                "WHERE \"isPublished\" = true AND \"accessLevel\" = 'PUBLIC' "
                "ORDER BY \"createdAt\" DESC LIMIT 20"
            )
            projects = await conn.fetch(
                "SELECT name, description FROM projects ORDER BY \"createdAt\" DESC LIMIT 10"
            )
        finally:
            await conn.close()

        lines = []
        if posts:
            lines.append("【公开文章】")
            for row in posts:
                lines.append(f"- {row['title']}")
        if projects:
            lines.append("【项目】")
            for row in projects:
                desc = f"（{row['description'][:60]}）" if row.get('description') else ""
                lines.append(f"- {row['name']}{desc}")
        return "\n".join(lines)
    except Exception as e:
        logger.warning("Failed to fetch blog summary for chat context: %s", e)
        return ""


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
        get_kb().reload_settings(new_settings)

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
        "divination",
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


async def _build_plain_chat_prompt(req: ChatRequest, page_context: Optional[dict]) -> str:
    """Build the non-RAG prompt while preserving bounded conversation continuity."""
    persona_context = companion_persona.prompt_context(page_context or {})
    blog_summary = await _fetch_blog_summary()
    blog_block = (
        "\n以下是本站的真实内容索引，回答时请基于此，不要编造不存在的文章或项目：\n"
        f"{blog_summary}\n"
        if blog_summary else ""
    )
    history_text = GroundedAnswerService._format_history(req.history)
    history_block = f"\n对话历史：\n{history_text}\n" if history_text else ""
    return f"{persona_context}{blog_block}{history_block}\n用户: {req.message}\n助手:"


def _serialize_chat_sources(sources: List[dict]) -> List[dict]:
    """Convert validated grounded-answer source dictionaries into SSE-safe metadata."""
    return [
        {
            "citation": source["citation"],
            "title": source["title"],
            "url": source["url"],
            "score": source["score"],
            "excerpt": source["excerpt"],
        }
        for source in sources
    ]


class DivinationRequest(BaseModel):
    kind: Literal["tarot", "iching", "astrology"]
    spread: str = Field(..., min_length=1, max_length=6000, description="占卜结果（牌面/卦象/星盘）")
    question: str = Field(default="", max_length=500, description="求问者所问之事")
    followup: str = Field(default="", max_length=1000, description="追问内容（非空时按追问处理）")
    previous_reading: str = Field(default="", max_length=6000, description="之前的 AI 深度解读（追问时附上）")


class DivinationResponse(BaseModel):
    reading: str = Field(..., description="AI 深度解读 / 追问回复")


@ai_router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """博客 AI 助手对话（AiCompanion 右下角浮窗）— Smart RAG"""
    try:
        page_context = req.context.model_dump() if req.context else None
        logger.info(
            "Companion chat context page_type=%s has_title=%s",
            req.context.page_type if req.context else "default",
            bool(req.context and req.context.title),
        )

        # 纯闲聊（问候/寒暄/自我介绍）直接按人设聊天，不触发 RAG
        if _is_smalltalk(req.message):
            reply = await ai_client.generate(await _build_plain_chat_prompt(req, page_context))
            return ChatResponse(
                reply=reply.strip(),
                sources=[],
                grounded=False,
                confidence=0.0,
                refusal_reason=None,
            )

        kb = get_kb()
        try:
            chunks, needs_kb = await kb.search(req.message)
        except Exception as e:
            logger.warning("KB search failed, falling back to chat-only mode: %s", e)
            chunks, needs_kb = [], False

        # 无知识库片段时走纯聊天模式，不用 grounded answer（否则会返回"依据不足"）
        if not needs_kb or not chunks:
            reply = await ai_client.generate(await _build_plain_chat_prompt(req, page_context))
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
            # 引用校验失败（grounded 拒答）时降级为纯聊天：宁可正常回应，
            # 也不把"无法核验引用"这类技术性失败信息抛给访客。
            if result.get("grounded") is False and result.get("refusal_reason"):
                logger.info(
                    "Grounded answer refused reason=%s → fallback to plain chat",
                    result.get("refusal_reason"),
                )
                fallback = await ai_client.generate(await _build_plain_chat_prompt(req, page_context))
                result = {
                    "reply": fallback.strip(),
                    "sources": [],
                    "grounded": False,
                    "confidence": 0.0,
                    "refusal_reason": None,
                }
        return ChatResponse(**result)
    except Exception as e:
        raise service_error("AI chat", e)


@ai_router.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    """博客 AI 助手对话 — SSE 流式输出（AiCompanion 打字机效果）"""
    from fastapi.responses import StreamingResponse
    import json as _json

    async def event_stream():
        try:
            page_context = req.context.model_dump() if req.context else None

            # 闲聊 → 纯流式聊天
            if _is_smalltalk(req.message):
                # 先发一个 meta 事件，让前端知道这是普通聊天
                yield f"data: {_json.dumps({'type': 'meta', 'grounded': False, 'sources': []}, ensure_ascii=False)}\n\n"
                async for chunk in ai_client.generate_stream(
                    await _build_plain_chat_prompt(req, page_context),
                    AITask.CHAT,
                ):
                    yield f"data: {_json.dumps({'type': 'delta', 'content': chunk}, ensure_ascii=False)}\n\n"
                yield f"data: {_json.dumps({'type': 'done'}, ensure_ascii=False)}\n\n"
                return

            kb = get_kb()
            try:
                chunks, needs_kb = await kb.search(req.message)
            except Exception:
                chunks, needs_kb = [], False

            if not needs_kb or not chunks:
                # 纯聊天模式（无 RAG）
                yield f"data: {_json.dumps({'type': 'meta', 'grounded': False, 'sources': []}, ensure_ascii=False)}\n\n"
                async for chunk in ai_client.generate_stream(
                    await _build_plain_chat_prompt(req, page_context),
                    AITask.CHAT,
                ):
                    yield f"data: {_json.dumps({'type': 'delta', 'content': chunk}, ensure_ascii=False)}\n\n"
                yield f"data: {_json.dumps({'type': 'done'}, ensure_ascii=False)}\n\n"
            else:
                # RAG 命中：先跑 grounded answer 拿完整结果，再流式输出
                result = await grounded_answer_service.answer(
                    req.message, req.history, chunks, page_context,
                )
                if result.get("grounded") is False and result.get("refusal_reason"):
                    # 降级纯聊天（流式）
                    yield f"data: {_json.dumps({'type': 'meta', 'grounded': False, 'sources': []}, ensure_ascii=False)}\n\n"
                    async for chunk in ai_client.generate_stream(
                        await _build_plain_chat_prompt(req, page_context),
                        AITask.CHAT,
                    ):
                        yield f"data: {_json.dumps({'type': 'delta', 'content': chunk}, ensure_ascii=False)}\n\n"
                else:
                    # grounded answer 成功，带 sources 元数据
                    sources_meta = _serialize_chat_sources(result.get("sources", []))
                    yield f"data: {_json.dumps({'type': 'meta', 'grounded': True, 'sources': sources_meta, 'confidence': result.get('confidence', 0)}, ensure_ascii=False)}\n\n"
                    reply = result.get("reply", "")
                    # 把完整回复按词/标点切分模拟流式
                    for i in range(0, len(reply), 6):
                        yield f"data: {_json.dumps({'type': 'delta', 'content': reply[i:i+6]}, ensure_ascii=False)}\n\n"
                yield f"data: {_json.dumps({'type': 'done'}, ensure_ascii=False)}\n\n"
        except Exception as e:
            logger.exception(
                "Companion chat stream failed error_type=%s",
                type(e).__name__,
            )
            yield f"data: {_json.dumps({'type': 'error', 'message': 'AI stream unavailable'}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


_DIVINATION_ROLES = {
    "tarot": "资深塔罗占卜师",
    "iching": "精通《周易》的易学大家",
    "astrology": "占星学专家",
}

_DIVINATION_INSTRUCTIONS = {
    "tarot": "请结合牌名、正逆位与牌阵位置，解读牌面象征、对求问者当下的启示与具体建议。",
    "iching": "请结合卦名、卦辞爻辞、动爻与变卦，解读卦象本义、对求问者所问之事的启示与具体建议。",
    "astrology": "请结合太阳/月亮/上升星座与星盘要素，解读性格内核、当下状态与建议。",
}


@ai_router.post("/divination", response_model=DivinationResponse)
async def divination(req: DivinationRequest):
    """占卜馆 AI 深度解读 / 追问（直接 LLM，不走 RAG）"""
    try:
        role = _DIVINATION_ROLES.get(req.kind, "玄学顾问")
        instruction = _DIVINATION_INSTRUCTIONS.get(req.kind, "")

        if req.followup:
            prompt = (
                f"你是{role}。{instruction}\n\n"
                "你此前已为这位求问者做过一次解读：\n"
                f"【占卜结果】\n{req.spread}\n\n"
                f"【你之前的解读】\n{req.previous_reading}\n\n"
                f"求问者针对解读继续追问：\n{req.followup}\n\n"
                "请直接回答追问，可引用前面的解读，保持同一风格，控制在 400 字以内。"
                "不要把占卜当作确定预言；涉及医疗、法律、财务或人身安全时，明确建议求助专业人士。"
            )
        else:
            question_line = f"\n求问者所问之事：{req.question}" if req.question else ""
            prompt = (
                f"你是{role}。{instruction}\n\n"
                "请对下面的占卜结果做一次完整、深入的解读，要求：\n"
                "1. 结构清晰（可用小标题或分点）；\n"
                "2. 结合具体牌面/卦象/星象元素，不要泛泛而谈；\n"
                "3. 给出对当下的启示、可能的发展趋势与具体行动建议；\n"
                "4. 不要把占卜当作确定预言；涉及医疗、法律、财务或人身安全时，明确建议求助专业人士；\n"
                f"5. 语言风格：赛博武侠感的中文，凝练而有温度。{question_line}\n\n"
                f"【占卜结果】\n{req.spread}\n\n"
                "【深度解读】"
            )

        reply = await ai_client.generate(prompt, AITask.CHAT)
        return DivinationResponse(reading=reply.strip())
    except Exception as e:
        raise service_error("AI divination", e)


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


@ai_router.get(
    "/taste-profile",
    response_model=dict,
    dependencies=[Depends(require_internal_access)],
)
async def knowledge_taste_profile():
    """Return a structured, evidence-only profile of public media collections."""
    try:
        return {"success": True, **(await get_kb().taste_profile())}
    except Exception as e:
        raise service_error("Taste profile", e)


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
