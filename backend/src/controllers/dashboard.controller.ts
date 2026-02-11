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
}
