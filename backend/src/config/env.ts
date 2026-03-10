import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
    PORT: parseInt(process.env.PORT || '3001'),
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-me',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    FRONTEND_URLS: process.env.NODE_ENV === 'production'
        ? [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
          ].filter((url, index, self) => self.indexOf(url) === index)
        : [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            // 开发环境：允许所有本地网络 IP 地址访问
            'http://192.168.*:3000',
            'http://10.*:3000',
            'http://172.*:3000',
          ].filter((url, index, self) => self.indexOf(url) === index),
    API_URL: process.env.API_URL || 'http://localhost:3001',
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
    CONTENT_DIR: process.env.CONTENT_DIR || 'content',
    AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    INIT_DB: process.env.INIT_DB || 'true',  // Enable auto-initialization by default
    RESET_DB: process.env.RESET_DB || 'false',  // Force rebuild database
    
    // Security settings
    CSRF_SECRET: process.env.CSRF_SECRET || 'default-csrf-secret-change-me',
    SESSION_SECRET: process.env.SESSION_SECRET || 'default-session-secret-change-me',
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),  // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    LOGIN_MAX_ATTEMPTS: parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5'),
    LOGIN_LOCK_DURATION: parseInt(process.env.LOGIN_LOCK_DURATION || '900000'),  // 15 minutes
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) :
      [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ],
};
