import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISessionDocument extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  reusedAt?: Date;
  replacedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

const SessionSchema = new Schema<ISessionDocument>(
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
    revokedAt: Date,
    reusedAt: Date,
    replacedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
    },
    userAgent: String,
    ipAddress: String,
  },
  {
    timestamps: true,
  }
);

SessionSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });

export const SessionModel = mongoose.models.Session || mongoose.model<ISessionDocument>('Session', SessionSchema);
