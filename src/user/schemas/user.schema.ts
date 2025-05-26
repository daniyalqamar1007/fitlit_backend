// src/user/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


export type UserDocument = User &
  Document & {
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class User {
  @Prop({ type: Number, required: true })
  userId: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true,  })
  gender: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  profilePicture: string;
  
  @Prop({ default: false })
  isAdmin: boolean; // Added isAdmin flag to identify admin users

  
}

export const UserSchema = SchemaFactory.createForClass(User);
