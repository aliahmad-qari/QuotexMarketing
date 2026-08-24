import argon2 from 'argon2';

const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$MTIzNDU2Nzg5MDEyMzQ1Ng$P6AItHYv0iA5f5gyQvTbKSfHtqFM3KRm4mAWDqLbg3s';

export class PasswordService {
  public static validatePassword(password: string): string[] {
    const issues: string[] = [];
    if (password.length < 12) issues.push('Password must be at least 12 characters.');
    if (!/[a-z]/.test(password)) issues.push('Password must include a lowercase letter.');
    if (!/[A-Z]/.test(password)) issues.push('Password must include an uppercase letter.');
    if (!/[0-9]/.test(password)) issues.push('Password must include a number.');
    if (!/[^A-Za-z0-9]/.test(password)) issues.push('Password must include a symbol.');
    return issues;
  }

  public static async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  public static async verifyPassword(hash: string | undefined, password: string): Promise<boolean> {
    try {
      return argon2.verify(hash || DUMMY_HASH, password);
    } catch {
      return false;
    }
  }
}
