"""
Pydantic models for API request/response
"""

from typing import Optional, List
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    database: str


class SummarizeRequest(BaseModel):
    """Article summarization request"""
    content: str = Field(..., description="Article content to summarize")
    max_length: Optional[int] = Field(200, description="Maximum summary length")


class SummarizeResponse(BaseModel):
    """Summarization response"""
    summary: str
    word_count: int
    key_points: List[str]


class ExtractKeywordsRequest(BaseModel):
    """Keyword extraction request"""
    content: str = Field(..., description="Content to extract keywords from")
    max_keywords: Optional[int] = Field(10, description="Maximum number of keywords")


class ExtractKeywordsResponse(BaseModel):
    """Keywords extraction response"""
    keywords: List[dict]
    tags: List[str]


class GenerateTagsRequest(BaseModel):
    """Tag generation request"""
    title: str = Field(..., description="Article title")
    content: str = Field(..., description="Article content")
    max_tags: Optional[int] = Field(5, description="Maximum number of tags")


class GenerateTagsResponse(BaseModel):
    """Tag generation response"""
    tags: List[str]
    confidence: List[float]


class SentimentAnalysisRequest(BaseModel):
    """Sentiment analysis request"""
    content: str = Field(..., description="Content to analyze")
    language: Optional[str] = Field("zh", description="Content language")


class SentimentAnalysisResponse(BaseModel):
    """Sentiment analysis response"""
    sentiment: str
    score: float
    emotions: dict


class RecommendPostsRequest(BaseModel):
    """Post recommendation request"""
    user_id: Optional[str] = Field(None, description="User ID for personalization")
    post_id: str = Field(..., description="Current post ID")
    limit: Optional[int] = Field(5, description="Number of recommendations")


class RecommendPostsResponse(BaseModel):
    """Post recommendation response"""
    posts: List[dict]
    algorithm: str


class SimilarContentRequest(BaseModel):
    """Find similar content request"""
    content: str = Field(..., description="Content to find similar items for")
    limit: Optional[int] = Field(10, description="Number of similar items")


class SimilarContentResponse(BaseModel):
    """Similar content response"""
    similar_items: List[dict]
    similarity_scores: List[float]


class AnalyticsOverviewRequest(BaseModel):
    """Analytics overview request"""
    days: Optional[int] = Field(30, description="Number of days to analyze")


class AnalyticsOverviewResponse(BaseModel):
    """Analytics overview response"""
    total_posts: int
    total_views: int
    avg_views_per_post: float
    top_categories: List[dict]
    trending_tags: List[str]


class UserSegmentRequest(BaseModel):
    """User segmentation request"""
    include_features: Optional[List[str]] = Field(
        ["views", "likes", "comments", "login_frequency"],
        description="Features to include in segmentation"
    )
    n_segments: Optional[int] = Field(3, description="Number of user segments")


class UserSegmentResponse(BaseModel):
    """User segmentation response"""
    segments: List[dict]
    total_users: int


class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    message: str
    code: Optional[str] = None
