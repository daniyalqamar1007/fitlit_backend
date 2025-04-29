import { Schema } from 'mongoose';

export const UserSchema = new Schema(
  {
    userId: { type: Number, unique: true },
    name: String,
    email: { type: String, unique: true, required: true },
    password: String,
    phoneNumber: String,
    profilePhoto: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    gender: { type: String, enum: ['male', 'female', 'other'] },
  },
  { timestamps: true },
);
