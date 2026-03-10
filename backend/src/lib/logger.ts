import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_RETENTION_DAYS = 7;

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  stack?: string;
}

/**
 * Write log to file (synchronous for critical errors)
 */
function writeLog(filename: string, entry: LogEntry, sync: boolean = false): void {
  const logFile = path.join(LOG_DIR, filename);
  const logLine = JSON.stringify(entry) + '\n';

  if (sync) {
    try {
      fs.appendFileSync(logFile, logLine);
    } catch (err) {
      console.error('Failed to write log (sync):', err);
    }
  } else {
    fs.appendFile(logFile, logLine, (err) => {
      if (err) {
        console.error('Failed to write log:', err);
      }
    });
  }
}

/**
 * Log to console and file
 */
export function log(level: LogLevel, category: string, message: string, data?: any): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    ...(data && { data })
  };
  
  // Console output with color
  const colors = {
    info: '\x1b[36m', // Cyan
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    debug: '\x1b[35m' // Magenta
  };
  const reset = '\x1b[0m';
  const prefix = `${colors[level]}[${level.toUpperCase()}]${reset} [${category}]`;
  
  console.log(`${prefix} ${message}`, data || '');
  
  // Write to file
  const filename = `${category.toLowerCase()}.log`;
  writeLog(filename, entry);
}

/**
 * Log error with stack trace (synchronous)
 */
export function logError(category: string, error: Error | string, data?: any): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const stack = error instanceof Error ? error.stack : undefined;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    category,
    message: errorMessage,
    ...(data && { data }),
    ...(stack && { stack })
  };

  const colors = {
    info: '\x1b[36m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
    debug: '\x1b[35m'
  };
  const reset = '\x1b[0m';
  const prefix = `${colors.error}[ERROR]${reset} [${category}]`;

  console.log(`${prefix} ${message}`, data || '');
  if (stack && process.env.NODE_ENV === 'development') {
    console.log(stack);
  }

  // Write to file synchronously for errors
  const filename = `${category.toLowerCase()}.log`;
  writeLog(filename, entry, true);
}

/**
 * Error logger with convenience methods
 */
export const errorLogger = {
  error: (message: string, error?: Error | string, data?: any) => logError('App', error || message, data),
  warn: (message: string, data?: any) => log('warn', 'App', message, data),
  info: (message: string, data?: any) => log('info', 'App', message, data),
  debug: (message: string, data?: any) => log('debug', 'App', message, data),
};

/**
 * Read logs from file
 */
export function readLogs(category: string, limit: number = 100): LogEntry[] {
  const logFile = path.join(LOG_DIR, `${category.toLowerCase()}.log`);
  
  if (!fs.existsSync(logFile)) {
    return [];
  }
  
  try {
    const content = fs.readFileSync(logFile, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line);
    const entries = lines
      .map(line => {
        try {
          return JSON.parse(line) as LogEntry;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is LogEntry => entry !== null);
    
    // Return most recent logs first
    return entries.slice(-limit).reverse();
  } catch (error) {
    logError('Logs', `Failed to read log file: ${category}`, error);
    return [];
  }
}

/**
 * Get all available log categories
 */
export function getLogCategories(): string[] {
  try {
    const files = fs.readdirSync(LOG_DIR);
    return files
      .filter(file => file.endsWith('.log'))
      .map(file => file.replace('.log', ''))
      .sort();
  } catch (error) {
    logError('Logs', 'Failed to read log directory', error);
    return [];
  }
}

/**
 * Clean up old log files
 */
export function cleanupOldLogs(): void {
  try {
    const files = fs.readdirSync(LOG_DIR);
    const now = Date.now();
    
    files.forEach(file => {
      const filePath = path.join(LOG_DIR, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;
      const ageInDays = age / (1000 * 60 * 60 * 24);
      
      if (ageInDays > LOG_RETENTION_DAYS) {
        fs.unlinkSync(filePath);
        log('info', 'Logs', `Deleted old log file: ${file}`);
      }
    });
  } catch (error) {
    logError('Logs', 'Failed to cleanup old logs', error);
  }
}

// Cleanup old logs on startup
cleanupOldLogs();

/**
 * Maintenance logs
 */
export const maintenanceLog = {
  info: (message: string, data?: any) => log('info', 'Maintenance', message, data),
  warn: (message: string, data?: any) => log('warn', 'Maintenance', message, data),
  error: (message: string, error?: Error | string, data?: any) => logError('Maintenance', error || message, data)
};

/**
 * System logs
 */
export const systemLog = {
  info: (message: string, data?: any) => log('info', 'System', message, data),
  warn: (message: string, data?: any) => log('warn', 'System', message, data),
  error: (message: string, error?: Error | string, data?: any) => logError('System', error || message, data)
};

/**
 * API logs
 */
export const apiLog = {
  info: (message: string, data?: any) => log('info', 'API', message, data),
  warn: (message: string, data?: any) => log('warn', 'API', message, data),
  error: (message: string, error?: Error | string, data?: any) => logError('API', error || message, data)
};

/**
 * Error logs (for tracking errors specifically)
 */
export const errorTrackerLog = {
  error: (message: string, error?: Error | string, data?: any) => logError('Error', error || message, data),
  warn: (message: string, data?: any) => log('warn', 'Error', message, data),
  info: (message: string, data?: any) => log('info', 'Error', message, data),
};

/**
 * Database logs
 */
export const dbLog = {
  info: (message: string, data?: any) => log('info', 'Database', message, data),
  warn: (message: string, data?: any) => log('warn', 'Database', message, data),
  error: (message: string, error?: Error | string, data?: any) => logError('Database', error || message, data)
};
