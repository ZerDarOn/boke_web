/**
 * AI Integration Routes
 * Call Python AI microservice from Node.js backend
 */

import { Router } from 'express';
import path from 'path';
import fs from 'fs';
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
  'anime', 'games', 'about', 'network', 'dashboard', 'music', 'divination',
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

// POST /api/ai/divination - 占卜馆 AI 深度解读 / 追问（公开，但限流）
router.post('/divination', optionalAuth, async (req, res) => {
  try {
    const { kind, spread, question = '', followup = '', previous_reading = '' } = req.body;

    if (!['tarot', 'iching', 'astrology'].includes(kind)) {
      return error(res, 'kind must be one of: tarot, iching, astrology', 400);
    }
    if (
      typeof spread !== 'string' ||
      spread.length < 1 ||
      spread.length > 6000
    ) {
      return error(res, 'spread must contain 1-6000 characters', 400);
    }
    if (typeof question !== 'string' || question.length > 500) {
      return error(res, 'question must be at most 500 characters', 400);
    }
    if (typeof followup !== 'string' || followup.length > 1000) {
      return error(res, 'followup must be at most 1000 characters', 400);
    }
    if (typeof previous_reading !== 'string' || previous_reading.length > 6000) {
      return error(res, 'previous_reading must be at most 6000 characters', 400);
    }

    const result = await aiClient.divinationReading({
      kind,
      spread,
      question,
      followup,
      previous_reading,
    });
    return success(res, result);
  } catch (err) {
    apiLog.warn('AI divination unavailable', {
      errorType: err instanceof Error ? err.name : 'UnknownError',
    });
    return error(res, 'AI divination temporarily unavailable', 503);
  }
});

// POST /api/ai/chat/stream - 博客 AI 助手对话 — SSE 流式输出（公开）
router.post('/chat/stream', optionalAuth, async (req, res) => {
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

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    try {
      const stream = await aiClient.chatStream(message.trim(), history, context);
      stream.pipe(res);
      // 客户端断开时销毁上游流
      req.on('close', () => {
        stream.destroy();
      });
    } catch (err) {
      apiLog.warn('AI chat stream unavailable', {
        errorType: err instanceof Error ? err.name : 'UnknownError',
      });
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'AI service unavailable' })}\n\n`);
      res.end();
    }
  } catch (err) {
    if (!res.headersSent) {
      return error(res, 'AI chat stream failed', 500);
    }
    res.end();
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

router.get('/taste-profile', authenticate, requireAdmin, async (_req, res) => {
  try {
    return success(res, await aiClient.getTasteProfile());
  } catch (err) {
    apiLog.warn('AI taste profile unavailable', {
      errorType: err instanceof Error ? err.name : 'UnknownError',
    });
    return error(res, 'AI taste profile unavailable', 503);
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

// ─────────────────────────────────────────────────────────
// AI 配置管理（读写 ai-service/.env，仅管理员）
// ─────────────────────────────────────────────────────────

const AI_SERVICE_ENV_PATH = path.join(__dirname, '..', '..', '..', 'ai-service', '.env');

const AI_SETTING_KEYS = [
  'OPENAI_API_KEY',
  'OPENAI_BASE_URL',
  'OPENAI_MODEL',
  'OPENAI_FAST_MODEL',
  'OPENAI_STANDARD_MODEL',
  'OPENAI_TEMPERATURE',
  'OPENAI_MAX_TOKENS',
  'OPENAI_TIMEOUT',
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_MODEL',
  'LOCAL_LLM_URL',
  'LOCAL_LLM_MODEL',
  'EMBEDDING_API_KEY',
  'EMBEDDING_BASE_URL',
  'EMBEDDING_MODEL',
  'KB_RELEVANCE_THRESHOLD',
  'KB_CHUNK_SIZE',
  'KB_CHUNK_OVERLAP',
] as const;

const SECRET_SETTING_KEYS = new Set<string>([
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'EMBEDDING_API_KEY',
]);

/** 前端对密钥类字段使用的“保持不变”占位符。 */
const SECRET_PLACEHOLDER = '********';

function readAiEnvEntries(): Map<string, string> {
  const entries = new Map<string, string>();
  if (!fs.existsSync(AI_SERVICE_ENV_PATH)) return entries;
  const content = fs.readFileSync(AI_SERVICE_ENV_PATH, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) entries.set(match[1], match[2].trim());
  }
  return entries;
}

function maskSecret(value: string): string {
  if (!value) return '';
  if (value.length <= 8) return `${value.slice(0, 2)}••••`;
  return `${value.slice(0, 4)}••••••${value.slice(-4)}`;
}

// GET /api/ai/settings - 获取 AI 配置（密钥脱敏）
router.get('/settings', authenticate, requireAdmin, (_req, res) => {
  try {
    const entries = readAiEnvEntries();
    const settings = AI_SETTING_KEYS.map((key) => {
      const raw = entries.get(key) ?? '';
      const isSecret = SECRET_SETTING_KEYS.has(key);
      return {
        key,
        value: isSecret ? (raw ? maskSecret(raw) : '') : raw,
        masked: isSecret && !!raw,
        set: !!raw,
      };
    });
    return success(res, { settings, envPath: AI_SERVICE_ENV_PATH });
  } catch (err) {
    apiLog.warn('AI settings read failed', {
      errorType: err instanceof Error ? err.name : 'UnknownError',
    });
    return error(res, 'AI settings read failed', 500);
  }
});

// PUT /api/ai/settings - 更新 AI 配置（写入 ai-service/.env，重启 AI 服务后生效）
router.put('/settings', authenticate, requireAdmin, async (req, res) => {
  try {
    const updates = req.body?.settings;
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return error(res, 'settings must be an object', 400);
    }
    const entries = readAiEnvEntries();
    const threshold = updates.KB_RELEVANCE_THRESHOLD;
    if (threshold !== undefined && (typeof threshold !== 'string' || !Number.isFinite(Number(threshold)) || Number(threshold) < 0 || Number(threshold) > 1)) {
      return error(res, 'KB_RELEVANCE_THRESHOLD must be between 0 and 1', 400);
    }
    const chunkSize = updates.KB_CHUNK_SIZE;
    const overlap = updates.KB_CHUNK_OVERLAP;
    const effectiveChunkSize = Number(chunkSize ?? entries.get('KB_CHUNK_SIZE') ?? 600);
    if (chunkSize !== undefined && (typeof chunkSize !== 'string' || !Number.isInteger(Number(chunkSize)) || Number(chunkSize) < 100 || Number(chunkSize) > 4000)) {
      return error(res, 'KB_CHUNK_SIZE must be an integer between 100 and 4000', 400);
    }
    if (overlap !== undefined && (typeof overlap !== 'string' || !Number.isInteger(Number(overlap)) || Number(overlap) < 0 || Number(overlap) >= effectiveChunkSize)) {
      return error(res, 'KB_CHUNK_OVERLAP must be smaller than KB_CHUNK_SIZE', 400);
    }
    const pending = new Map<string, string>();
    let changed = false;

    for (const key of AI_SETTING_KEYS) {
      if (!(key in updates)) continue;
      let value = typeof updates[key] === 'string' ? updates[key].trim() : '';
      const current = entries.get(key) ?? '';

      if (SECRET_SETTING_KEYS.has(key)) {
        // 占位符 → 保持原值；空字符串 → 清空
        if (value === SECRET_PLACEHOLDER) {
          if (!current) continue;
          continue;
        }
        if (value === current) continue;
      } else if (value === current) {
        continue;
      }

      pending.set(key, value);
      entries.set(key, value);
      changed = true;
    }

    if (!changed) {
      return success(res, { saved: false, message: '没有检测到需要保存的改动' });
    }

    // 写回 .env：保留注释与原有行顺序，仅替换/追加更新的键
    const lines = fs.existsSync(AI_SERVICE_ENV_PATH)
      ? fs.readFileSync(AI_SERVICE_ENV_PATH, 'utf-8').split(/\r?\n/)
      : [];
    const output: string[] = [];
    const seen = new Set<string>();
    for (const line of lines) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && pending.has(match[1])) {
        output.push(`${match[1]}=${pending.get(match[1])}`);
        seen.add(match[1]);
      } else {
        output.push(line);
      }
    }
    for (const key of pending.keys()) {
      if (!seen.has(key)) output.push(`${key}=${pending.get(key)}`);
    }

    fs.mkdirSync(path.dirname(AI_SERVICE_ENV_PATH), { recursive: true });
    fs.writeFileSync(AI_SERVICE_ENV_PATH, `${output.join('\n').replace(/\n+$/, '')}\n`, 'utf-8');

    apiLog.info('AI settings updated', { changedKeys: Array.from(pending.keys()) });
    let reloaded = false;
    try {
      await aiClient.reloadConfig();
      reloaded = true;
      apiLog.info('AI settings hot reload completed', { changedKeys: Array.from(pending.keys()) });
    } catch (reloadError) {
      apiLog.warn('AI settings hot reload failed', {
        changedKeys: Array.from(pending.keys()),
        errorType: reloadError instanceof Error ? reloadError.name : 'UnknownError',
      });
    }
    const rebuildRequired = pending.has('KB_CHUNK_SIZE') || pending.has('KB_CHUNK_OVERLAP');
    return success(res, {
      saved: true,
      reloaded,
      rebuildRequired,
      message: reloaded
        ? (rebuildRequired ? '已保存并热加载；分块参数变更后请重建知识库索引' : '已保存并热加载')
        : '已保存；AI 服务未能热加载，请检查服务状态后重试',
    });
  } catch (err) {
    apiLog.warn('AI settings update failed', {
      errorType: err instanceof Error ? err.name : 'UnknownError',
    });
    return error(res, 'AI settings update failed', 500);
  }
});

export default router;
