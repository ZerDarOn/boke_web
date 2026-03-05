import { Request, Response } from 'express';
import * as response from '../utils/response';
import { readLogs, getLogCategories, LogEntry, maintenanceLog } from '../lib/logger';

export class MaintenanceController {
  /**
   * Get maintenance logs
   */
  static getMaintenanceLogs(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = readLogs('Maintenance', limit);
      
      response.success(res, {
        logs,
        total: logs.length
      });
    } catch (error: any) {
      response.error(res, error.message || 'Failed to fetch maintenance logs');
    }
  }

  /**
   * Get system logs
   */
  static getSystemLogs(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = readLogs('System', limit);
      
      response.success(res, {
        logs,
        total: logs.length
      });
    } catch (error: any) {
      response.error(res, error.message || 'Failed to fetch system logs');
    }
  }

  /**
   * Get API logs
   */
  static getApiLogs(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = readLogs('API', limit);
      
      response.success(res, {
        logs,
        total: logs.length
      });
    } catch (error: any) {
      response.error(res, error.message || 'Failed to fetch API logs');
    }
  }

  /**
   * Get database logs
   */
  static getDbLogs(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = readLogs('Database', limit);
      
      response.success(res, {
        logs,
        total: logs.length
      });
    } catch (error: any) {
      response.error(res, error.message || 'Failed to fetch database logs');
    }
  }

  /**
   * Get all log categories
   */
  static getLogCategories(req: Request, res: Response) {
    try {
      const categories = getLogCategories();
      
      response.success(res, {
        categories
      });
    } catch (error: any) {
      response.error(res, error.message || 'Failed to fetch log categories');
    }
  }

  /**
   * Filter logs by level
   */
  static filterLogs(req: Request, res: Response) {
    try {
      const { category, level } = req.query;
      
      if (!category || typeof category !== 'string') {
        response.error(res, 'Category is required');
        return;
      }
      
      const limit = parseInt(req.query.limit as string) || 100;
      let logs = readLogs(category, limit);
      
      // Filter by level if specified
      if (level && typeof level === 'string') {
        logs = logs.filter(log => log.level === level);
      }
      
      response.success(res, {
        logs,
        total: logs.length
      });
    } catch (error: any) {
      response.error(res, error.message || 'Failed to filter logs');
    }
  }

  /**
   * Search logs
   */
  static searchLogs(req: Request, res: Response) {
    try {
      const { category, query } = req.query;
      
      if (!category || typeof category !== 'string') {
        response.error(res, 'Category is required');
        return;
      }
      
      if (!query || typeof query !== 'string') {
        response.error(res, 'Search query is required');
        return;
      }
      
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = readLogs(category, 1000); // Read more for search
      const searchLower = query.toLowerCase();
      
      const filteredLogs = logs
        .filter(log => 
          log.message.toLowerCase().includes(searchLower) ||
          log.category.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.data || '').toLowerCase().includes(searchLower)
        )
        .slice(0, limit);
      
      response.success(res, {
        logs: filteredLogs,
        total: filteredLogs.length
      });
    } catch (error: any) {
      response.error(res, error.message || 'Failed to search logs');
    }
  }

  /**
   * Clear logs (maintenance only)
   */
  static clearLogs(req: Request, res: Response) {
    try {
      const { category } = req.query;
      
      if (!category || typeof category !== 'string') {
        response.error(res, 'Category is required');
        return;
      }
      
      // Read all logs
      const logs = readLogs(category, 10000);
      
      // Keep only last 10 logs (quick clear)
      const recentLogs = logs.slice(0, 10);
      
      // Write back
      const fs = require('fs');
      const path = require('path');
      const LOG_DIR = path.join(process.cwd(), 'logs');
      const logFile = path.join(LOG_DIR, `${category.toLowerCase()}.log`);
      
      const content = recentLogs.map(log => JSON.stringify(log)).join('\n') + '\n';
      fs.writeFileSync(logFile, content);
      
      maintenanceLog.info(`Cleared logs for category: ${category}`, { kept: recentLogs.length });
      
      response.success(res, {
        message: `Logs cleared. Kept ${recentLogs.length} most recent entries.`
      });
    } catch (error: any) {
      response.error(res, error.message || 'Failed to clear logs');
    }
  }
}
