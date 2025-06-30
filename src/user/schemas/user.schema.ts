import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import type { Document } from "mongoose"

export type UserDocument = User & Document

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string

  @Prop({ required: true, unique: true })
  email: string

  @Prop({ required: true })
  password: string

  @Prop()
  phone: string

  @Prop()
  bio: string

  @Prop()
  profilePicture: string

  @Prop({ default: false })
  isVerified: boolean

  @Prop()
  otp: string

  @Prop()
  resetToken: string

  @Prop()
  resetTokenExpiry: Date

  @Prop({ default: "user" })
  role: string
}

export const UserSchema = SchemaFactory.createForClass(User)
