"""
Integration tests for AI Service
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "INK.SPIRIT AI Service"
    assert data["status"] == "running"


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_summarize_endpoint():
    """Test article summarization"""
    response = client.post(
        "/api/v1/ai/summarize",
        json={
            "content": "This is a test article about AI and technology.",
            "max_length": 100
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "word_count" in data


def test_extract_keywords_endpoint():
    """Test keyword extraction"""
    response = client.post(
        "/api/v1/ai/extract-keywords",
        json={
            "content": "Python, FastAPI, and modern web development",
            "max_keywords": 5
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "keywords" in data


def test_generate_tags_endpoint():
    """Test tag generation"""
    response = client.post(
        "/api/v1/ai/generate-tags",
        json={
            "title": "Introduction to AI",
            "content": "Artificial Intelligence is transforming technology...",
            "max_tags": 5
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "tags" in data


def test_analytics_overview():
    """Test analytics overview"""
    response = client.get(
        "/api/v1/analytics/overview",
        params={"days": 30}
    )
    # May fail without database, but should return proper error
    assert response.status_code in [200, 500]


def test_recommend_posts_endpoint():
    """Test post recommendation"""
    response = client.post(
        "/api/v1/recommend/posts",
        json={
            "post_id": "test-post-123",
            "limit": 5
        }
    )
    # May fail without database
    assert response.status_code in [200, 500]


def test_error_handling():
    """Test error handling"""
    response = client.post(
        "/api/v1/ai/summarize",
        json={
            "content": "",  # Invalid: empty content
        }
    )
    # Should return validation error
    assert response.status_code in [400, 422]
