import jwt, { SignOptions } from 'jsonwebtoken';
import { authEnv } from '../config/env';
import { AccessTokenPayload, AuthenticatedUser } from '../types/auth.types';
import { randomToken, sha256 } from '../utils/crypto';
import { addDays } from '../utils/time';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string;
  refreshExpiresAt: Date;
}

export class TokenService {
  public static createAccessToken(user: AuthenticatedUser, sessionId: string): string {
    const payload: AccessTokenPayload = {
      sub: user.id,
      role: user.role,
      sessionId,
      passwordChangedAt: user.passwordChangedAt?.getTime(),
    };
    const options: SignOptions = {
      expiresIn: authEnv.accessTokenTtl as SignOptions['expiresIn'],
      issuer: 'candle-probability-lab-api',
      audience: 'candle-probability-lab-client',
    };
    return jwt.sign(payload, authEnv.accessTokenSecret, options);
  }

  public static verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, authEnv.accessTokenSecret, {
      issuer: 'candle-probability-lab-api',
      audience: 'candle-probability-lab-client',
    }) as AccessTokenPayload;
  }

  public static createRefreshToken(): Pick<TokenPair, 'refreshToken' | 'refreshTokenHash' | 'refreshExpiresAt'> {
    const refreshToken = randomToken(48);
    return {
      refreshToken,
      refreshTokenHash: sha256(refreshToken),
      refreshExpiresAt: addDays(new Date(), authEnv.refreshTokenTtlDays),
    };
  }

  public static hashRefreshToken(refreshToken: string): string {
    return sha256(refreshToken);
  }

  public static createCsrfToken(): string {
    return randomToken(32);
  }
}
