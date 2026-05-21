import mongoose, { Schema, Document } from 'mongoose';

export interface ISalaryWithdrawal extends Document {
  nurseId: string;
  nurseName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  approvedAt: Date | null;
  approvedBy: string;
  rejectedBy: string;
  rejectionReason: string;
  notes: string;
  clinicId: string;
  createdAt: Date;
  updatedAt: Date;
}

const SalaryWithdrawalSchema = new Schema<ISalaryWithdrawal>(
  {
    nurseId: { type: String, default: '' },
    nurseName: { type: String, default: '' },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, default: '' },
    rejectedBy: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    notes: { type: String, default: '' },
    clinicId: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

SalaryWithdrawalSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.models.SalaryWithdrawal || mongoose.model<ISalaryWithdrawal>('SalaryWithdrawal', SalaryWithdrawalSchema);
