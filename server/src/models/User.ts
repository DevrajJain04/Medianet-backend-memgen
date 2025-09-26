import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'publisher' | 'advertiser';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    company: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['publisher', 'advertiser'], required: true },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>('User', UserSchema);
export default User;


