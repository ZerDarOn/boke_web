import { Router } from 'express';
import { getErrorLogs, clearErrorLogs, logClientError } from '../controllers/error.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Log client errors (public endpoint)
router.post('/log', logClientError);

// Get error logs (admin only)
router.get('/logs', authenticate, requireAdmin, getErrorLogs);

// Clear error logs (admin only)
router.delete('/logs', authenticate, requireAdmin, clearErrorLogs);

export default router;
