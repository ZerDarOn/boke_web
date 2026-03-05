import { Router } from 'express';
import { MaintenanceController } from '../controllers/maintenance.controller';
import {
  handleMaintenanceLogin,
  handleTokenVerify,
  requireMaintenanceAuth
} from '../middleware/maintenance.middleware';

const router = Router();

// Public: Maintenance mode status
router.get('/status', (req, res) => {
  res.json({
    enabled: process.env.MAINTENANCE_MODE === 'true'
  });
});

// Public: Login endpoint
router.post('/login', handleMaintenanceLogin);

// Public: Verify token endpoint
router.get('/verify', handleTokenVerify);

// Protected: Get maintenance logs
router.get('/logs/maintenance', requireMaintenanceAuth, MaintenanceController.getMaintenanceLogs);

// Protected: Get system logs
router.get('/logs/system', requireMaintenanceAuth, MaintenanceController.getSystemLogs);

// Protected: Get API logs
router.get('/logs/api', requireMaintenanceAuth, MaintenanceController.getApiLogs);

// Protected: Get database logs
router.get('/logs/database', requireMaintenanceAuth, MaintenanceController.getDbLogs);

// Protected: Get all log categories
router.get('/logs/categories', requireMaintenanceAuth, MaintenanceController.getLogCategories);

// Protected: Filter logs
router.get('/logs/filter', requireMaintenanceAuth, MaintenanceController.filterLogs);

// Protected: Search logs
router.get('/logs/search', requireMaintenanceAuth, MaintenanceController.searchLogs);

// Protected: Clear logs
router.post('/logs/clear', requireMaintenanceAuth, MaintenanceController.clearLogs);

export default router;
