import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  userId: string;
  userName: string;
  clinicId: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    userId: { type: String, default: '' },
    userName: { type: String, default: '' },
    clinicId: { type: String, default: '' },
    details: { type: String, default: '' },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

AuditLogSchema.virtual('id').get(function () {
  return this._id.toString();
});



export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
