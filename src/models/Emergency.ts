import mongoose, { Schema, Document } from 'mongoose';

export interface IEmergency extends Document {
  patientId: string;
  patientName: string;
  nurseId: string;
  nurseName: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  status: 'active' | 'treated' | 'transferred' | 'archived';
  notes: string;
  actions: string;
  procedures: string;
  arrivalTime: Date;
  clinicId: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencySchema = new Schema<IEmergency>(
  {
    patientId: { type: String, default: '' },
    patientName: { type: String, default: '' },
    nurseId: { type: String, default: '' },
    nurseName: { type: String, default: '' },
    severity: {
      type: String,
      enum: ['critical', 'high', 'moderate', 'low'],
      default: 'moderate',
    },
    status: {
      type: String,
      enum: ['active', 'treated', 'transferred', 'archived'],
      default: 'active',
    },
    notes: { type: String, default: '' },
    actions: { type: String, default: '' },
    procedures: { type: String, default: '' },
    arrivalTime: { type: Date, default: Date.now },
    clinicId: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

EmergencySchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.models.Emergency || mongoose.model<IEmergency>('Emergency', EmergencySchema);
