import { Response } from 'express';
import { AdminService } from '../services/AdminService';
import { RequestWithUser } from '../types/auth.types';

function serializeUser(user: any) {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export class AdminController {
  public static async overview(_req: RequestWithUser, res: Response) {
    res.json({ success: true, data: await AdminService.getOverview(), error: null });
  }

  public static async listUsers(req: RequestWithUser, res: Response) {
    const users = await AdminService.listUsers({
      search: req.query.search as string | undefined,
      role: req.query.role as any,
      accountStatus: req.query.accountStatus as any,
    });
    res.json({ success: true, data: users.map(serializeUser), error: null });
  }

  public static async getUser(req: RequestWithUser, res: Response) {
    const user = await AdminService.getUser(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, data: null, error: 'User not found.' });
      return;
    }
    res.json({ success: true, data: serializeUser(user), error: null });
  }

  public static async updateRole(req: RequestWithUser, res: Response) {
    try {
      const user = await AdminService.changeRole(req.user!.id, req.params.id, req.body.role);
      if (!user) {
        res.status(404).json({ success: false, data: null, error: 'User not found.' });
        return;
      }
      res.json({ success: true, data: serializeUser(user), error: null });
    } catch (error) {
      res.status(400).json({ success: false, data: null, error: (error as Error).message });
    }
  }

  public static async updateStatus(req: RequestWithUser, res: Response) {
    try {
      const user = await AdminService.changeStatus(req.user!.id, req.params.id, req.body.accountStatus);
      if (!user) {
        res.status(404).json({ success: false, data: null, error: 'User not found.' });
        return;
      }
      res.json({ success: true, data: serializeUser(user), error: null });
    } catch (error) {
      res.status(400).json({ success: false, data: null, error: (error as Error).message });
    }
  }

  public static async sessions(_req: RequestWithUser, res: Response) {
    res.json({ success: true, data: await AdminService.listSessions(), error: null });
  }

  public static async auditLogs(_req: RequestWithUser, res: Response) {
    res.json({ success: true, data: await AdminService.listAuditLogs(), error: null });
  }

  public static async systemHealth(_req: RequestWithUser, res: Response) {
    res.json({ success: true, data: await AdminService.getSystemHealth(), error: null });
  }

  public static async predictionMonitoring(_req: RequestWithUser, res: Response) {
    res.json({ success: true, data: await AdminService.getPredictionMonitoring(), error: null });
  }
}
