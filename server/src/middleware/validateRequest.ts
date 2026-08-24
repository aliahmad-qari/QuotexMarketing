import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid request payload.',
        meta: {
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      });
      return;
    }

    req.body = parsed.data.body ?? req.body;
    req.query = parsed.data.query ?? req.query;
    req.params = parsed.data.params ?? req.params;
    next();
  };
}
