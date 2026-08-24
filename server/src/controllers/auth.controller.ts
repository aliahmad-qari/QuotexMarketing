import { CookieOptions, Request, Response } from 'express';
import { authEnv } from '../config/env';
import { AuthError, AuthService } from '../services/AuthService';
import { TokenService } from '../services/TokenService';
import { RequestWithUser } from '../types/auth.types';

const REFRESH_COOKIE_NAME = 'refreshToken';
const CSRF_COOKIE_NAME = 'csrfToken';

function requestMetadata(req: Request) {
  return {
    userAgent: req.get('user-agent'),
    ipAddress: req.ip,
  };
}

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: authEnv.isProduction || authEnv.cookieSameSite === 'none',
    sameSite: authEnv.cookieSameSite,
    domain: authEnv.cookieDomain,
    path: '/api/auth',
    maxAge: authEnv.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  };
}

function csrfCookieOptions(): CookieOptions {
  return {
    httpOnly: false,
    secure: authEnv.isProduction || authEnv.cookieSameSite === 'none',
    sameSite: authEnv.cookieSameSite,
    domain: authEnv.cookieDomain,
    path: '/api',
    maxAge: authEnv.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  };
}

function setAuthCookies(res: Response, refreshToken: string, csrfToken: string) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  res.cookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions());
}

function clearAuthCookies(res: Response) {
  const { maxAge: _refreshMaxAge, ...refreshOptions } = refreshCookieOptions();
  const { maxAge: _csrfMaxAge, ...csrfOptions } = csrfCookieOptions();
  res.clearCookie(REFRESH_COOKIE_NAME, refreshOptions);
  res.clearCookie(CSRF_COOKIE_NAME, csrfOptions);
}

function sendAuthResponse(res: Response, authResult: Awaited<ReturnType<typeof AuthService.login>>) {
  setAuthCookies(res, authResult.refreshToken, authResult.csrfToken);
  res.json({
    success: true,
    data: {
      user: authResult.user,
      accessToken: authResult.accessToken,
      csrfToken: authResult.csrfToken,
    },
    error: null,
  });
}

function handleAuthError(res: Response, error: unknown) {
  if (error instanceof AuthError) {
    res.status(error.status).json({ success: false, data: null, error: error.message, meta: { code: error.code } });
    return;
  }
  throw error;
}

export class AuthController {
  public static csrf(_req: Request, res: Response) {
    const csrfToken = TokenService.createCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions());
    res.json({ success: true, data: { csrfToken }, error: null });
  }

  public static async register(req: Request, res: Response) {
    try {
      const authResult = await AuthService.register({
        email: req.body.email,
        password: req.body.password,
        displayName: req.body.displayName,
        metadata: requestMetadata(req),
      });
      sendAuthResponse(res, authResult);
    } catch (error) {
      handleAuthError(res, error);
    }
  }

  public static async login(req: Request, res: Response) {
    try {
      const authResult = await AuthService.login({
        email: req.body.email,
        password: req.body.password,
        metadata: requestMetadata(req),
      });
      sendAuthResponse(res, authResult);
    } catch (error) {
      handleAuthError(res, error);
    }
  }

  public static async refresh(req: Request, res: Response) {
    try {
      const authResult = await AuthService.refresh(req.cookies?.[REFRESH_COOKIE_NAME], requestMetadata(req));
      sendAuthResponse(res, authResult);
    } catch (error) {
      clearAuthCookies(res);
      handleAuthError(res, error);
    }
  }

  public static async logout(req: Request, res: Response) {
    await AuthService.logout(req.cookies?.[REFRESH_COOKIE_NAME], requestMetadata(req));
    clearAuthCookies(res);
    res.json({ success: true, data: { loggedOut: true }, error: null });
  }

  public static async logoutAll(req: RequestWithUser, res: Response) {
    await AuthService.logoutAll(req.user!.id, requestMetadata(req));
    clearAuthCookies(res);
    res.json({ success: true, data: { loggedOut: true }, error: null });
  }

  public static async me(req: RequestWithUser, res: Response) {
    try {
      const user = await AuthService.me(req.user!.id);
      res.json({ success: true, data: { user, csrfToken: req.cookies?.[CSRF_COOKIE_NAME] }, error: null });
    } catch (error) {
      handleAuthError(res, error);
    }
  }

  public static async forgotPassword(req: Request, res: Response) {
    const result = await AuthService.forgotPassword(req.body.email, requestMetadata(req));
    res.json({
      success: true,
      data: {
        message: 'If an account exists for that email, password reset instructions will be sent.',
        resetToken: result.resetToken,
      },
      error: null,
    });
  }

  public static async resetPassword(req: Request, res: Response) {
    try {
      await AuthService.resetPassword(req.body.token, req.body.password, requestMetadata(req));
      res.json({ success: true, data: { passwordReset: true }, error: null });
    } catch (error) {
      handleAuthError(res, error);
    }
  }

  public static async changePassword(req: RequestWithUser, res: Response) {
    try {
      await AuthService.changePassword(
        req.user!.id,
        req.body.currentPassword,
        req.body.nextPassword,
        requestMetadata(req)
      );
      clearAuthCookies(res);
      res.json({ success: true, data: { passwordChanged: true }, error: null });
    } catch (error) {
      handleAuthError(res, error);
    }
  }
}
