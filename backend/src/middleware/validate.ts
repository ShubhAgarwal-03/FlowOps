import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';

// validates body/query/params against a Zod schema, replaces req fields with parsed+typed values
export const validate = (schema: AnyZodObject) => (req: Request, _res: Response, next: NextFunction) => {
  const parsed = schema.parse({
    body: req.body,
    query: req.query,
    params: req.params,
  });
  req.body = parsed.body ?? req.body;
  req.query = parsed.query ?? req.query;
  req.params = parsed.params ?? req.params;
  next();
};