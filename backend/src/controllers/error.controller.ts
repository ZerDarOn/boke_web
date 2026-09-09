import { Request, Response } from 'express';
import { log, readLogs, errorTrackerLog } from '../lib/logger';
import { sanitizeClientErrorReport } from '../lib/client-error-report';

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
    const result = sanitizeClientErrorReport(req.body);
    if (result.valid === false) {
      const statusCode = result.reason === 'payload_too_large' ? 413 : 400;
      return res.status(statusCode).json({
        success: false,
        error: result.reason === 'payload_too_large'
          ? 'Client error report is too large'
          : 'Invalid client error report',
      });
    }

    log('error', 'Error', 'Client error report', result.report);

    return res.json({
      success: true,
      message: 'Error logged successfully',
    });
  } catch (error) {
    log('error', 'Error', 'Failed to process client error report', {
      errorType: error instanceof Error ? error.name : 'UnknownError',
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to log error',
    });
  }
}
