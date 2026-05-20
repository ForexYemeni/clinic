import mongoose, { Schema, Document } from 'mongoose';

export interface IClinic extends Document {
  name: string;
  adminPhone: string;
  setupComplete: boolean;
  createdAt: Date;
}

const ClinicSchema = new Schema<IClinic>({
  name: { type: String, required: true },
  adminPhone: { type: String, default: '' },
  setupComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

ClinicSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.models.Clinic || mongoose.model<IClinic>('Clinic', ClinicSchema);
