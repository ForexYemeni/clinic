import mongoose, { Schema, Document } from 'mongoose';

export interface IEmergency extends Document {
  patientId: string;
  patientName: string;
  nurseId: string;
  nurseName: string;
  severity: string;
  status: string;
  notes: string;
  actions: string;
  procedures: string;
  arrivalTime: Date;
  clinicId: string;
  createdAt: Date;
}

const EmergencySchema = new Schema<IEmergency>({
  patientId: { type: String, required: true },
  patientName: { type: String, default: '' },
  nurseId: { type: String, default: '' },
  nurseName: { type: String, default: '' },
  severity: { type: String, default: 'moderate' },
  status: { type: String, default: 'active' },
  notes: { type: String, default: '' },
  actions: { type: String, default: '' },
  procedures: { type: String, default: '' },
  arrivalTime: { type: Date, default: Date.now },
  clinicId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

EmergencySchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.models.Emergency || mongoose.model<IEmergency>('Emergency', EmergencySchema);
