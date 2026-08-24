export interface AuthEnvironment {
  nodeEnv: string;
  isProduction: boolean;
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenTtl: string;
  refreshTokenTtlDays: number;
  cookieDomain?: string;
  frontendUrl?: string;
  emailProvider?: string;
  emailFrom?: string;
  emailApiKey?: string;
  adminBootstrapEmail?: string;
}

function requireInProduction(name: string, fallback = ''): string {
  const value = process.env[name] || fallback;
  if (process.env.NODE_ENV === 'production' && !value) {
    throw new Error(`${name} is required in production.`);
  }
  return value;
}

export function getAuthEnvironment(): AuthEnvironment {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const emailProvider = process.env.EMAIL_PROVIDER;
  const emailApiKey = process.env.EMAIL_API_KEY;

  if (isProduction && emailProvider && emailProvider !== 'console' && !emailApiKey) {
    throw new Error('EMAIL_API_KEY is required when EMAIL_PROVIDER is configured in production.');
  }

  if (isProduction && !emailProvider) {
    throw new Error('EMAIL_PROVIDER is required in production.');
  }

  return {
    nodeEnv,
    isProduction,
    accessTokenSecret: requireInProduction('ACCESS_TOKEN_SECRET', isProduction ? '' : 'dev-access-token-secret-change-me'),
    refreshTokenSecret: requireInProduction('REFRESH_TOKEN_SECRET', isProduction ? '' : 'dev-refresh-token-secret-change-me'),
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
    refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30),
    cookieDomain: process.env.COOKIE_DOMAIN || undefined,
    frontendUrl: requireInProduction('FRONTEND_URL') || undefined,
    emailProvider,
    emailFrom: process.env.EMAIL_FROM,
    emailApiKey,
    adminBootstrapEmail: process.env.ADMIN_BOOTSTRAP_EMAIL,
  };
}

export const authEnv = getAuthEnvironment();
