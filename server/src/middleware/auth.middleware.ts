import { NextFunction, Response } from 'express';
import { authRepository } from '../repositories/AuthRepository';
import { AccountStatus, RequestWithUser, UserRole } from '../types/auth.types';
import { timingSafeEqualString } from '../utils/crypto';
import { TokenService } from '../services/TokenService';

export async function authenticate(req: RequestWithUser, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ success: false, data: null, error: 'Authentication required.' });
    return;
  }

  try {
    const payload = TokenService.verifyAccessToken(token);
    const user = await authRepository.findUserById(payload.sub);

    if (!user || user.accountStatus !== 'active') {
      res.status(401).json({ success: false, data: null, error: 'Authentication required.' });
      return;
    }

    if (
      payload.passwordChangedAt &&
      user.passwordChangedAt &&
      user.passwordChangedAt.getTime() > payload.passwordChangedAt
    ) {
      res.status(401).json({ success: false, data: null, error: 'Session expired.' });
      return;
    }

    req.user = {
      id: user.id!,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      accountStatus: user.accountStatus as AccountStatus,
      emailVerified: Boolean(user.emailVerified),
      passwordChangedAt: user.passwordChangedAt,
    };
    req.sessionId = payload.sessionId;
    next();
  } catch {
    res.status(401).json({ success: false, data: null, error: 'Authentication required.' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, data: null, error: 'Insufficient permissions.' });
      return;
    }
    next();
  };
}

export const requireAdmin = requireRole('admin');

export function requireCsrf(req: RequestWithUser, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  const csrfCookie = req.cookies?.csrfToken;
  const csrfHeader = req.header('x-csrf-token');

  if (!csrfCookie || !csrfHeader || !timingSafeEqualString(csrfCookie, csrfHeader)) {
    res.status(403).json({ success: false, data: null, error: 'Invalid CSRF token.' });
    return;
  }

  next();
}
