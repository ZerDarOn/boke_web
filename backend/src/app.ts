import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';
import {
  generalRateLimit,
  authRateLimit,
  uploadRateLimit,
  formRateLimit,
} from './middleware/rate-limit.middleware';
import { sanitizeInput, addXSSProtectionHeaders } from './lib/sanitizer';
import { initializeCache, cache } from './lib/cache';

// Import routes — single barrel entry point
import {
  postRoutes,
  projectRoutes,
  announcementRoutes,
  animeRoutes,
  diaryRoutes,
  galleryRoutes,
  skillRoutes,
  timelineRoutes,
  networkRoutes,
  universeRoutes,
  dashboardRoutes,
  searchRoutes,
  uploadRoutes,
  minioRoutes,
  authRoutes,
  fileRoutes,
  rssRoutes,
  aiRoutes,
  settingsRoutes,
  maintenanceRoutes,
  currentStatusRoutes,
  historyRoutes,
  contentRoutes,
  exportRoutes,
  errorRoutes,
  gameRoutes,
} from './routes';
import fileService from './services/file.service';

const app = express();

// Initialize services
fileService.initialize().catch(err => {
  console.error('Failed to initialize file service:', err);
});

initializeCache().catch(err => {
  console.error('Failed to initialize cache:', err);
});

// Security middleware - 加强的安全头配置
app.use(helmet({
  // Content Security Policy - 防止 XSS
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "data:", "https:"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      // 不启用 upgrade-insecure-requests：本站子资源要么同源、要么外链本身是 https，
      // 强升会把 http(局域网/本地)访问时的 js/css 子请求升级成 https 而失败导致白屏。
      upgradeInsecureRequests: null,
    },
  },
  // 防止点击劫持
  frameguard: {
    action: 'deny',
  },
  // 防止 MIME 类型嗅探
  noSniff: true,
  // 防止 XSS 攻击（旧版浏览器）
  xssFilter: true,
  // 禁用 IE 的兼容性视图
  ieNoOpen: true,
  // 严格传输安全（仅生产环境）
  hsts: {
    maxAge: 31536000,  // 1 年
    includeSubDomains: true,
    preload: true,
  },
  //referrer 策略
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  // 隐藏 X-Powered-By 头
  hidePoweredBy: true,
}));

// CORS - 允许 localhost 和本地 IP 地址访问
const allowedOrigins = config.FRONTEND_URLS;

// 将通配符模式转换为正则表达式
const originPatterns = allowedOrigins.map(allowed => {
  // 检查是否是通配符模式（包含 * 但不是正则）
  if (allowed.includes('*')) {
    // 转义特殊字符，然后替换 * 为匹配任意字符的正则
    const pattern = allowed
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')  // 转义正则特殊字符（除了 *）
      .replace(/\*/g, '.*');  // * 匹配任意字符
    return new RegExp(`^${pattern}$`);
  }
  return allowed;  // 精确匹配的字符串
});

console.log('🔍 CORS 允许的来源列表:');
allowedOrigins.forEach(origin => console.log(`  - ${origin}`));

app.use(cors({
  origin: (origin, callback) => {
    // 拒绝无 Origin 或 null origin（sandbox iframe / data: URL 等可构造）
    if (!origin || origin === 'null') {
      callback(null, false);
      return;
    }

    // 检查是否匹配任一允许的来源（支持通配符）
    const isAllowed = originPatterns.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(origin);
      }
      return pattern === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-maintenance-token', 'x-post-access-token'],
}));

// Rate limiting - 通用速率限制
app.use(generalRateLimit);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('dev'));
app.use(requestLogger);

// Input sanitization and XSS protection
app.use(sanitizeInput);
app.use(addXSSProtectionHeaders);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.NODE_ENV,
    cache: cache.getStats(),
  });
});

// Static files (uploads)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api/posts', postRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/anime', animeRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/universe', universeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRateLimit, uploadRoutes);  // 文件上传速率限制
app.use('/api/minio', minioRoutes);
app.use('/api/auth', authRateLimit, authRoutes);     // 认证路由速率限制
app.use('/api/files', fileRoutes);
app.use('/api/rss', rssRoutes);
app.use('/api/ai', formRateLimit, aiRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/current-status', currentStatusRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/error', errorRoutes);
app.use('/api/games', gameRoutes);
app.use('/rss.xml', rssRoutes);

// 托管打包好的前端（单端口部署）：存在 frontend/dist 时，
// 非 /api、/uploads、/rss 的 GET 请求一律返回 index.html，交给前端路由处理。
// 这样直接访问/刷新 /admin/... 等前端路由不会 404。
const frontendDist = path.join(process.cwd(), '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/uploads') ||
      req.path.startsWith('/rss')
    ) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
