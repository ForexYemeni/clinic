import mongoose, { Schema, Document } from 'mongoose';

export interface IClinic extends Document {
  name: string;
  address: string;
  phone: string;
  city: string;
  adminPhone: string;
  adminId: string;
  active: boolean;
  setupComplete: boolean;
  subscription: {
    plan: string;
    startDate: Date | null;
    endDate: Date | null;
    status: string;
  };
  createdAt: Date;
}

const ClinicSchema = new Schema<IClinic>({
  name: { type: String, required: true },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  city: { type: String, default: '' },
  adminPhone: { type: String, default: '' },
  adminId: { type: String, default: '' },
  active: { type: Boolean, default: true },
  setupComplete: { type: Boolean, default: false },
  subscription: {
    type: {
      plan: { type: String, default: 'free' },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      status: { type: String, default: 'active' },
    },
    default: () => ({
      plan: 'free',
      startDate: null,
      endDate: null,
      status: 'active',
    }),
  },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

ClinicSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.models.Clinic || mongoose.model<IClinic>('Clinic', ClinicSchema);
