import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  clinicId: string;
  type: string; // 'patient', 'visit', 'emergency', 'subscription', 'payment', 'system', 'nurse', 'data_reset'
  title: string;
  message: string;
  read: boolean;
  priority: string; // 'low', 'normal', 'high', 'urgent'
  actionUrl: string;
  relatedId: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: String, required: true },
  clinicId: { type: String, default: '' },
  type: { type: String, default: 'system' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  priority: { type: String, default: 'normal' },
  actionUrl: { type: String, default: '' },
  relatedId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

NotificationSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
