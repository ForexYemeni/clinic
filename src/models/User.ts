import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  phone: string;
  password: string;
  role: 'admin' | 'nurse';
  active: boolean;
  clinicId: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'nurse'], default: 'nurse' },
  active: { type: Boolean, default: true },
  clinicId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

UserSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
