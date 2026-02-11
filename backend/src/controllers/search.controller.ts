import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';
import * as response from '../utils/response';

export class SearchController {
  // GET /api/search?q=keyword
  static async search(req: Request, res: Response) {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        return response.badRequest(res, 'Query parameter "q" is required');
      }

      const results = await SearchService.search(q);
      response.success(res, results);
    } catch (error: any) {
      response.error(res, error.message || 'Search failed');
    }
  }
}
