import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPasswordResetTokenDocument extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    usedAt: Date,
    userAgent: String,
    ipAddress: String,
  },
  {
    timestamps: true,
  }
);

export const PasswordResetTokenModel =
  mongoose.models.PasswordResetToken ||
  mongoose.model<IPasswordResetTokenDocument>('PasswordResetToken', PasswordResetTokenSchema);
