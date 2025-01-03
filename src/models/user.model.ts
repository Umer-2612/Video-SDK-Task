import { Schema, model } from 'mongoose';
import { IUser } from '../interfaces/user.interface';

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: 1 });

export const UserModel = model<IUser>('User', userSchema);
