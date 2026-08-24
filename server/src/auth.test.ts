import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { authRepository } from './repositories/AuthRepository';
import { AuthService } from './services/AuthService';

const app = createApp();
const strongPassword = 'SecurePass123!';

function cookieValue(setCookie: string[], name: string) {
  return setCookie.find((cookie) => cookie.startsWith(`${name}=`))?.split(';')[0];
}

async function registerUser(email = 'user@example.com', password = strongPassword) {
  return request(app)
    .post('/api/auth/register')
    .send({ email, password, displayName: 'Test User' })
    .expect(200);
}

async function login(email = 'user@example.com', password = strongPassword) {
  return request(app).post('/api/auth/login').send({ email, password }).expect(200);
}

async function csrf() {
  const response = await request(app).get('/api/auth/csrf').expect(200);
  return {
    token: response.body.data.csrfToken as string,
    cookie: cookieValue(response.headers['set-cookie'], 'csrfToken')!,
  };
}

describe('authentication and authorization', () => {
  beforeEach(() => {
    authRepository.resetMemoryStore();
  });

  it('registers a user with the default user role', async () => {
    const response = await registerUser();
    expect(response.body.data.user.email).toBe('user@example.com');
    expect(response.body.data.user.role).toBe('user');
    expect(response.headers['set-cookie'].join(';')).toContain('HttpOnly');
  });

  it('rejects duplicate email registration', async () => {
    await registerUser();
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'USER@example.com', password: strongPassword, displayName: 'Duplicate' })
      .expect(409);
  });

  it('logs in with valid credentials', async () => {
    await registerUser();
    const response = await login();
    expect(response.body.data.accessToken).toBeTruthy();
  });

  it('rejects an invalid password', async () => {
    await registerUser();
    await request(app).post('/api/auth/login').send({ email: 'user@example.com', password: 'wrong' }).expect(401);
  });

  it('locks the account after repeated failed login attempts', async () => {
    await registerUser();
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/login').send({ email: 'user@example.com', password: 'wrong' }).expect(401);
    }
    await request(app).post('/api/auth/login').send({ email: 'user@example.com', password: strongPassword }).expect(423);
  });

  it('rotates refresh tokens', async () => {
    await registerUser();
    const loggedIn = await login();
    const refreshCookie = cookieValue(loggedIn.headers['set-cookie'], 'refreshToken')!;
    const csrfCookie = cookieValue(loggedIn.headers['set-cookie'], 'csrfToken')!;
    const csrfToken = loggedIn.body.data.csrfToken;

    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [refreshCookie, csrfCookie])
      .set('x-csrf-token', csrfToken)
      .expect(200);

    expect(cookieValue(refreshed.headers['set-cookie'], 'refreshToken')).not.toBe(refreshCookie);
  });

  it('rejects a revoked refresh token', async () => {
    await registerUser();
    const loggedIn = await login();
    const refreshCookie = cookieValue(loggedIn.headers['set-cookie'], 'refreshToken')!;
    const csrfCookie = cookieValue(loggedIn.headers['set-cookie'], 'csrfToken')!;
    const csrfToken = loggedIn.body.data.csrfToken;

    await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [refreshCookie, csrfCookie])
      .set('x-csrf-token', csrfToken)
      .expect(200);

    await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [refreshCookie, csrfCookie])
      .set('x-csrf-token', csrfToken)
      .expect(401);
  });

  it('logs out the active session', async () => {
    await registerUser();
    const loggedIn = await login();
    await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [
        cookieValue(loggedIn.headers['set-cookie'], 'refreshToken')!,
        cookieValue(loggedIn.headers['set-cookie'], 'csrfToken')!,
      ])
      .set('x-csrf-token', loggedIn.body.data.csrfToken)
      .expect(200);
  });

  it('resets a password using a single-use reset token', async () => {
    await registerUser();
    const response = await request(app).post('/api/auth/forgot-password').send({ email: 'user@example.com' }).expect(200);
    const token = response.body.data.resetToken;
    expect(token).toBeTruthy();
    await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'NewSecurePass123!' })
      .expect(200);
    await request(app).post('/api/auth/login').send({ email: 'user@example.com', password: 'NewSecurePass123!' }).expect(200);
  });

  it('prevents a regular user from accessing admin endpoints', async () => {
    await registerUser();
    const loggedIn = await login();
    await request(app)
      .get('/api/admin/users')
      .set('authorization', `Bearer ${loggedIn.body.data.accessToken}`)
      .expect(403);
  });

  it('allows an admin to access admin endpoints', async () => {
    await AuthService.promoteBootstrapAdmin('admin@example.com', strongPassword);
    const loggedIn = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: strongPassword }).expect(200);
    const response = await request(app)
      .get('/api/admin/users')
      .set('authorization', `Bearer ${loggedIn.body.data.accessToken}`)
      .expect(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('does not allow role selection during registration', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'role@example.com', password: strongPassword, displayName: 'Role User', role: 'admin' })
      .expect(200);
    expect(response.body.data.user.role).toBe('user');
  });

  it('blocks a suspended user from authenticated access', async () => {
    const registered = await registerUser();
    await authRepository.updateUser(registered.body.data.user.id, { accountStatus: 'suspended' });
    await request(app)
      .get('/api/auth/me')
      .set('authorization', `Bearer ${registered.body.data.accessToken}`)
      .expect(401);
  });

  it('protects the final active admin from self-demotion', async () => {
    await AuthService.promoteBootstrapAdmin('admin@example.com', strongPassword);
    const loggedIn = await login('admin@example.com', strongPassword);
    await request(app)
      .patch(`/api/admin/users/${loggedIn.body.data.user.id}/role`)
      .set('authorization', `Bearer ${loggedIn.body.data.accessToken}`)
      .set('Cookie', [cookieValue(loggedIn.headers['set-cookie'], 'csrfToken')!])
      .set('x-csrf-token', loggedIn.body.data.csrfToken)
      .send({ role: 'user' })
      .expect(400);
  });

  it('records administrator audit logs', async () => {
    await AuthService.promoteBootstrapAdmin('admin@example.com', strongPassword);
    const user = await registerUser('audited-user@example.com');
    const admin = await login('admin@example.com', strongPassword);

    await request(app)
      .patch(`/api/admin/users/${user.body.data.user.id}/role`)
      .set('authorization', `Bearer ${admin.body.data.accessToken}`)
      .set('Cookie', [cookieValue(admin.headers['set-cookie'], 'csrfToken')!])
      .set('x-csrf-token', admin.body.data.csrfToken)
      .send({ role: 'researcher' })
      .expect(200);

    const audit = await request(app)
      .get('/api/admin/audit-logs')
      .set('authorization', `Bearer ${admin.body.data.accessToken}`)
      .expect(200);

    expect(audit.body.data.some((log: any) => log.action === 'admin.user_role_changed')).toBe(true);
  });
});
