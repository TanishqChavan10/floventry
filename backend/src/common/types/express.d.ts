import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      companyId?: string;
      role?: string;
    }
  }
}