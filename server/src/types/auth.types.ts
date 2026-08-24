import { Request } from 'express';

export type UserRole = 'user' | 'researcher' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'disabled';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  passwordChangedAt?: Date;
}

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  sessionId: string;
  passwordChangedAt?: number;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
  sessionId?: string;
}
