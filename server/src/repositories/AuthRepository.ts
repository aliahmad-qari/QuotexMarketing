import { Types } from 'mongoose';
import { isDbConnected } from '../config/db';
import { AuditLogModel } from '../models/AuditLog.model';
import { PasswordResetTokenModel } from '../models/PasswordResetToken.model';
import { SessionModel } from '../models/Session.model';
import { IUserDocument, UserModel } from '../models/User.model';
import { AccountStatus, UserRole } from '../types/auth.types';

export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  reusedAt?: Date;
  replacedBy?: string;
  createdAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface ResetTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface AuditLogRecord {
  id: string;
  actorUserId?: string;
  actorEmail?: string;
  action: string;
  targetUserId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

type UserLike = Partial<IUserDocument> & {
  _id?: unknown;
  id?: string;
  email: string;
  normalizedEmail: string;
  passwordHash?: string;
  displayName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  failedLoginAttempts: number;
  lockUntil?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

function toId(value: unknown): string {
  if (!value) return new Types.ObjectId().toString();
  return value.toString();
}

function toUserObject(doc: any): UserLike | null {
  if (!doc) return null;
  const raw = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    ...raw,
    id: toId(raw._id || raw.id),
  };
}

class AuthRepository {
  private users = new Map<string, UserLike>();
  private sessions = new Map<string, SessionRecord>();
  private resetTokens = new Map<string, ResetTokenRecord>();
  private auditLogs: AuditLogRecord[] = [];

  public resetMemoryStore() {
    this.users.clear();
    this.sessions.clear();
    this.resetTokens.clear();
    this.auditLogs = [];
  }

  public async createUser(input: {
    email: string;
    normalizedEmail: string;
    passwordHash: string;
    displayName: string;
    role?: UserRole;
  }): Promise<UserLike> {
    if (isDbConnected()) {
      const created = await UserModel.create({
        ...input,
        role: input.role || 'user',
        accountStatus: 'active',
        emailVerified: false,
        failedLoginAttempts: 0,
        passwordChangedAt: new Date(),
      });
      return toUserObject(created)!;
    }

    const now = new Date();
    const user: UserLike = {
      id: new Types.ObjectId().toString(),
      email: input.email,
      normalizedEmail: input.normalizedEmail,
      passwordHash: input.passwordHash,
      displayName: input.displayName,
      role: input.role || 'user',
      accountStatus: 'active',
      emailVerified: false,
      failedLoginAttempts: 0,
      passwordChangedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id!, user);
    return user;
  }

  public async findUserByEmail(normalizedEmail: string, includePassword = false): Promise<UserLike | null> {
    if (isDbConnected()) {
      const query = UserModel.findOne({ normalizedEmail });
      if (includePassword) query.select('+passwordHash');
      return toUserObject(await query.exec());
    }

    const user = Array.from(this.users.values()).find((item) => item.normalizedEmail === normalizedEmail);
    if (!user) return null;
    return includePassword ? user : { ...user, passwordHash: undefined };
  }

  public async findUserById(id: string, includePassword = false): Promise<UserLike | null> {
    if (isDbConnected()) {
      const query = UserModel.findById(id);
      if (includePassword) query.select('+passwordHash');
      return toUserObject(await query.exec());
    }

    const user = this.users.get(id);
    if (!user) return null;
    return includePassword ? user : { ...user, passwordHash: undefined };
  }

  public async updateUser(id: string, update: Partial<UserLike>): Promise<UserLike | null> {
    if (isDbConnected()) {
      return toUserObject(await UserModel.findByIdAndUpdate(id, update, { new: true }).exec());
    }

    const existing = this.users.get(id);
    if (!existing) return null;
    const next = { ...existing, ...update, updatedAt: new Date() };
    this.users.set(id, next);
    return next;
  }

  public async listUsers(filter: { search?: string; role?: UserRole; accountStatus?: AccountStatus; limit?: number }) {
    const limit = Math.min(filter.limit || 100, 200);

    if (isDbConnected()) {
      const query: Record<string, unknown> = {};
      if (filter.role) query.role = filter.role;
      if (filter.accountStatus) query.accountStatus = filter.accountStatus;
      if (filter.search) {
        query.$or = [
          { normalizedEmail: { $regex: filter.search.toLowerCase(), $options: 'i' } },
          { displayName: { $regex: filter.search, $options: 'i' } },
        ];
      }
      const docs = await UserModel.find(query).sort({ createdAt: -1 }).limit(limit).lean();
      return docs.map(toUserObject).filter(Boolean) as UserLike[];
    }

    let list = Array.from(this.users.values());
    if (filter.role) list = list.filter((user) => user.role === filter.role);
    if (filter.accountStatus) list = list.filter((user) => user.accountStatus === filter.accountStatus);
    if (filter.search) {
      const search = filter.search.toLowerCase();
      list = list.filter(
        (user) => user.normalizedEmail.includes(search) || user.displayName.toLowerCase().includes(search)
      );
    }
    return list.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)).slice(0, limit);
  }

  public async countActiveAdmins(): Promise<number> {
    if (isDbConnected()) {
      return UserModel.countDocuments({ role: 'admin', accountStatus: 'active' }).exec();
    }
    return Array.from(this.users.values()).filter((user) => user.role === 'admin' && user.accountStatus === 'active')
      .length;
  }

  public async createSession(input: Omit<SessionRecord, 'id' | 'createdAt'>): Promise<SessionRecord> {
    if (isDbConnected()) {
      const doc = await SessionModel.create({
        userId: new Types.ObjectId(input.userId),
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
      });
      return {
        id: doc._id.toString(),
        userId: doc.userId.toString(),
        tokenHash: doc.tokenHash,
        expiresAt: doc.expiresAt,
        createdAt: doc.createdAt,
        userAgent: doc.userAgent,
        ipAddress: doc.ipAddress,
      };
    }

    const session: SessionRecord = {
      ...input,
      id: new Types.ObjectId().toString(),
      createdAt: new Date(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  public async findSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    if (isDbConnected()) {
      const doc = await SessionModel.findOne({ tokenHash }).lean();
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        userId: doc.userId.toString(),
        tokenHash: doc.tokenHash,
        expiresAt: doc.expiresAt,
        revokedAt: doc.revokedAt,
        reusedAt: doc.reusedAt,
        replacedBy: doc.replacedBy?.toString(),
        createdAt: doc.createdAt,
        userAgent: doc.userAgent,
        ipAddress: doc.ipAddress,
      };
    }

    return Array.from(this.sessions.values()).find((session) => session.tokenHash === tokenHash) || null;
  }

  public async revokeSession(sessionId: string, update?: Partial<SessionRecord>): Promise<void> {
    if (isDbConnected()) {
      await SessionModel.findByIdAndUpdate(sessionId, { revokedAt: new Date(), ...update }).exec();
      return;
    }

    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.set(sessionId, { ...session, revokedAt: new Date(), ...update });
    }
  }

  public async revokeAllUserSessions(userId: string): Promise<void> {
    if (isDbConnected()) {
      await SessionModel.updateMany({ userId, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
      return;
    }

    for (const session of this.sessions.values()) {
      if (session.userId === userId && !session.revokedAt) {
        this.sessions.set(session.id, { ...session, revokedAt: new Date() });
      }
    }
  }

  public async createPasswordResetToken(input: Omit<ResetTokenRecord, 'id' | 'createdAt'>): Promise<ResetTokenRecord> {
    if (isDbConnected()) {
      const doc = await PasswordResetTokenModel.create({
        userId: new Types.ObjectId(input.userId),
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
      });
      return {
        id: doc._id.toString(),
        userId: doc.userId.toString(),
        tokenHash: doc.tokenHash,
        expiresAt: doc.expiresAt,
        usedAt: doc.usedAt,
        createdAt: doc.createdAt,
        userAgent: doc.userAgent,
        ipAddress: doc.ipAddress,
      };
    }

    const record: ResetTokenRecord = { ...input, id: new Types.ObjectId().toString(), createdAt: new Date() };
    this.resetTokens.set(record.id, record);
    return record;
  }

  public async findPasswordResetToken(tokenHash: string): Promise<ResetTokenRecord | null> {
    if (isDbConnected()) {
      const doc = await PasswordResetTokenModel.findOne({ tokenHash }).lean();
      if (!doc) return null;
      return {
        id: doc._id.toString(),
        userId: doc.userId.toString(),
        tokenHash: doc.tokenHash,
        expiresAt: doc.expiresAt,
        usedAt: doc.usedAt,
        createdAt: doc.createdAt,
        userAgent: doc.userAgent,
        ipAddress: doc.ipAddress,
      };
    }

    return Array.from(this.resetTokens.values()).find((record) => record.tokenHash === tokenHash) || null;
  }

  public async markPasswordResetTokenUsed(id: string): Promise<void> {
    if (isDbConnected()) {
      await PasswordResetTokenModel.findByIdAndUpdate(id, { usedAt: new Date() }).exec();
      return;
    }

    const token = this.resetTokens.get(id);
    if (token) this.resetTokens.set(id, { ...token, usedAt: new Date() });
  }

  public async addAuditLog(input: Omit<AuditLogRecord, 'id' | 'createdAt'>): Promise<AuditLogRecord> {
    if (isDbConnected()) {
      const doc = await AuditLogModel.create({
        ...input,
        actorUserId: input.actorUserId ? new Types.ObjectId(input.actorUserId) : undefined,
        targetUserId: input.targetUserId ? new Types.ObjectId(input.targetUserId) : undefined,
      });
      return {
        id: doc._id.toString(),
        actorUserId: doc.actorUserId?.toString(),
        actorEmail: doc.actorEmail,
        action: doc.action,
        targetUserId: doc.targetUserId?.toString(),
        metadata: doc.metadata,
        ipAddress: doc.ipAddress,
        userAgent: doc.userAgent,
        createdAt: doc.createdAt,
      };
    }

    const record: AuditLogRecord = { ...input, id: new Types.ObjectId().toString(), createdAt: new Date() };
    this.auditLogs.unshift(record);
    return record;
  }

  public async listAuditLogs(limit = 100): Promise<AuditLogRecord[]> {
    if (isDbConnected()) {
      const docs = await AuditLogModel.find().sort({ createdAt: -1 }).limit(Math.min(limit, 200)).lean();
      return docs.map((doc) => ({
        id: doc._id.toString(),
        actorUserId: doc.actorUserId?.toString(),
        actorEmail: doc.actorEmail,
        action: doc.action,
        targetUserId: doc.targetUserId?.toString(),
        metadata: doc.metadata,
        ipAddress: doc.ipAddress,
        userAgent: doc.userAgent,
        createdAt: doc.createdAt,
      }));
    }

    return this.auditLogs.slice(0, Math.min(limit, 200));
  }

  public async listSessions(limit = 100): Promise<SessionRecord[]> {
    if (isDbConnected()) {
      const docs = await SessionModel.find().sort({ createdAt: -1 }).limit(Math.min(limit, 200)).lean();
      return docs.map((doc) => ({
        id: doc._id.toString(),
        userId: doc.userId.toString(),
        tokenHash: doc.tokenHash,
        expiresAt: doc.expiresAt,
        revokedAt: doc.revokedAt,
        reusedAt: doc.reusedAt,
        replacedBy: doc.replacedBy?.toString(),
        createdAt: doc.createdAt,
        userAgent: doc.userAgent,
        ipAddress: doc.ipAddress,
      }));
    }

    return Array.from(this.sessions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, Math.min(limit, 200));
  }
}

export const authRepository = new AuthRepository();
