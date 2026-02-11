"""
API v1 Routes
"""

from fastapi import APIRouter, Depends, HTTPException
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
from app.services.ai_service import ContentAnalyzer, AIService
from app.services.analytics_service import AnalyticsService

ai_router = APIRouter(prefix="/ai")

# Initialize services
content_analyzer = ContentAnalyzer()
analytics_service = AnalyticsService()
ai_client = AIService()


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
        raise HTTPException(status_code=500, detail=str(e))


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
        raise HTTPException(status_code=500, detail=str(e))


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
        raise HTTPException(status_code=500, detail=str(e))


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
        raise HTTPException(status_code=500, detail=str(e))


analytics_router = APIRouter(prefix="/analytics")


@analytics_router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_analytics_overview(req: AnalyticsOverviewRequest):
    """Get analytics overview"""
    try:
        result = await analytics_service.get_overview(days=req.days)
        return AnalyticsOverviewResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@analytics_router.get("/trending", response_model=dict)
async def get_trending_topics(limit: int = 10):
    """Get trending topics"""
    try:
        result = await analytics_service.get_trending_topics(limit=limit)
        return {"trending": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
        raise HTTPException(status_code=500, detail=str(e))


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
        raise HTTPException(status_code=500, detail=str(e))


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
        raise HTTPException(status_code=500, detail=str(e))


# Combine all routers
api_router = APIRouter()
api_router.include_router(ai_router)
api_router.include_router(analytics_router)
api_router.include_router(recommend_router)
