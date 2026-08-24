import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import * as response from '../utils/response';

export class DashboardController {
  // GET /api/dashboard/stats
  static async getStats(req: Request, res: Response) {
    try {
      const stats = await DashboardService.getStats();
      response.success(res, stats);
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      response.error(res, error.message || 'Failed to fetch dashboard stats');
    }
  }

  // GET /api/dashboard/popular
  static async getPopular(req: Request, res: Response) {
    try {
      const popular = await DashboardService.getPopularContent();
      response.success(res, popular);
    } catch (error: any) {
      response.error(res, error.message || 'Failed to fetch popular content');
    }
  }

  // GET /api/dashboard/content-distribution
  static async getContentDistribution(req: Request, res: Response) {
    try {
      const distribution = await DashboardService.getContentDistribution();
      response.success(res, distribution);
    } catch (error: any) {
      response.error(res, error.message || 'Failed to fetch content distribution');
    }
  }

  // POST /api/dashboard/track
  static async trackVisit(req: Request, res: Response) {
    try {
      await DashboardService.recordVisit(req.body.visitorId);
      res.status(204).end();
    } catch (error: any) {
      response.error(res, error.message || 'Failed to record visit');
    }
  }

  // POST /api/dashboard/events
  static async trackEvent(req: Request, res: Response) {
    try {
      await DashboardService.recordBehaviorEvent(req.body.visitorId, req.body);
      res.status(204).end();
    } catch (error: any) {
      response.error(res, error.message || 'Failed to record behavior event');
    }
  }

  // GET /api/dashboard/admin-overview
  static async getAdminOverview(req: Request, res: Response) {
    try {
      response.success(res, await DashboardService.getAdminOverview());
    } catch (error: any) {
      response.error(res, error.message || 'Failed to fetch admin overview');
    }
  }
}
