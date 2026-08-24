import {
  AccountStatus,
  AdminHealth,
  AdminOverview,
  AdminUser,
  ApiResponse,
  AuditLog,
  PredictionMonitoring,
  UserRole,
} from '../types/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function getApiBase(): string {
  if (!API_BASE) throw new Error('NEXT_PUBLIC_API_URL is required.');
  return API_BASE.replace(/\/$/, '');
}

async function adminFetch<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBase()}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.headers || {}),
      authorization: `Bearer ${accessToken}`,
    },
  });
  const json = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Admin request failed.');
  }
  return json.data as T;
}

export function fetchAdminOverview(accessToken: string) {
  return adminFetch<AdminOverview>('/admin/overview', accessToken);
}

export function fetchAdminUsers(accessToken: string, query = '') {
  return adminFetch<AdminUser[]>(`/admin/users${query}`, accessToken);
}

export function updateAdminUserRole(accessToken: string, csrfToken: string, userId: string, role: UserRole) {
  return adminFetch<AdminUser>(`/admin/users/${userId}/role`, accessToken, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken },
    body: JSON.stringify({ role }),
  });
}

export function updateAdminUserStatus(
  accessToken: string,
  csrfToken: string,
  userId: string,
  accountStatus: AccountStatus
) {
  return adminFetch<AdminUser>(`/admin/users/${userId}/status`, accessToken, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken },
    body: JSON.stringify({ accountStatus }),
  });
}

export function fetchAdminHealth(accessToken: string) {
  return adminFetch<AdminHealth>('/admin/system-health', accessToken);
}

export function fetchPredictionMonitoring(accessToken: string) {
  return adminFetch<PredictionMonitoring>('/admin/prediction-monitoring', accessToken);
}

export function fetchAuditLogs(accessToken: string) {
  return adminFetch<AuditLog[]>('/admin/audit-logs', accessToken);
}
