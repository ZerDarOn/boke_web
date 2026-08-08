/**
 * AI Integration Routes
 * Call Python AI microservice from Node.js backend
 */

import { Router } from 'express';
import { success, error } from '../utils/response';
import { aiClient, type CompanionPageContext } from '../services/ai.client';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.middleware';
import { apiLog } from '../lib/logger';

const router: Router = Router();
const MAX_CHAT_MESSAGE_LENGTH = 2000;
const MAX_CHAT_HISTORY_MESSAGES = 10;
const MAX_CHAT_HISTORY_CONTENT_LENGTH = 4000;
const MAX_COMPANION_PATH_LENGTH = 240;
const MAX_COMPANION_TITLE_LENGTH = 160;
const COMPANION_PAGE_TYPES = new Set([
  'default', 'home', 'posts', 'post', 'archives', 'announcement',
  'projects', 'project', 'skills', 'timeline', 'gallery', 'diary',
  'anime', 'games', 'about', 'network', 'dashboard', 'music',
]);

function isValidCompanionContext(value: unknown): value is CompanionPageContext | undefined {
  if (value === undefined) return true;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const context = value as Record<string, unknown>;
  return (
    typeof context.page_type === 'string' &&
    COMPANION_PAGE_TYPES.has(context.page_type) &&
    typeof context.pathname === 'string' &&
    context.pathname.length <= MAX_COMPANION_PATH_LENGTH &&
    typeof context.title === 'string' &&
    context.title.length <= MAX_COMPANION_TITLE_LENGTH
  );
}

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
router.post('/summarize', authenticate, requireAdmin, async (req, res) => {
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
router.post('/extract-keywords', authenticate, requireAdmin, async (req, res) => {
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
router.post('/generate-tags', authenticate, requireAdmin, async (req, res) => {
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
router.post('/sentiment', authenticate, requireAdmin, async (req, res) => {
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

// POST /api/ai/chat - 博客 AI 助手对话（公开，但限流+optionalAuth 记录上下文）
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, history = [], context } = req.body;
    if (!message || typeof message !== 'string' || message.length > MAX_CHAT_MESSAGE_LENGTH) {
      return error(res, `message must contain 1-${MAX_CHAT_MESSAGE_LENGTH} characters`, 400);
    }

    if (
      !Array.isArray(history) ||
      history.length > MAX_CHAT_HISTORY_MESSAGES ||
      history.some(item =>
        !item ||
        !['user', 'assistant'].includes(item.role) ||
        typeof item.content !== 'string' ||
        item.content.length === 0 ||
        item.content.length > MAX_CHAT_HISTORY_CONTENT_LENGTH
      )
    ) {
      return error(res, 'history contains invalid messages', 400);
    }

    if (!isValidCompanionContext(context)) {
      return error(res, 'context contains invalid page metadata', 400);
    }

    try {
      const result = await aiClient.chat(message.trim(), history, context);
      return success(res, result);
    } catch (err) {
      apiLog.warn('AI chat unavailable', {
        errorType: err instanceof Error ? err.name : 'UnknownError',
      });
      return error(res, 'AI assistant temporarily unavailable', 503);
    }
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// GET /api/ai/analytics/overview - Get analytics overview
router.get('/analytics/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const result = await aiClient.getAnalyticsOverview(days);
    return success(res, result, 'Analytics retrieved successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// GET /api/ai/analytics/trending - Get trending topics
router.get('/analytics/trending', authenticate, requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await aiClient.getTrendingTopics(limit);
    return success(res, result, 'Trending topics retrieved successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

// POST /api/ai/recommend/posts - Get recommended posts
router.post('/recommend/posts', authenticate, requireAdmin, async (req, res) => {
  try {
    const { user_id, post_id, limit = 5 } = req.body;
    
    if (!post_id) {
      return error(res, 'Post ID is required', 400);
    }

    const result = await aiClient.recommendPosts(post_id, user_id, limit);
    return success(res, result, 'Posts recommended successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
});

router.get('/companion/profile', async (_req, res) => {
  try {
    return success(res, await aiClient.getCompanionProfile());
  } catch (err) {
    apiLog.warn('AI companion profile unavailable', {
      errorType: err instanceof Error ? err.name : 'UnknownError',
    });
    return error(res, 'AI companion profile unavailable', 503);
  }
});

router.get('/index/status', authenticate, requireAdmin, async (_req, res) => {
  try {
    return success(res, await aiClient.getIndexStatus());
  } catch (err) {
    apiLog.warn('AI index status unavailable', {
      errorType: err instanceof Error ? err.name : 'UnknownError',
    });
    return error(res, 'AI index status unavailable', 503);
  }
});

router.get('/grounding/status', authenticate, requireAdmin, async (_req, res) => {
  try {
    return success(res, await aiClient.getGroundingStatus());
  } catch (err) {
    apiLog.warn('AI grounding status unavailable', {
      errorType: err instanceof Error ? err.name : 'UnknownError',
    });
    return error(res, 'AI grounding status unavailable', 503);
  }
});

router.post('/index/reconcile', authenticate, requireAdmin, async (_req, res) => {
  try {
    return success(res, await aiClient.reconcileIndex(), 'AI index reconciled');
  } catch (err) {
    apiLog.warn('AI index reconciliation failed', {
      errorType: err instanceof Error ? err.name : 'UnknownError',
    });
    return error(res, 'AI index reconciliation failed', 503);
  }
});

router.post('/index/rebuild', authenticate, requireAdmin, async (_req, res) => {
  try {
    return success(res, await aiClient.rebuildIndex(), 'AI index rebuilt');
  } catch (err) {
    apiLog.warn('AI index rebuild failed', {
      errorType: err instanceof Error ? err.name : 'UnknownError',
    });
    return error(res, 'AI index rebuild failed', 503);
  }
});

export default router;
