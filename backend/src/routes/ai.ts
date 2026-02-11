/**
 * AI Integration Routes
 * Call Python AI microservice from Node.js backend
 */

import { Router } from 'express';
import { success, error } from '../utils/response';
import { aiClient } from '../services/ai.client';

const router = Router();

// GET /api/ai/health - Check AI service health
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await aiClient.health();
    if (isHealthy) {
      return success(res, { status: 'connected', service: 'ai-service' });
    }
    return error(res, 'AI service unavailable', 503);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// POST /api/ai/summarize - Summarize article content
router.post('/summarize', async (req, res) => {
  try {
    const { content, max_length = 200 } = req.body;
    
    if (!content) {
      return error(res, 'Content is required', 400);
    }

    const result = await aiClient.summarizeContent(content, max_length);
    return success(res, result, 'Content summarized successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// POST /api/ai/extract-keywords - Extract keywords
router.post('/extract-keywords', async (req, res) => {
  try {
    const { content, max_keywords = 10 } = req.body;
    
    if (!content) {
      return error(res, 'Content is required', 400);
    }

    const result = await aiClient.extractKeywords(content, max_keywords);
    return success(res, result, 'Keywords extracted successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// POST /api/ai/generate-tags - Generate tags for article
router.post('/generate-tags', async (req, res) => {
  try {
    const { title, content, max_tags = 5 } = req.body;
    
    if (!title || !content) {
      return error(res, 'Title and content are required', 400);
    }

    const result = await aiClient.generateTags(title, content, max_tags);
    return success(res, result, 'Tags generated successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// POST /api/ai/sentiment - Analyze sentiment
router.post('/sentiment', async (req, res) => {
  try {
    const { content, language = 'zh' } = req.body;
    
    if (!content) {
      return error(res, 'Content is required', 400);
    }

    const result = await aiClient.analyzeSentiment(content, language);
    return success(res, result, 'Sentiment analyzed successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// GET /api/ai/analytics/overview - Get analytics overview
router.get('/analytics/overview', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const result = await aiClient.getAnalyticsOverview(days);
    return success(res, result, 'Analytics retrieved successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// GET /api/ai/analytics/trending - Get trending topics
router.get('/analytics/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await aiClient.getTrendingTopics(limit);
    return success(res, result, 'Trending topics retrieved successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// POST /api/ai/recommend/posts - Get recommended posts
router.post('/recommend/posts', async (req, res) => {
  try {
    const { user_id, post_id, limit = 5 } = req.body;
    
    if (!post_id) {
      return error(res, 'Post ID is required', 400);
    }

    const result = await aiClient.recommendPosts(user_id, post_id, limit);
    return success(res, result, 'Posts recommended successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

export default router;
