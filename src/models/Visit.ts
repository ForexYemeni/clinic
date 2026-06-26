import mongoose, { Schema, Document } from 'mongoose';

export interface IVitalSigns {
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  oxygenLevel?: string;
  sugarLevel?: string;
}

export interface IVisit extends Document {
  patientId: string;
  patientName: string;
  nurseId: string;
  nurseName: string;
  reason: string;
  diagnosis: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  visitDate: Date;
  vitalSigns: IVitalSigns;
  medications: string[];
  serviceIds: string[];
  complaints: string[];
  totalPrice: number;
  clinicId: string;
  createdAt: Date;
  updatedAt: Date;
}

const VisitSchema = new Schema<IVisit>(
  {
    patientId: { type: String, required: true },
    patientName: { type: String, default: '' },
    nurseId: { type: String, default: '' },
    nurseName: { type: String, default: '' },
    reason: { type: String, default: '' },
    diagnosis: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    visitDate: { type: Date, default: Date.now },
    vitalSigns: {
      type: {
        bloodPressure: { type: String, default: '' },
        heartRate: { type: String, default: '' },
        temperature: { type: String, default: '' },
        oxygenLevel: { type: String, default: '' },
        sugarLevel: { type: String, default: '' },
      },
      default: () => ({
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        oxygenLevel: '',
        sugarLevel: '',
      }),
    },
    medications: { type: [String], default: [] },
    serviceIds: { type: [String], default: [] },
    complaints: { type: [String], default: [] },
    totalPrice: { type: Number, default: 0 },
    clinicId: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

VisitSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.models.Visit || mongoose.model<IVisit>('Visit', VisitSchema);
