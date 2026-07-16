import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// 必需的环境变量（生产环境强制检查）
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
];

// 敏感的默认值（生产环境不应使用）
const INSECURE_DEFAULTS: Record<string, string> = {
  'JWT_SECRET': 'default-secret-change-me',
  'CSRF_SECRET': 'default-csrf-secret-change-me',
  'SESSION_SECRET': 'default-session-secret-change-me',
};

/**
 * 验证生产环境配置
 * 在生产环境中检查必需的环境变量和不安全的默认值
 */
export function validateProductionEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    return { valid: true, errors: [] };
  }

  // 检查必需的环境变量
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      errors.push(`缺少必需的环境变量: ${varName}`);
    }
  }

  // 检查是否使用了不安全的默认值
  for (const [varName, insecureValue] of Object.entries(INSECURE_DEFAULTS)) {
    if (process.env[varName] === insecureValue) {
      errors.push(`${varName} 使用了不安全的默认值，请在生产环境中设置安全的密钥`);
    }
  }

  if (process.env.MAINTENANCE_MODE === 'true') {
    const maintenancePassword = process.env.MAINTENANCE_PASSWORD;
    if (!maintenancePassword || maintenancePassword.length < 16) {
      errors.push('MAINTENANCE_MODE=true requires a MAINTENANCE_PASSWORD with at least 16 characters');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 输出安全警告（所有环境生效，不阻断启动）
 * 开发环境同样需要意识到使用了默认密钥的风险
 */
export function logSecurityWarnings(): void {
  const warnings: string[] = [];

  for (const [varName, insecureValue] of Object.entries(INSECURE_DEFAULTS)) {
    if (process.env[varName] === insecureValue) {
      warnings.push(`  ⚠️  ${varName} 使用了默认值 "${insecureValue}" — ${process.env.NODE_ENV === 'production' ? '生产环境严禁使用！' : '建议设置真实密钥'}`);
    }
  }

  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      warnings.push(`  ⚠️  缺少环境变量: ${varName}`);
    }
  }

  if (warnings.length > 0) {
    console.warn('\n🔒 安全警告 (env.ts):\n');
    warnings.forEach(w => console.warn(w));
    if (process.env.NODE_ENV !== 'production') {
      console.warn('\n  💡 提示: 开发环境可以忽略，但请确保生产部署前修改 .env');
    }
    console.warn('');
  }
}

export const config = {
    PORT: parseInt(process.env.PORT || '3001'),
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-me',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    FRONTEND_URLS: (() => {
      const baseUrls = process.env.NODE_ENV === 'production'
        ? [
            process.env.FRONTEND_URL || 'http://localhost:5173',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
          ]
        : [
            process.env.FRONTEND_URL || 'http://localhost:5173',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3001',
            'http://localhost:3002',
            'http://localhost:3003',
            'http://localhost:3004',
            // 开发环境：允许所有本地网络 IP 地址访问
            'http://192.168.*:*',
            'http://10.*:*',
            'http://172.*:*',
          ];
      
      // 添加 ALLOWED_ORIGINS 中的地址（包含隧道域名通配符）
      const allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : [];
      
      return [...baseUrls, ...allowedOrigins].filter((url, index, self) => 
        self.indexOf(url) === index
      );
    })(),
    API_URL: process.env.API_URL || 'http://localhost:3001',
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
    CONTENT_DIR: process.env.CONTENT_DIR || 'content',
    AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    REDIS_URL: process.env.REDIS_URL || '',
    INIT_DB: process.env.INIT_DB || 'true',
    RESET_DB: process.env.RESET_DB || 'false',
    
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
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ],
};
