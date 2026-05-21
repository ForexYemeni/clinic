import mongoose, { Schema, Document } from 'mongoose';

export interface IPlatformConfig extends Document {
  configKey: string;
  superAdminCreated?: boolean;
  version?: string;
  defaultClinicId?: string;
  platformConfig?: Record<string, string>;
  jwtSecret?: string;
  supportPhone?: string;
  supportWhatsApp?: string;
  platformConfig?: Record<string, unknown>;
  updatedAt: Date;
}

const PlatformConfigSchema = new Schema<IPlatformConfig>(
  {
    configKey: { type: String, required: true, unique: true },
    superAdminCreated: { type: Boolean, default: false },
    version: { type: String, default: '' },
    defaultClinicId: { type: String, default: '' },
    platformConfig: { type: Schema.Types.Mixed, default: null },
    jwtSecret: { type: String, default: '' },
    supportPhone: { type: String, default: '' },
    supportWhatsApp: { type: String, default: '' },
    platformConfig: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

PlatformConfigSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.models.PlatformConfig || mongoose.model<IPlatformConfig>('PlatformConfig', PlatformConfigSchema);
