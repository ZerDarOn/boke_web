import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

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
      (req.body as any) = schema.parse(req.body);
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
