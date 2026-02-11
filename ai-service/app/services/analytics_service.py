"""
Analytics Service - Data analysis and insights
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
import math
from sqlalchemy import text

from app.database.connection import get_db


class AnalyticsService:
    """Service for data analytics and insights"""
    
    async def get_overview(self, days: int = 30) -> Dict:
        """Get analytics overview for specified period"""
        async with get_db() as db:
            # Query PostgreSQL for analytics
            start_date = datetime.now() - timedelta(days=days)
            
            # Get posts analytics
            posts_query = text("""
                SELECT 
                    COUNT(*) as total_posts,
                    COALESCE(SUM(view_count), 0) as total_views
                FROM posts
                WHERE date >= :start_date
            """)
            result = await db.execute(posts_query, {"start_date": start_date})
            row = result.fetchone()
            
            avg_views = row['total_views'] / row['total_posts'] if row['total_posts'] > 0 else 0
            
            # Get top categories
            categories_query = text("""
                SELECT category, COUNT(*) as count
                FROM posts
                WHERE date >= :start_date
                GROUP BY category
                ORDER BY count DESC
                LIMIT 10
            """)
            categories_result = await db.execute(categories_query, {"start_date": start_date})
            top_categories = [
                {"category": row['category'], "count": row['count']}
                for row in categories_result.fetchall()
            ]
            
            # Get trending tags
            tags_query = text("""
                SELECT unnest(tags) as tag, COUNT(*) as count
                FROM posts
                WHERE date >= :start_date
                GROUP BY unnest(tags)
                ORDER BY count DESC
                LIMIT 10
            """)
            tags_result = await db.execute(tags_query, {"start_date": start_date})
            trending_tags = [row['tag'] for row in tags_result.fetchall()]
            
            return {
                "total_posts": row['total_posts'],
                "total_views": row['total_views'],
                "avg_views_per_post": round(avg_views, 2),
                "top_categories": top_categories,
                "trending_tags": trending_tags,
            }
    
    async def get_trending_topics(self, limit: int = 10) -> List[Dict]:
        """Get trending topics based on views and interactions"""
        async with get_db() as db:
            query = text("""
                SELECT 
                    unnest(tags) as tag,
                    SUM(view_count) as total_views,
                    COUNT(*) as post_count,
                    SUM(like_count) as total_likes
                FROM posts
                WHERE date >= NOW() - INTERVAL '30 days'
                GROUP BY unnest(tags)
                ORDER BY (total_views * 0.6 + post_count * 0.3 + total_likes * 0.1) DESC
                LIMIT :limit
            """)
            result = await db.execute(query, {"limit": limit})
            
            return [
                {
                    "tag": row['tag'],
                    "score": row['total_views'] * 0.6 + row['post_count'] * 0.3 + row['total_likes'] * 0.1,
                    "views": row['total_views'],
                    "posts": row['post_count'],
                }
                for row in result.fetchall()
            ]
    
    async def recommend_posts(
        self, 
        user_id: Optional[str] = None, 
        post_id: Optional[str] = None,
        limit: int = 5
    ) -> Dict:
        """Get recommended posts using collaborative filtering"""
        async with get_db() as db:
            if user_id:
                # Personalized recommendations based on user history
                history_query = text("""
                    SELECT category, tags
                    FROM post_views
                    WHERE user_id = :user_id
                    ORDER BY viewed_at DESC
                    LIMIT 20
                """)
                history = await db.execute(history_query, {"user_id": user_id})
                history_rows = history.fetchall()
                
                if history_rows:
                    # Build preference profile
                    preferred_categories = set(row['category'] for row in history_rows)
                    preferred_tags = set()
                    for row in history_rows:
                        if row['tags']:
                            preferred_tags.update(row['tags'].split(','))
                    
                    # Find similar posts
                    query = text("""
                        SELECT * FROM posts
                        WHERE category = ANY(:categories)
                           OR tags && :tags
                        ORDER BY view_count DESC, like_count DESC
                        LIMIT :limit
                    """)
                    result = await db.execute(query, {
                        "categories": list(preferred_categories),
                        "tags": list(preferred_tags),
                        "limit": limit
                    })
                    posts = result.fetchall()
                else:
                    # Fallback to popular posts
                    query = text("""
                        SELECT * FROM posts
                        WHERE is_published = true
                        ORDER BY view_count DESC, like_count DESC
                        LIMIT :limit
                    """)
                    result = await db.execute(query, {"limit": limit})
                    posts = result.fetchall()
            else:
                # No user personalization, return popular posts
                query = text("""
                    SELECT * FROM posts
                    WHERE is_published = true
                    ORDER BY view_count DESC, like_count DESC
                    LIMIT :limit
                """)
                result = await db.execute(query, {"limit": limit})
                posts = result.fetchall()
            
            return {
                "posts": posts,
                "algorithm": "collaborative_filtering" if user_id else "popular"
            }
    
    async def find_similar_content(self, content: str, limit: int = 10) -> Dict:
        """Find similar content using simple keyword matching"""
        async with get_db() as db:
            # Extract keywords from content (simple implementation)
            keywords = self._extract_simple_keywords(content)
            
            if not keywords:
                return {"items": [], "scores": []}
            
            # Build LIKE conditions for each keyword
            like_conditions = []
            params = {"limit": limit}
            for i, keyword in enumerate(keywords[:5]):  # Use top 5 keywords
                like_conditions.append(f"content ILIKE :keyword{i}")
                params[f"keyword{i}"] = f"%{keyword}%"
            
            # Query similar posts
            query = text(f"""
                SELECT id, title, slug, excerpt, category, tags
                FROM posts
                WHERE {' OR '.join(like_conditions)}
                AND is_published = true
                ORDER BY view_count DESC
                LIMIT :limit
            """)
            result = await db.execute(query, params)
            similar_posts = result.fetchall()
            
            return {
                "items": similar_posts,
                "scores": [1.0 - (i * 0.1) for i in range(len(similar_posts))]
            }
    
    async def segment_users(
        self, 
        include_features: List[str] = ["views", "likes", "comments", "login_frequency"],
        n_segments: int = 3
    ) -> Dict:
        """Segment users using K-means clustering"""
        from sklearn.cluster import KMeans
        import numpy as np
        
        async with get_db() as db:
            # Get user features
            query = text("""
                SELECT 
                    u.id,
                    COALESCE(SUM(p.view_count), 0) as views,
                    COALESCE(SUM(p.like_count), 0) as likes,
                    COUNT(DISTINCT c.id) as comments,
                    COUNT(DISTINCT pv.id) as login_frequency
                FROM users u
                LEFT JOIN posts p ON p.author_id = u.id
                LEFT JOIN post_views pv ON pv.post_id = p.id AND pv.user_id = u.id
                LEFT JOIN comments c ON c.post_id = p.id
                GROUP BY u.id
                HAVING COUNT(*) > 0
            """)
            result = await db.execute(query)
            user_data = result.fetchall()
            
            if len(user_data) < n_segments:
                n_segments = max(1, len(user_data))
            
            # Prepare feature matrix
            features = []
            user_ids = []
            for row in user_data:
                user_ids.append(row['id'])
                feature_vector = []
                if 'views' in include_features:
                    feature_vector.append(row['views'])
                if 'likes' in include_features:
                    feature_vector.append(row['likes'])
                if 'comments' in include_features:
                    feature_vector.append(row['comments'])
                if 'login_frequency' in include_features:
                    feature_vector.append(row['login_frequency'])
                features.append(feature_vector)
            
            if not features:
                return {"segments": [], "total_users": len(user_data)}
            
            # Normalize features
            X = np.array(features, dtype=float)
            from sklearn.preprocessing import StandardScaler
            scaler = StandardScaler()
            X_normalized = scaler.fit_transform(X)
            
            # K-means clustering
            kmeans = KMeans(n_clusters=n_segments, random_state=42, n_init=10)
            clusters = kmeans.fit_predict(X_normalized)
            
            # Build segments
            segments = []
            for i in range(n_segments):
                segment_users = [user_ids[j] for j in range(len(clusters)) if clusters[j] == i]
                
                # Calculate segment characteristics
                segment_features = X_normalized[clusters == i].mean(axis=0).tolist()
                
                segments.append({
                    "segment_id": i,
                    "name": self._generate_segment_name(i, segment_features, include_features),
                    "user_count": len(segment_users),
                    "user_ids": segment_users[:10],  # First 10 users as sample
                    "characteristics": {
                        "avg_views": segment_features[0] if 'views' in include_features else None,
                        "avg_likes": segment_features[1] if 'likes' in include_features else None,
                        "avg_comments": segment_features[2] if 'comments' in include_features else None,
                        "avg_login": segment_features[3] if 'login_frequency' in include_features else None,
                    }
                })
            
            return {
                "segments": segments,
                "total_users": len(user_data)
            }
    
    def _extract_simple_keywords(self, content: str) -> List[str]:
        """Extract simple keywords from content"""
        import re
        from collections import Counter
        
        # Split by Chinese characters and words
        words = re.findall(r'[\u4e00-\u9fff]+|[a-zA-Z]+', content)
        
        # Filter short words and common stop words
        stop_words = {'的', '了', '是', '在', '和', 'the', 'a', 'an', 'is', 'and', 'in'}
        keywords = [word for word in words if len(word) > 1 and word.lower() not in stop_words]
        
        # Count and return top keywords
        counter = Counter(keywords)
        return [word for word, count in counter.most_common(20)]
    
    def _generate_segment_name(
        self, 
        segment_id: int, 
        features: List[float], 
        feature_names: List[str]
    ) -> str:
        """Generate segment name based on features"""
        scores = {}
        for i, name in enumerate(feature_names):
            scores[name] = features[i]
        
        # Find dominant feature
        dominant = max(scores.items(), key=lambda x: x[1])
        
        names = {
            'views': '活跃读者',
            'likes': '深度互动',
            'comments': '评论达人',
            'login_frequency': '常客'
        }
        
        return f"Segment_{segment_id} - {names.get(dominant[0], '普通用户')}"
