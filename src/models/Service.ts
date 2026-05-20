import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
  nameAr: string;
  price: number;
  duration: number;
  category: string;
  description: string;
  active: boolean;
  status: string; // 'active', 'paused', 'deleted'
  createdAt: Date;
}

const ServiceSchema = new Schema<IService>({
  nameAr: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: Number, default: 15 },
  category: { type: String, default: 'أخرى' },
  description: { type: String, default: '' },
  active: { type: Boolean, default: true },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

ServiceSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);
