import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditLogDocument extends Document {
  actorUserId?: Types.ObjectId;
  actorEmail?: string;
  action: string;
  targetUserId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    actorEmail: String,
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    metadata: Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
