import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
  nameAr: string;
  price: number;
  duration: number;
  category: string;
  description: string;
  icon: string;
  color: string;
  active: boolean;
  status: 'active' | 'paused' | 'deleted';
  clinicId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    nameAr: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '' },
    color: { type: String, default: '' },
    active: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['active', 'paused', 'deleted'],
      default: 'active',
    },
    clinicId: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ServiceSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);
