import { NextFunction, Response } from 'express';
import { authRepository } from '../repositories/AuthRepository';
import { RequestWithUser } from '../types/auth.types';

export function adminAuditLogger(action: string) {
  return async (req: RequestWithUser, _res: Response, next: NextFunction) => {
    if (req.user) {
      await authRepository.addAuditLog({
        action,
        actorUserId: req.user.id,
        actorEmail: req.user.email,
        targetUserId: req.params.id,
        metadata: {
          method: req.method,
          path: req.path,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    }
    next();
  };
}
