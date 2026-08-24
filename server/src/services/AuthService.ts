import { authRepository } from '../repositories/AuthRepository';
import { AccountStatus, AuthenticatedUser, UserRole } from '../types/auth.types';
import { randomToken, sha256 } from '../utils/crypto';
import { PasswordService } from './PasswordService';
import { TokenService } from './TokenService';
import { emailService } from './EmailService';

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export class AuthError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code = 'AUTH_ERROR'
  ) {
    super(message);
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toAuthenticatedUser(user: any): AuthenticatedUser {
  return {
    id: user.id || user._id?.toString(),
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    accountStatus: user.accountStatus,
    emailVerified: Boolean(user.emailVerified),
    passwordChangedAt: user.passwordChangedAt,
  };
}

export interface RequestMetadata {
  userAgent?: string;
  ipAddress?: string;
}

export class AuthService {
  public static normalizeEmail = normalizeEmail;

  public static async register(input: {
    email: string;
    password: string;
    displayName: string;
    metadata?: RequestMetadata;
  }) {
    const normalizedEmail = normalizeEmail(input.email);
    const existing = await authRepository.findUserByEmail(normalizedEmail);
    if (existing) {
      throw new AuthError('Unable to create account with these credentials.', 409, 'DUPLICATE_EMAIL');
    }

    const passwordIssues = PasswordService.validatePassword(input.password);
    if (passwordIssues.length > 0) {
      throw new AuthError(passwordIssues.join(' '), 400, 'WEAK_PASSWORD');
    }

    const passwordHash = await PasswordService.hashPassword(input.password);
    const user = await authRepository.createUser({
      email: input.email.trim(),
      normalizedEmail,
      passwordHash,
      displayName: input.displayName.trim(),
      role: 'user',
    });

    await authRepository.addAuditLog({
      action: 'user.registered',
      targetUserId: user.id,
      metadata: { role: 'user' },
      ipAddress: input.metadata?.ipAddress,
      userAgent: input.metadata?.userAgent,
    });

    return this.issueSession(user, input.metadata);
  }

  public static async login(input: { email: string; password: string; metadata?: RequestMetadata }) {
    const normalizedEmail = normalizeEmail(input.email);
    const user = await authRepository.findUserByEmail(normalizedEmail, true);
    const passwordMatches = await PasswordService.verifyPassword(user?.passwordHash, input.password);

    if (!user || !passwordMatches) {
      if (user) {
        await this.recordFailedLogin(user, input.metadata);
      }
      throw new AuthError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      throw new AuthError('Account is temporarily locked. Try again later.', 423, 'ACCOUNT_LOCKED');
    }

    if (user.accountStatus !== 'active') {
      await authRepository.addAuditLog({
        action: 'auth.blocked_status_login',
        targetUserId: user.id,
        metadata: { accountStatus: user.accountStatus },
        ipAddress: input.metadata?.ipAddress,
        userAgent: input.metadata?.userAgent,
      });
      throw new AuthError('Account is not available.', 403, 'ACCOUNT_UNAVAILABLE');
    }

    await authRepository.updateUser(user.id!, {
      failedLoginAttempts: 0,
      lockUntil: undefined,
      lastLoginAt: new Date(),
    });

    await authRepository.addAuditLog({
      action: 'auth.login',
      actorUserId: user.id,
      actorEmail: user.email,
      targetUserId: user.id,
      ipAddress: input.metadata?.ipAddress,
      userAgent: input.metadata?.userAgent,
    });

    return this.issueSession(user, input.metadata);
  }

  private static async recordFailedLogin(user: any, metadata?: RequestMetadata) {
    const failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    const lockUntil =
      failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : undefined;

    await authRepository.updateUser(user.id!, {
      failedLoginAttempts,
      lockUntil,
    });

    await authRepository.addAuditLog({
      action: lockUntil ? 'auth.account_locked' : 'auth.failed_login',
      targetUserId: user.id,
      metadata: { failedLoginAttempts },
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  private static async issueSession(user: any, metadata?: RequestMetadata) {
    const authUser = toAuthenticatedUser(user);
    const refresh = TokenService.createRefreshToken();
    const session = await authRepository.createSession({
      userId: authUser.id,
      tokenHash: refresh.refreshTokenHash,
      expiresAt: refresh.refreshExpiresAt,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    });
    const accessToken = TokenService.createAccessToken(authUser, session.id);
    return {
      user: authUser,
      accessToken,
      refreshToken: refresh.refreshToken,
      csrfToken: TokenService.createCsrfToken(),
      session,
    };
  }

  public static async refresh(refreshToken: string | undefined, metadata?: RequestMetadata) {
    if (!refreshToken) {
      throw new AuthError('Refresh session is required.', 401, 'REFRESH_REQUIRED');
    }

    const session = await authRepository.findSessionByTokenHash(TokenService.hashRefreshToken(refreshToken));
    if (!session) {
      throw new AuthError('Invalid refresh session.', 401, 'INVALID_REFRESH');
    }

    if (session.revokedAt) {
      await authRepository.revokeSession(session.id, { reusedAt: new Date() });
      await authRepository.revokeAllUserSessions(session.userId);
      await authRepository.addAuditLog({
        action: 'auth.refresh_reuse_detected',
        targetUserId: session.userId,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      });
      throw new AuthError('Invalid refresh session.', 401, 'REFRESH_REUSE');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await authRepository.revokeSession(session.id);
      throw new AuthError('Refresh session expired.', 401, 'REFRESH_EXPIRED');
    }

    const user = await authRepository.findUserById(session.userId);
    if (!user || user.accountStatus !== 'active') {
      await authRepository.revokeSession(session.id);
      throw new AuthError('Account is not available.', 403, 'ACCOUNT_UNAVAILABLE');
    }

    const refresh = TokenService.createRefreshToken();
    const nextSession = await authRepository.createSession({
      userId: session.userId,
      tokenHash: refresh.refreshTokenHash,
      expiresAt: refresh.refreshExpiresAt,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    });
    await authRepository.revokeSession(session.id, { replacedBy: nextSession.id });

    const authUser = toAuthenticatedUser(user);
    return {
      user: authUser,
      accessToken: TokenService.createAccessToken(authUser, nextSession.id),
      refreshToken: refresh.refreshToken,
      csrfToken: TokenService.createCsrfToken(),
      session: nextSession,
    };
  }

  public static async me(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user || user.accountStatus !== 'active') {
      throw new AuthError('Authentication required.', 401, 'AUTH_REQUIRED');
    }
    return toAuthenticatedUser(user);
  }

  public static async logout(refreshToken: string | undefined, metadata?: RequestMetadata) {
    if (!refreshToken) return;
    const session = await authRepository.findSessionByTokenHash(TokenService.hashRefreshToken(refreshToken));
    if (session) {
      await authRepository.revokeSession(session.id);
      await authRepository.addAuditLog({
        action: 'auth.logout',
        targetUserId: session.userId,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      });
    }
  }

  public static async logoutAll(userId: string, metadata?: RequestMetadata) {
    await authRepository.revokeAllUserSessions(userId);
    const user = await authRepository.findUserById(userId);
    await authRepository.addAuditLog({
      action: 'auth.logout_all',
      actorUserId: userId,
      actorEmail: user?.email,
      targetUserId: userId,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  public static async forgotPassword(email: string, metadata?: RequestMetadata) {
    const user = await authRepository.findUserByEmail(normalizeEmail(email));
    if (!user || user.accountStatus !== 'active') {
      return { delivered: false };
    }

    const token = randomToken(48);
    await authRepository.createPasswordResetToken({
      userId: user.id!,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    });
    await emailService.sendPasswordReset(user.email, token);
    await authRepository.addAuditLog({
      action: 'auth.password_reset_requested',
      targetUserId: user.id,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });

    return { delivered: true, resetToken: process.env.NODE_ENV === 'test' ? token : undefined };
  }

  public static async resetPassword(token: string, password: string, metadata?: RequestMetadata) {
    const record = await authRepository.findPasswordResetToken(sha256(token));
    if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
      throw new AuthError('Password reset link is invalid or expired.', 400, 'INVALID_RESET_TOKEN');
    }

    const passwordIssues = PasswordService.validatePassword(password);
    if (passwordIssues.length > 0) {
      throw new AuthError(passwordIssues.join(' '), 400, 'WEAK_PASSWORD');
    }

    const passwordHash = await PasswordService.hashPassword(password);
    await authRepository.updateUser(record.userId, {
      passwordHash,
      passwordChangedAt: new Date(),
      failedLoginAttempts: 0,
      lockUntil: undefined,
    });
    await authRepository.markPasswordResetTokenUsed(record.id);
    await authRepository.revokeAllUserSessions(record.userId);
    await authRepository.addAuditLog({
      action: 'auth.password_reset_completed',
      targetUserId: record.userId,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  public static async changePassword(userId: string, currentPassword: string, nextPassword: string, metadata?: RequestMetadata) {
    const user = await authRepository.findUserById(userId, true);
    if (!user || !(await PasswordService.verifyPassword(user.passwordHash, currentPassword))) {
      throw new AuthError('Current password is invalid.', 400, 'INVALID_CURRENT_PASSWORD');
    }

    const passwordIssues = PasswordService.validatePassword(nextPassword);
    if (passwordIssues.length > 0) {
      throw new AuthError(passwordIssues.join(' '), 400, 'WEAK_PASSWORD');
    }

    await authRepository.updateUser(userId, {
      passwordHash: await PasswordService.hashPassword(nextPassword),
      passwordChangedAt: new Date(),
    });
    await authRepository.revokeAllUserSessions(userId);
    await authRepository.addAuditLog({
      action: 'auth.password_changed',
      actorUserId: userId,
      actorEmail: user.email,
      targetUserId: userId,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  public static async promoteBootstrapAdmin(email: string, password: string) {
    const normalizedEmail = normalizeEmail(email);
    const existing = await authRepository.findUserByEmail(normalizedEmail, true);
    const passwordHash = await PasswordService.hashPassword(password);

    if (existing) {
      const updated = await authRepository.updateUser(existing.id!, {
        role: 'admin',
        accountStatus: 'active',
        passwordHash,
        passwordChangedAt: new Date(),
      });
      await authRepository.addAuditLog({
        action: 'admin.bootstrap_promoted',
        targetUserId: existing.id,
        metadata: { email: normalizedEmail },
      });
      return toAuthenticatedUser(updated);
    }

    const created = await authRepository.createUser({
      email: email.trim(),
      normalizedEmail,
      passwordHash,
      displayName: email.split('@')[0],
      role: 'admin',
    });
    await authRepository.addAuditLog({
      action: 'admin.bootstrap_created',
      targetUserId: created.id,
      metadata: { email: normalizedEmail },
    });
    return toAuthenticatedUser(created);
  }
}
