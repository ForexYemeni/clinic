import mongoose, { Schema, Document } from 'mongoose';

export interface IPatient extends Document {
  name: string;
  age: number | null;
  gender: string;
  phone: string;
  emergencyPhone: string;
  address: string;
  bloodType: string;
  chronicDiseases: string;
  allergies: string;
  medicalHistory: string;
  notes: string;
  clinicId: string;
  createdAt: Date;
}

const PatientSchema = new Schema<IPatient>({
  name: { type: String, required: true },
  age: { type: Number, default: null },
  gender: { type: String, default: '' },
  phone: { type: String, default: '' },
  emergencyPhone: { type: String, default: '' },
  address: { type: String, default: '' },
  bloodType: { type: String, default: '' },
  chronicDiseases: { type: String, default: '' },
  allergies: { type: String, default: '' },
  medicalHistory: { type: String, default: '' },
  notes: { type: String, default: '' },
  clinicId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

PatientSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);
