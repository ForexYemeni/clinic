import mongoose, { Schema, Document } from 'mongoose';

export interface IClinicSubscription {
  plan: string;
  trial: boolean;
  monthly: boolean;
  yearly: boolean;
  lifetime: boolean;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  gracePeriodEnds: Date | null;
  paymentMethod: string;
}

export interface IClinicTheme {
  primaryColor: string;
  logoUrl: string;
}

export interface IClinic extends Document {
  name: string;
  address: string;
  phone: string;
  city: string;
  adminPhone: string;
  adminId: string;
  active: boolean;
  setupComplete: boolean;
  subscription: IClinicSubscription;
  theme: IClinicTheme;
  createdAt: Date;
  updatedAt: Date;
}

const ClinicSchema = new Schema<IClinic>(
  {
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
        trial: { type: Boolean, default: false },
        monthly: { type: Boolean, default: false },
        yearly: { type: Boolean, default: false },
        lifetime: { type: Boolean, default: false },
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
        status: { type: String, default: 'active' },
        gracePeriodEnds: { type: Date, default: null },
        paymentMethod: { type: String, default: '' },
      },
      default: () => ({
        plan: 'free',
        trial: false,
        monthly: false,
        yearly: false,
        lifetime: false,
        startDate: null,
        endDate: null,
        status: 'active',
        gracePeriodEnds: null,
        paymentMethod: '',
      }),
    },
    theme: {
      type: {
        primaryColor: { type: String, default: '#16a34a' },
        logoUrl: { type: String, default: '' },
      },
      default: () => ({
        primaryColor: '#16a34a',
        logoUrl: '',
      }),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ClinicSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.models.Clinic || mongoose.model<IClinic>('Clinic', ClinicSchema);
