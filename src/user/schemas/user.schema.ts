// src/user/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: Number, required: true })
  userId: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  otp: string;

  @Prop()
  otpExpiry: Date;

  @Prop({ default: false })
  isAdmin: boolean; // Added isAdmin flag to identify admin users
}

export const UserSchema = SchemaFactory.createForClass(User);
// import { Schema } from 'mongoose';

// export const UserSchema = new Schema(
//   {
//     userId: { type: Number, unique: true },
//     name: String,
//     email: { type: String, unique: true, required: true },
//     password: String,
//     phoneNumber: String,
//     profilePhoto: String,
//     role: { type: String, enum: ['user', 'admin'], default: 'user' },
//     gender: { type: String, enum: ['male', 'female', 'other'] },
//   },
//   { timestamps: true },
// );
