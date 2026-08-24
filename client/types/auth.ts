export type UserRole = 'user' | 'researcher' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'disabled';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
}

export interface AdminUser extends AuthUser {
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  failedLoginAttempts?: number;
  lockUntil?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
}

export interface AdminOverview {
  users: {
    total: number;
    active: number;
    suspended: number;
    recentRegistrations: AdminUser[];
  };
  backend: {
    status: string;
    uptime: number;
    mongoDbConnected: boolean;
    binanceMarkets: number;
    websocketClients: number;
  };
}

export interface AdminHealth {
  apiUptime: number;
  websocketClients: number;
  binanceStatus: string;
  databaseStatus: string;
  recentServiceErrors: string[];
}

export interface PredictionMonitoring {
  totalPredictions: number;
  evaluatedPredictions: number;
  accuracyByHorizon: {
    horizon1: number;
    horizon2: number;
  };
  accuracyByTimeframe: Record<string, { total: number; correct: number; accuracy: number }>;
  modelVersion: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actorEmail?: string;
  targetUserId?: string;
  createdAt: string;
}
