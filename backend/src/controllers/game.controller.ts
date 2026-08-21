import { Request, Response } from 'express';
import { GameService } from '../services/game.service';
import { getPagination, createMeta } from '../utils/pagination';
import * as response from '../utils/response';
import { log, logError } from '../lib/logger';

export class GameController {
  // GET /api/games
  static async getAll(req: Request, res: Response) {
    try {
      const pagination = getPagination(
        req.query.page as string,
        req.query.limit as string
      );

      const { games, total } = await GameService.findMany({
        pagination,
        status: req.query.status as string,
        platform: req.query.platform as string,
        // 仅在显式传入 favorite 参数时才按收藏过滤；缺省时不过滤（否则会误当成 favorite:false）
        favorite: req.query.favorite !== undefined ? req.query.favorite === 'true' : undefined,
        includeHidden: req.query.includeHidden === 'true',
      });

      response.success(res, games, undefined, createMeta(total, pagination));
    } catch (error: any) {
      response.error(res, error.message || 'Failed to fetch games');
    }
  }

  // GET /api/games/:id
  static async getById(req: Request, res: Response) {
    try {
      const game = await GameService.findById(req.params.id);
      if (!game) {
        return response.notFound(res, 'Game not found');
      }
      response.success(res, game);
    } catch (error: any) {
      response.error(res, error.message || 'Failed to fetch game');
    }
  }

  // POST /api/games
  static async create(req: Request, res: Response) {
    try {
      const game = await GameService.create(req.body);
      log('info', 'GameHighlights', 'Game created', {
        gameId: game.id,
        highlightsCount: Array.isArray(req.body.highlights) ? req.body.highlights.length : 0,
      });
      response.created(res, game);
    } catch (error: any) {
      logError('GameHighlights', error.message || 'Failed to create game');
      response.badRequest(res, error.message);
    }
  }

  // PUT /api/games/:id
  static async update(req: Request, res: Response) {
    try {
      const game = await GameService.update(req.params.id, req.body);
      log('info', 'GameHighlights', 'Game updated', {
        gameId: game.id,
        highlightsCount: Array.isArray(req.body.highlights) ? req.body.highlights.length : undefined,
      });
      response.success(res, game, 'Game updated successfully');
    } catch (error: any) {
      logError('GameHighlights', error.message || 'Failed to update game', { gameId: req.params.id });
      response.badRequest(res, error.message);
    }
  }

  // DELETE /api/games/:id
  static async delete(req: Request, res: Response) {
    try {
      await GameService.delete(req.params.id);
      response.noContent(res);
    } catch (error: any) {
      response.error(res, error.message || 'Failed to delete game');
    }
  }

  // POST /api/games/:id/favorite
  static async toggleFavorite(req: Request, res: Response) {
    try {
      const game = await GameService.toggleFavorite(req.params.id);
      if (!game) {
        return response.notFound(res, 'Game not found');
      }
      response.success(res, game);
    } catch (error: any) {
      response.badRequest(res, error.message);
    }
  }

  // POST /api/games/:id/score
  static async updateScore(req: Request, res: Response) {
    try {
      const { score } = req.body;
      const game = await GameService.updateScore(req.params.id, score);
      if (!game) {
        return response.notFound(res, 'Game not found');
      }
      response.success(res, game);
    } catch (error: any) {
      response.badRequest(res, error.message);
    }
  }

  // PUT /api/games/:id/progress
  static async updateProgress(req: Request, res: Response) {
    try {
      const { playtime } = req.body;
      const game = await GameService.updateProgress(req.params.id, playtime);
      if (!game) {
        return response.notFound(res, 'Game not found');
      }
      response.success(res, game);
    } catch (error: any) {
      response.badRequest(res, error.message);
    }
  }

  // PUT /api/games/:id/achievements
  static async updateAchievements(req: Request, res: Response) {
    try {
      const { unlocked } = req.body;
      const game = await GameService.updateAchievements(req.params.id, unlocked);
      if (!game) {
        return response.notFound(res, 'Game not found');
      }
      response.success(res, game);
    } catch (error: any) {
      response.badRequest(res, error.message);
    }
  }

  // POST /api/games/sync-steam
  static async syncSteam(req: Request, res: Response) {
    try {
      const steamApiKey = process.env.STEAM_API_KEY;
      const steamUserId = process.env.STEAM_USER_ID;

      if (!steamApiKey || !steamUserId) {
        return response.badRequest(
          res,
          'Steam sync is not configured. Set STEAM_API_KEY and STEAM_USER_ID in environment.',
        );
      }

      const result = await GameService.syncSteamLibrary(steamUserId, steamApiKey);
      response.success(res, result, 'Steam library synced successfully');
    } catch (error: any) {
      logError('SteamSync', error.message || 'Steam sync failed', { error });
      response.error(res, error.message || 'Failed to sync Steam library');
    }
  }
}
