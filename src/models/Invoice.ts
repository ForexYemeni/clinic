import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  patientId: string;
  visitId: string;
  items: Array<{
    serviceId: string;
    serviceName: string;
    price: number;
    quantity: number;
    nurseName: string;
  }>;
  total: number;
  paid: number;
  remaining: number;
  status: string;
  clinicId: string;
  createdAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>({
  patientId: { type: String, required: true },
  visitId: { type: String, default: '' },
  items: {
    type: [{
      serviceId: { type: String, default: '' },
      serviceName: { type: String, default: '' },
      price: { type: Number, default: 0 },
      quantity: { type: Number, default: 1 },
      nurseName: { type: String, default: '' },
    }],
    default: [],
  },
  total: { type: Number, default: 0 },
  paid: { type: Number, default: 0 },
  remaining: { type: Number, default: 0 },
  status: { type: String, default: 'unpaid' },
  clinicId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

InvoiceSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
