//Vérif JWT
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accès non autorisé' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; sub?: string; _id?: string };
    req.userId = decoded.id || decoded.sub || decoded._id;
    if (!req.userId) return res.status(401).json({ message: 'Token invalide' });
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalide' });
  }
};

