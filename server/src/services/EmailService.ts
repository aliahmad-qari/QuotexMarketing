import { authEnv } from '../config/env';

export interface EmailService {
  sendEmailVerification(email: string, token: string): Promise<void>;
  sendPasswordReset(email: string, token: string): Promise<void>;
  sendSecurityAlert(email: string, message: string): Promise<void>;
}

class ConsoleEmailService implements EmailService {
  public async sendEmailVerification(email: string, token: string): Promise<void> {
    console.log(`[Email:development] Verification for ${email}: ${token}`);
  }

  public async sendPasswordReset(email: string, token: string): Promise<void> {
    console.log(`[Email:development] Password reset for ${email}: ${token}`);
  }

  public async sendSecurityAlert(email: string, message: string): Promise<void> {
    console.log(`[Email:development] Security alert for ${email}: ${message}`);
  }
}

class ProviderRequiredEmailService implements EmailService {
  private fail(): never {
    throw new Error('Email provider is not configured.');
  }

  public async sendEmailVerification(): Promise<void> {
    this.fail();
  }

  public async sendPasswordReset(): Promise<void> {
    this.fail();
  }

  public async sendSecurityAlert(): Promise<void> {
    this.fail();
  }
}

export function createEmailService(): EmailService {
  if (!authEnv.isProduction && (!authEnv.emailProvider || authEnv.emailProvider === 'console')) {
    return new ConsoleEmailService();
  }

  return new ProviderRequiredEmailService();
}

export const emailService = createEmailService();
