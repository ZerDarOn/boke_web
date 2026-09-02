import { Router, Request } from 'express';
import { ZodObject } from 'zod';
import * as response from '../utils/response';
import { validateBody } from '../middleware/validate.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { cacheMiddleware, invalidateCache } from '../middleware/cache.middleware';

/**
 * CRUD 路由工厂：收敛各域路由中逐字重复的五件套
 * （GET /、GET /:id、POST /、PUT /:id、DELETE /:id）。
 *
 * 用法（域路由文件内）：
 *   const router = Router();
 *   // 域特有子路由（/latest、/stats 等）必须先挂，否则会被 GET /:id 吞掉
 *   router.get('/stats', ...);
 *   registerCrudRoutes(router, {
 *     service: ProjectService,
 *     schema: projectSchema,
 *     keyPrefix: 'projects',
 *     list: async (req) => ({ data, meta }),
 *     messages: { notFound: 'Project not found', fetchFailed: '...', deleteFailed: '...' },
 *   });
 *   export default router;
 */

/** 域服务层需提供的 CRUD 原语（多数域现有方法名天然满足） */
export interface CrudService<TEntity = unknown> {
  findById(id: string): Promise<TEntity | null>;
  create(data: any): Promise<TEntity>;
  update(id: string, data: any): Promise<TEntity>;
  /** Prisma delete 返回被删记录，路由层不使用返回值，此处放宽为 unknown */
  delete(id: string): Promise<unknown>;
}

/** 列表查询回调：只关心取数，路由层统一包 try/catch 与响应格式 */
export type CrudListQuery<TResult = unknown> = (
  req: Request
) => Promise<{ data: TResult[]; meta?: unknown }>;

export interface CrudMessages {
  notFound: string;
  fetchFailed: string;
  deleteFailed: string;
}

export interface CrudRouteOptions<TEntity> {
  service: CrudService<TEntity>;
  /** zod schema：POST 用完整版，PUT 自动取 .partial() */
  schema: ZodObject<any>;
  /** 路由挂载前缀（默认 ''；如 network 域的 CRUD 挂在 '/nodes' 下） */
  basePath?: string;
  /** 缓存键前缀：GET 缓存 + 写路由失效 */
  keyPrefix: string;
  /** GET 缓存 TTL 秒数（默认 300） */
  ttl?: number;
  /** 详情缓存键前缀（缺省同 keyPrefix；如 projects 域详情用单数 'project'） */
  detailKeyPrefix?: string;
  /** 详情缓存 TTL（缺省同 ttl） */
  detailTtl?: number;
  /** 列表查询；不传则不挂 GET / */
  list?: CrudListQuery;
  messages: CrudMessages;
}

export function registerCrudRoutes<TEntity>(
  router: Router,
  options: CrudRouteOptions<TEntity>
): Router {
  const {
    service,
    schema,
    basePath = '',
    keyPrefix,
    ttl = 300,
    detailKeyPrefix = keyPrefix,
    detailTtl = ttl,
    list,
    messages,
  } = options;

  const rootPath = basePath === '' ? '/' : basePath;
  const detailPath = `${basePath}/:id`;

  // 详情键与列表键不同的域（如 projects/project），写操作需要双失效
  const invalidateDetail =
    detailKeyPrefix === keyPrefix ? [] : [invalidateCache(`${detailKeyPrefix}:*`)];

  if (list) {
    router.get(rootPath, cacheMiddleware({ ttl, keyPrefix }), async (req, res) => {
      try {
        const { data, meta } = await list(req);
        response.success(res, data, undefined, meta);
      } catch (error: any) {
        response.error(res, error.message || messages.fetchFailed);
      }
    });
  }

  router.get(detailPath, cacheMiddleware({ ttl: detailTtl, keyPrefix: detailKeyPrefix }), async (req, res) => {
    try {
      const item = await service.findById(req.params.id);
      if (!item) {
        return response.notFound(res, messages.notFound);
      }
      response.success(res, item);
    } catch (error: any) {
      response.error(res, error.message || messages.fetchFailed);
    }
  });

  router.post(
    rootPath,
    authenticate,
    requireAdmin,
    validateBody(schema),
    invalidateCache(`${keyPrefix}:*`),
    async (req, res) => {
      try {
        const item = await service.create(req.body);
        response.created(res, item);
      } catch (error: any) {
        response.badRequest(res, error.message);
      }
    }
  );

  router.put(
    '/:id',
    authenticate,
    requireAdmin,
    validateBody(schema.partial()),
    invalidateCache(`${keyPrefix}:*`),
    ...invalidateDetail,
    async (req, res) => {
      try {
        const item = await service.update(req.params.id, req.body);
        response.success(res, item);
      } catch (error: any) {
        response.badRequest(res, error.message);
      }
    }
  );

  router.delete(
    detailPath,
    authenticate,
    requireAdmin,
    invalidateCache(`${keyPrefix}:*`),
    ...invalidateDetail,
    async (req, res) => {
      try {
        await service.delete(req.params.id);
        response.noContent(res);
      } catch (error: any) {
        response.error(res, error.message || messages.deleteFailed);
      }
    }
  );

  return router;
}
