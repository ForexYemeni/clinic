// ═══════════════════════════════════════════════════════════
// 🍃 Platform Config Model - MongoDB/Mongoose (Singleton)
// ═══════════════════════════════════════════════════════════

import mongoose, { Schema, Document } from 'mongoose';

export interface IPlatform extends Document {
  _id: string;
  superAdminCreated: boolean;
  version?: string;
  defaultClinicId?: string;
  jwtSecret?: string;
  supportPhone?: string;
  supportWhatsApp?: string;
  updatedAt: Date;
}

const PlatformSchema = new Schema<IPlatform>({
  _id: { type: String, required: true, default: 'config' },
  superAdminCreated: { type: Boolean, default: false },
  version: { type: String },
  defaultClinicId: { type: String },
  jwtSecret: { type: String },
  supportPhone: { type: String },
  supportWhatsApp: { type: String },
}, {
  timestamps: true,
  collection: 'platform',
});

export const PlatformModel = mongoose.models.Platform || mongoose.model<IPlatform>('Platform', PlatformSchema);
