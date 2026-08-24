import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import { connectDB } from '../config/db';
import { AuthService } from '../services/AuthService';
import { PasswordService } from '../services/PasswordService';

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function generatePassword(): string {
  return `${crypto.randomBytes(18).toString('base64url')}aA1!`;
}

async function main() {
  const email = readArg('email');
  if (!email) {
    throw new Error('Usage: npm run create-admin -- --email=<email>');
  }

  const allowedBootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  if (allowedBootstrapEmail && email.trim().toLowerCase() !== allowedBootstrapEmail) {
    throw new Error('The provided email does not match ADMIN_BOOTSTRAP_EMAIL.');
  }

  const password = generatePassword();
  const issues = PasswordService.validatePassword(password);
  if (issues.length > 0) {
    throw new Error(`Generated password failed policy: ${issues.join(' ')}`);
  }

  await connectDB();
  const user = await AuthService.promoteBootstrapAdmin(email, password);

  console.log(`Admin account ready for ${user.email}.`);
  console.log('Generated password, shown once. Store it in a secure password manager:');
  console.log(password);
  console.log('No password was written to repository files.');
}

main().catch((error) => {
  console.error(`[create-admin] ${error.message}`);
  process.exit(1);
});
