import mongoose, { Schema } from 'mongoose';

export interface IAdminAuditLog extends mongoose.Document {
  actor: mongoose.Types.ObjectId;
  action: string;
  targetUser?: mongoose.Types.ObjectId;
  details?: string;
  createdAt: Date;
}

const adminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    targetUser: { type: Schema.Types.ObjectId, ref: 'User' },
    details: { type: String, default: '' },
  },
  { timestamps: true },
);

export const AdminAuditLog = mongoose.models.AdminAuditLog || mongoose.model<IAdminAuditLog>('AdminAuditLog', adminAuditLogSchema);
