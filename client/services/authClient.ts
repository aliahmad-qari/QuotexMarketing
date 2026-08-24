import { ApiResponse, AuthUser } from '../types/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

function getApiBase(): string {
  if (!API_BASE) {
    throw new Error('NEXT_PUBLIC_API_URL is required for authentication.');
  }
  return API_BASE.replace(/\/$/, '');
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const json = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Request failed.');
  }
  return json;
}

export async function fetchCsrfToken(): Promise<string> {
  const response = await fetch(`${getApiBase()}/auth/csrf`, {
    credentials: 'include',
  });
  const json = await parseResponse<{ csrfToken: string }>(response);
  return json.data!.csrfToken;
}

export async function loginRequest(email: string, password: string) {
  const response = await fetch(`${getApiBase()}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return parseResponse<{ user: AuthUser; accessToken: string; csrfToken: string }>(response);
}

export async function registerRequest(email: string, password: string, displayName: string) {
  const response = await fetch(`${getApiBase()}/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });
  return parseResponse<{ user: AuthUser; accessToken: string; csrfToken: string }>(response);
}

export async function refreshRequest(csrfToken: string) {
  const response = await fetch(`${getApiBase()}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'x-csrf-token': csrfToken },
  });
  return parseResponse<{ user: AuthUser; accessToken: string; csrfToken: string }>(response);
}

export async function meRequest(accessToken: string) {
  const response = await fetch(`${getApiBase()}/auth/me`, {
    credentials: 'include',
    headers: { authorization: `Bearer ${accessToken}` },
  });
  return parseResponse<{ user: AuthUser; csrfToken?: string }>(response);
}

export async function logoutRequest(csrfToken: string) {
  const response = await fetch(`${getApiBase()}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'x-csrf-token': csrfToken },
  });
  return parseResponse<{ loggedOut: boolean }>(response);
}

export async function forgotPasswordRequest(email: string) {
  const response = await fetch(`${getApiBase()}/auth/forgot-password`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return parseResponse<{ message: string }>(response);
}

export async function resetPasswordRequest(token: string, password: string) {
  const response = await fetch(`${getApiBase()}/auth/reset-password`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  return parseResponse<{ passwordReset: boolean }>(response);
}

export async function changePasswordRequest(
  accessToken: string,
  csrfToken: string,
  currentPassword: string,
  nextPassword: string
) {
  const response = await fetch(`${getApiBase()}/auth/change-password`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      'x-csrf-token': csrfToken,
    },
    body: JSON.stringify({ currentPassword, nextPassword }),
  });
  return parseResponse<{ passwordChanged: boolean }>(response);
}
