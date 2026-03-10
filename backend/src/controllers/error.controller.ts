import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { errorTrackerLog } from '../lib/logger';
import { readLogs } from '../lib/logger';

export function getErrorLogs(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = readLogs('Error', limit);

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    errorTrackerLog.error('Failed to get error logs', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve error logs',
    });
  }
}

export function clearErrorLogs(req: Request, res: Response) {
  try {
    const fs = require('fs');
    const path = require('path');
    const LOG_DIR = path.join(process.cwd(), 'logs');
    const errorLogFile = path.join(LOG_DIR, 'error.log');

    if (fs.existsSync(errorLogFile)) {
      fs.unlinkSync(errorLogFile);
      errorTrackerLog.info('Error logs cleared');
    }

    res.json({
      success: true,
      message: 'Error logs cleared successfully',
    });
  } catch (error) {
    errorTrackerLog.error('Failed to clear error logs', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear error logs',
    });
  }
}

export async function logClientError(req: Request, res: Response) {
  try {
    const errorData = req.body;

    errorTrackerLog.error('Client error:', errorData);

    res.json({
      success: true,
      message: 'Error logged successfully',
    });
  } catch (error) {
    errorTrackerLog.error('Failed to log client error', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to log error',
    });
  }
}
