import { isDbConnected } from '../config/db';
import { binanceDataService } from './BinanceDataService';
import { marketDataRepository } from '../repositories/MarketDataRepository';
import { authRepository } from '../repositories/AuthRepository';
import { AccountStatus, UserRole } from '../types/auth.types';
import { PredictionModel } from '../models/Prediction.model';
import { getWebSocketStats } from '../websocket/wsServer';

export class AdminService {
  public static async listUsers(filter: { search?: string; role?: UserRole; accountStatus?: AccountStatus }) {
    return authRepository.listUsers(filter);
  }

  public static async getUser(id: string) {
    return authRepository.findUserById(id);
  }

  public static async changeRole(actorId: string, targetId: string, role: UserRole) {
    const target = await authRepository.findUserById(targetId);
    if (!target) return null;

    if (actorId === targetId && target.role === 'admin' && role !== 'admin') {
      const activeAdmins = await authRepository.countActiveAdmins();
      if (activeAdmins <= 1) {
        throw new Error('Cannot demote the final active administrator.');
      }
    }

    const updated = await authRepository.updateUser(targetId, { role });
    const actor = await authRepository.findUserById(actorId);
    await authRepository.addAuditLog({
      action: 'admin.user_role_changed',
      actorUserId: actorId,
      actorEmail: actor?.email,
      targetUserId: targetId,
      metadata: { from: target.role, to: role },
    });
    return updated;
  }

  public static async changeStatus(actorId: string, targetId: string, accountStatus: AccountStatus) {
    const target = await authRepository.findUserById(targetId);
    if (!target) return null;

    if (target.role === 'admin' && target.accountStatus === 'active' && accountStatus !== 'active') {
      const activeAdmins = await authRepository.countActiveAdmins();
      if (activeAdmins <= 1) {
        throw new Error('Cannot disable or suspend the final active administrator.');
      }
    }

    const updated = await authRepository.updateUser(targetId, { accountStatus });
    if (accountStatus !== 'active') {
      await authRepository.revokeAllUserSessions(targetId);
    }
    const actor = await authRepository.findUserById(actorId);
    await authRepository.addAuditLog({
      action: 'admin.user_status_changed',
      actorUserId: actorId,
      actorEmail: actor?.email,
      targetUserId: targetId,
      metadata: { from: target.accountStatus, to: accountStatus },
    });
    return updated;
  }

  public static async getOverview() {
    const users = await authRepository.listUsers({ limit: 200 });
    return {
      users: {
        total: users.length,
        active: users.filter((user) => user.accountStatus === 'active').length,
        suspended: users.filter((user) => user.accountStatus === 'suspended').length,
        recentRegistrations: users.slice(0, 5),
      },
      backend: {
        status: 'healthy',
        uptime: process.uptime(),
        mongoDbConnected: isDbConnected(),
        binanceMarkets: binanceDataService.getAllMarketMetadata().length,
        websocketClients: getWebSocketStats().clients,
      },
    };
  }

  public static async getSystemHealth() {
    return {
      apiUptime: process.uptime(),
      websocketClients: getWebSocketStats().clients,
      binanceStatus: binanceDataService.getAllMarketMetadata().some((market) => market.lastPrice > 0)
        ? 'connected'
        : 'warming',
      databaseStatus: isDbConnected() ? 'connected' : 'in-memory',
      recentServiceErrors: [],
    };
  }

  public static async getPredictionMonitoring() {
    const stats = await marketDataRepository.getPerformanceStats();
    const totalPredictions = isDbConnected() ? await PredictionModel.countDocuments() : stats.totalEvaluated;
    return {
      totalPredictions,
      evaluatedPredictions: stats.totalEvaluated,
      accuracyByHorizon: {
        horizon1: stats.horizon1Accuracy,
        horizon2: stats.horizon2Accuracy,
      },
      accuracyByTimeframe: stats.byTimeframe,
      modelVersion: process.env.PREDICTION_MODEL_VERSION || 'indicator-v1',
    };
  }

  public static async listSessions() {
    return authRepository.listSessions();
  }

  public static async listAuditLogs() {
    return authRepository.listAuditLogs();
  }
}
