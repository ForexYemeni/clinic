import mongoose, { Schema, Document } from 'mongoose';

export interface IVisit extends Document {
  patientId: string;
  nurseId: string;
  nurseName: string;
  reason: string;
  diagnosis: string;
  status: string;
  visitDate: Date;
  notes: string;
  vitalSigns: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    oxygenLevel?: string;
    sugarLevel?: string;
  };
  medications: string[];
  serviceIds: string[];
  complaints: string[];
  totalPrice: number;
  createdAt: Date;
}

const VisitSchema = new Schema<IVisit>({
  patientId: { type: String, required: true },
  nurseId: { type: String, default: '' },
  nurseName: { type: String, default: '' },
  reason: { type: String, default: '' },
  diagnosis: { type: String, default: '' },
  status: { type: String, default: 'completed' },
  visitDate: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
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
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

VisitSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.models.Visit || mongoose.model<IVisit>('Visit', VisitSchema);
