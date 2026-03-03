import { Request, Response } from 'express';
import { SettingsService } from '../services/settings.service';
import * as response from '../utils/response';

export class SettingsController {
  // GET /api/settings - 获取所有站点配置
  static async getAll(req: Request, res: Response) {
    try {
      const settings = await SettingsService.getAll();
      response.success(res, settings);
    } catch (error: any) {
      console.error('Get settings error:', error);
      response.error(res, error.message || 'Failed to fetch settings');
    }
  }

  // GET /api/settings/:key - 获取单个配置
  static async getByKey(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const value = await SettingsService.getByKey(key);
      
      if (value === null) {
        return response.error(res, 'Setting not found', 404);
      }
      
      response.success(res, { key, value });
    } catch (error: any) {
      console.error('Get setting error:', error);
      response.error(res, error.message || 'Failed to fetch setting');
    }
  }

  // PUT /api/settings - 更新单个配置
  static async update(req: Request, res: Response) {
    try {
      const { key, value } = req.body;
      
      if (!key || value === undefined) {
        return response.error(res, 'Key and value are required', 400);
      }

      const updated = await SettingsService.set(key, value);
      response.success(res, updated);
    } catch (error: any) {
      console.error('Update setting error:', error);
      response.error(res, error.message || 'Failed to update setting');
    }
  }

  // PUT /api/settings/bulk - 批量更新配置
  static async bulkUpdate(req: Request, res: Response) {
    try {
      console.log('Bulk update request body:', req.body);
      
      const { settings } = req.body;
      
      if (!settings || typeof settings !== 'object') {
        console.log('Validation failed: settings =', settings, 'type =', typeof settings);
        return response.error(res, 'Settings object is required', 400);
      }

      const updated = await SettingsService.bulkSet(settings);
      response.success(res, { 
        message: 'Settings updated successfully',
        count: updated.length 
      });
    } catch (error: any) {
      console.error('Bulk update settings error:', error);
      response.error(res, error.message || 'Failed to update settings');
    }
  }
}
