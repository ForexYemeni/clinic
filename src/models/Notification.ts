import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  actionUrl: string;
  relatedId: string;
  clinicId: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, default: '' },
    type: { type: String, default: 'system' },
    title: { type: String, default: '' },
    message: { type: String, default: '' },
    read: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ['urgent', 'high', 'normal', 'low'],
      default: 'normal',
    },
    actionUrl: { type: String, default: '' },
    relatedId: { type: String, default: '' },
    clinicId: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

NotificationSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
