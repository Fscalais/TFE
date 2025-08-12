//Bloque les requêtes invalide
import type { ZodTypeAny } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validateBody = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map(i => i.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    req.body = parsed.data;
    next();
  };
};