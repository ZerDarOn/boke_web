import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';

// Import routes
import postRoutes from './routes/posts';
import projectRoutes from './routes/projects';
import announcementRoutes from './routes/announcements';
import animeRoutes from './routes/anime';
import diaryRoutes from './routes/diary';
import galleryRoutes from './routes/gallery';
import skillRoutes from './routes/skills';
import timelineRoutes from './routes/timeline';
import networkRoutes from './routes/network';
import dashboardRoutes from './routes/dashboard';
import searchRoutes from './routes/search';
import uploadRoutes from './routes/upload';
import authRoutes from './routes/auth';
import fileRoutes from './routes/files';
import rssRoutes from './routes/rss';
import aiRoutes from './routes/ai';
import settingsRoutes from './routes/settings';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS - 允许 localhost 和本地 IP 地址访问
const allowedOrigins = config.FRONTEND_URLS;

console.log('🔍 CORS 允许的来源列表:');
allowedOrigins.forEach(origin => console.log(`  - ${origin}`));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('dev'));
app.use(requestLogger);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.NODE_ENV,
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
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/rss.xml', rssRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
