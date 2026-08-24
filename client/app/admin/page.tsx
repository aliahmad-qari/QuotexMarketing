'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../providers/AuthProvider';
import {
  fetchAdminHealth,
  fetchAdminOverview,
  fetchAdminUsers,
  fetchAuditLogs,
  fetchPredictionMonitoring,
  updateAdminUserRole,
  updateAdminUserStatus,
} from '../../services/adminClient';
import { AccountStatus, AdminHealth, AdminOverview, AdminUser, AuditLog, PredictionMonitoring, UserRole } from '../../types/auth';

function AdminContent() {
  const { accessToken, csrfToken } = useAuth();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [health, setHealth] = useState<AdminHealth | null>(null);
  const [prediction, setPrediction] = useState<PredictionMonitoring | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const userQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    if (statusFilter) params.set('accountStatus', statusFilter);
    const query = params.toString();
    return query ? `?${query}` : '';
  }, [roleFilter, search, statusFilter]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setError('');
    try {
      const [overviewData, healthData, predictionData, usersData, auditData] = await Promise.all([
        fetchAdminOverview(accessToken),
        fetchAdminHealth(accessToken),
        fetchPredictionMonitoring(accessToken),
        fetchAdminUsers(accessToken, userQuery),
        fetchAuditLogs(accessToken),
      ]);
      setOverview(overviewData);
      setHealth(healthData);
      setPrediction(predictionData);
      setUsers(usersData);
      setAuditLogs(auditData);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [accessToken, userQuery]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeRole(userId: string, role: UserRole) {
    if (!accessToken || !csrfToken) return;
    await updateAdminUserRole(accessToken, csrfToken, userId, role);
    await load();
  }

  async function changeStatus(userId: string, accountStatus: AccountStatus) {
    if (!accessToken || !csrfToken) return;
    await updateAdminUserStatus(accessToken, csrfToken, userId, accountStatus);
    await load();
  }

  return (
    <div className="py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Admin Console</h1>
        <p className="text-sm text-slate-400 mt-2">Operational controls for users, security, and system visibility.</p>
      </div>
      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-sm text-rose-300">{error}</p>}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Total users', overview?.users?.total ?? 0],
          ['Active users', overview?.users?.active ?? 0],
          ['Suspended users', overview?.users?.suspended ?? 0],
          ['WebSocket clients', overview?.backend?.websocketClients ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#0E131F] border border-slate-800 rounded-xl p-4">
            <p className="text-[11px] font-mono uppercase text-slate-500">{label}</p>
            <p className="text-2xl font-black text-cyan-300 mt-2">{value}</p>
          </div>
        ))}
      </section>

      <section className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <h2 className="font-mono text-sm font-bold uppercase text-slate-200">User Management</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <input className="rounded bg-slate-950 border border-slate-800 px-2 py-1 text-slate-200" placeholder="Search users" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="rounded bg-slate-950 border border-slate-800 px-2 py-1 text-slate-200" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All roles</option><option value="user">user</option><option value="researcher">researcher</option><option value="admin">admin</option>
            </select>
            <select className="rounded bg-slate-950 border border-slate-800 px-2 py-1 text-slate-200" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option><option value="active">active</option><option value="suspended">suspended</option><option value="disabled">disabled</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-slate-500"><tr><th className="py-2">User</th><th>Role</th><th>Status</th><th>Created</th></tr></thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 text-slate-200"><div className="font-bold">{item.displayName}</div><div className="text-slate-500">{item.email}</div></td>
                  <td>
                    <select className="rounded bg-slate-950 border border-slate-800 px-2 py-1 text-slate-200" value={item.role} onChange={(e) => changeRole(item.id, e.target.value as UserRole)}>
                      <option value="user">user</option><option value="researcher">researcher</option><option value="admin">admin</option>
                    </select>
                  </td>
                  <td>
                    <select className="rounded bg-slate-950 border border-slate-800 px-2 py-1 text-slate-200" value={item.accountStatus} onChange={(e) => changeStatus(item.id, e.target.value as AccountStatus)}>
                      <option value="active">active</option><option value="suspended">suspended</option><option value="disabled">disabled</option>
                    </select>
                  </td>
                  <td className="text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-5">
        <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-2">
          <h2 className="font-mono text-sm font-bold uppercase text-slate-200">System Health</h2>
          <p className="text-xs text-slate-400">API uptime: {Math.round(health?.apiUptime || 0)}s</p>
          <p className="text-xs text-slate-400">Database: {health?.databaseStatus}</p>
          <p className="text-xs text-slate-400">Binance: {health?.binanceStatus}</p>
        </div>
        <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-2">
          <h2 className="font-mono text-sm font-bold uppercase text-slate-200">Prediction Monitoring</h2>
          <p className="text-xs text-slate-400">Total: {prediction?.totalPredictions ?? 0}</p>
          <p className="text-xs text-slate-400">Evaluated: {prediction?.evaluatedPredictions ?? 0}</p>
          <p className="text-xs text-slate-400">Model: {prediction?.modelVersion}</p>
        </div>
        <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-2">
          <h2 className="font-mono text-sm font-bold uppercase text-slate-200">Recent Audit Logs</h2>
          {auditLogs.slice(0, 6).map((log) => <p key={log.id} className="text-[11px] text-slate-400">{log.action}</p>)}
        </div>
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute roles={['admin']}>
      <AdminContent />
    </ProtectedRoute>
  );
}
