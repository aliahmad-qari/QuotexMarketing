import mongoose, { Document, Schema } from 'mongoose';
import { AccountStatus, UserRole } from '../types/auth.types';

export interface IUserDocument extends Document {
  email: string;
  normalizedEmail: string;
  passwordHash: string;
  displayName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  failedLoginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedEmail: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    role: {
      type: String,
      enum: ['user', 'researcher', 'admin'],
      default: 'user',
      required: true,
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'disabled'],
      default: 'active',
      required: true,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    lastLoginAt: Date,
    passwordChangedAt: Date,
    failedLoginAttempts: {
      type: Number,
      default: 0,
      required: true,
    },
    lockUntil: Date,
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
