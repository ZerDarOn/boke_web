import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';

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

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

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

// RSS Feed
app.get('/rss.xml', async (req, res) => {
  // TODO: Generate RSS feed
  res.type('application/xml');
  res.send('<?xml version="1.0"?><rss version="2.0"><channel><title>INK.SPIRIT</title></channel></rss>');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(config.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
