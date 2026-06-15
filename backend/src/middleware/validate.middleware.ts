import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * 删除对象中值为 null 的顶层字段。
 * 前端编辑时会把数据库里的 null 字段原样回传，Zod 的 .optional() 不接受 null，
 * 这里把 null 当作"未提供"，避免"什么都没改也保存 400"。
 */
function stripNulls<T>(body: T): T {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    for (const key of Object.keys(body as Record<string, unknown>)) {
      if ((body as Record<string, unknown>)[key] === null) {
        delete (body as Record<string, unknown>)[key];
      }
    }
  }
  return body;
}

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
  };
};

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      (req.body as any) = schema.parse(stripNulls(req.body));
      next();
    } catch (error: any) {
      console.error('[VALIDATION ERROR]', error.errors);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors?.map((e: any) => ({
        field: e.path?.join('.'),
        message: e.message,
        code: e.code,
      })),
      rawError: error.message,
      });
    }
  };
};
