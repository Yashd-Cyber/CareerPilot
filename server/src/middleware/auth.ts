import type { NextFunction, Request, Response } from 'express';

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
    role: 'STUDENT' | 'ADMIN';
    name: string;
  };
};

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const sessionUser = (req.session as any)?.user;
  if (!sessionUser) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  req.user = sessionUser;
  next();
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const sessionUser = (req.session as any)?.user;
  if (!sessionUser || sessionUser.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  req.user = sessionUser;
  next();
};

export const requireStudent = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const sessionUser = (req.session as any)?.user;
  if (!sessionUser || sessionUser.role !== 'STUDENT') {
    return res.status(403).json({ message: 'Student access required.' });
  }

  req.user = sessionUser;
  next();
};
