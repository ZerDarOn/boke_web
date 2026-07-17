import { Request, Response } from 'express';
import { SettingsService } from '../services/settings.service';
import * as response from '../utils/response';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 将 aiConfig 同步写入 ai-service/.env 文件。
 * 管理员在后台修改 AI 模型配置并保存后，自动更新 Python 服务的环境变量。
 */
function syncAiEnv(aiConfig: any): void {
  try {
    const envPath = path.resolve(__dirname, '..', '..', '..', 'ai-service', '.env');
    const dir = path.dirname(envPath);
    if (!fs.existsSync(dir)) return; // ai-service 目录不存在，跳过

    // 读取现有 .env，保留非 AI 相关的行
    const aiKeys = new Set([
      'OPENAI_API_KEY', 'OPENAI_BASE_URL', 'OPENAI_MODEL', 'OPENAI_MAX_TOKENS',
      'ANTHROPIC_API_KEY', 'ANTHROPIC_BASE_URL', 'ANTHROPIC_MODEL', 'ANTHROPIC_MAX_TOKENS',
      'LOCAL_LLM_URL', 'LOCAL_LLM_MODEL',
    ]);
    const existingLines: string[] = fs.existsSync(envPath)
      ? fs.readFileSync(envPath, 'utf-8').split('\n').filter(
          (line) => !aiKeys.has(line.split('=')[0].trim())
        )
      : [];

    const newAiLines: string[] = [];
    const provider = aiConfig.provider || 'openai';

    if (provider === 'openai') {
      if (aiConfig.apiKey) newAiLines.push(`OPENAI_API_KEY=${aiConfig.apiKey}`);
      if (aiConfig.baseUrl) newAiLines.push(`OPENAI_BASE_URL=${aiConfig.baseUrl}`);
      if (aiConfig.model) newAiLines.push(`OPENAI_MODEL=${aiConfig.model}`);
      newAiLines.push(`OPENAI_MAX_TOKENS=${aiConfig.maxTokens || 2048}`);
    } else if (provider === 'anthropic') {
      if (aiConfig.apiKey) newAiLines.push(`ANTHROPIC_API_KEY=${aiConfig.apiKey}`);
      if (aiConfig.baseUrl) newAiLines.push(`ANTHROPIC_BASE_URL=${aiConfig.baseUrl}`);
      if (aiConfig.model) newAiLines.push(`ANTHROPIC_MODEL=${aiConfig.model}`);
      newAiLines.push(`ANTHROPIC_MAX_TOKENS=${aiConfig.maxTokens || 4096}`);
    } else if (provider === 'local') {
      if (aiConfig.baseUrl) newAiLines.push(`LOCAL_LLM_URL=${aiConfig.baseUrl}`);
      if (aiConfig.model) newAiLines.push(`LOCAL_LLM_MODEL=${aiConfig.model}`);
    }

    // 拼接写入
    const filteredExisting = existingLines.filter((l) => l.trim()).join('\n');
    const newContent = (
      (filteredExisting ? filteredExisting + '\n' : '') +
      newAiLines.join('\n') +
      '\n'
    );

    fs.writeFileSync(envPath, newContent, 'utf-8');
    console.log('[AI Config] Synced to ai-service/.env');
  } catch (err: any) {
    console.warn('[AI Config] Failed to sync .env:', err.message);
  }
}

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

      // 如果提交了 AI 模型配置，同步写入 ai-service/.env
      if (settings.aiConfig && typeof settings.aiConfig === 'object') {
        syncAiEnv(settings.aiConfig);
      }

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
