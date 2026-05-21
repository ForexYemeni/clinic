import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem {
  serviceId: string;
  serviceName: string;
  price: number;
  quantity: number;
  nurseName: string;
  date: Date;
}

export interface IInvoice extends Document {
  patientId: string;
  patientName: string;
  visitId: string;
  items: IInvoiceItem[];
  total: number;
  paid: number;
  remaining: number;
  status: 'paid' | 'unpaid' | 'partial';
  clinicId: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    patientId: { type: String, default: '' },
    patientName: { type: String, default: '' },
    visitId: { type: String, default: '' },
    items: {
      type: [
        {
          serviceId: { type: String, default: '' },
          serviceName: { type: String, default: '' },
          price: { type: Number, default: 0 },
          quantity: { type: Number, default: 1 },
          nurseName: { type: String, default: '' },
          date: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    total: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['paid', 'unpaid', 'partial'],
      default: 'unpaid',
    },
    clinicId: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

InvoiceSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
