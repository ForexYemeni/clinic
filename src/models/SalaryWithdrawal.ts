import mongoose, { Schema, Document } from 'mongoose';

export interface ISalaryWithdrawal extends Document {
  nurseId: string;
  nurseName: string;
  amount: number;
  // Type of transaction:
  // 'withdrawal' / 'cash' (cash given to nurse, deducted from salary)
  // 'deposit' (transferred to nurse's bank/wallet account, DEDUCTED from salary, but clearly labeled as transfer)
  // 'deduction' (pure salary deduction, no money handed over)
  // 'debt' (invoice paid on behalf of nurse, counts as owed amount)
  // 'bonus' (ADDED to nurse's balance — bonus, raise, transportation allowance, etc. NOT deducted from salary)
  type: 'withdrawal' | 'deposit' | 'debt' | 'cash' | 'deduction' | 'bonus';
  // Subtype for bonuses: 'bonus' | 'raise' | 'transport' | 'other'
  bonusType: 'bonus' | 'raise' | 'transport' | 'other';
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  // How the money was delivered to the nurse: 'cash' or 'transfer' (to wallet/bank)
  withdrawalMethod: 'cash' | 'transfer';
  // Wallet / transfer details (only when withdrawalMethod === 'transfer')
  walletName: string;
  walletPhone: string;
  walletOwner: string;
  // Debt assignment details (only when type === 'debt')
  isDebt: boolean;
  invoiceId: string;
  patientName: string;
  // Who initiated the transaction: 'admin' or 'nurse'
  requestedBy: 'admin' | 'nurse';
  // Admin user id who created this record
  createdBy: string;
  requestedAt: Date;
  approvedAt: Date | null;
  approvedBy: string;
  rejectedBy: string;
  // Admin user id who reviewed the pending request (approve/reject)
  reviewedBy: string;
  reviewedAt: Date | null;
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
    type: {
      type: String,
      enum: ['withdrawal', 'deposit', 'debt', 'cash', 'deduction', 'bonus'],
      default: 'withdrawal',
    },
    bonusType: {
      type: String,
      enum: ['bonus', 'raise', 'transport', 'other'],
      default: 'bonus',
    },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    withdrawalMethod: {
      type: String,
      enum: ['cash', 'transfer'],
      default: 'cash',
    },
    walletName: { type: String, default: '' },
    walletPhone: { type: String, default: '' },
    walletOwner: { type: String, default: '' },
    isDebt: { type: Boolean, default: false },
    invoiceId: { type: String, default: '' },
    patientName: { type: String, default: '' },
    requestedBy: {
      type: String,
      enum: ['admin', 'nurse'],
      default: 'admin',
    },
    createdBy: { type: String, default: '' },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, default: '' },
    rejectedBy: { type: String, default: '' },
    reviewedBy: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
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
