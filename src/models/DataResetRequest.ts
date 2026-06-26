import mongoose, { Schema, Document } from 'mongoose';

export interface IDataResetRequest extends Document {
  requestedBy: string;
  requesterName: string;
  clinicId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const DataResetRequestSchema = new Schema<IDataResetRequest>(
  {
    requestedBy: { type: String, default: '' },
    requesterName: { type: String, default: '' },
    clinicId: { type: String, required: true },
    reason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

DataResetRequestSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.models.DataResetRequest || mongoose.model<IDataResetRequest>('DataResetRequest', DataResetRequestSchema);
