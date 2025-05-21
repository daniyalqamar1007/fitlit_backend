import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AvatarDocument = Avatar & Document;

@Schema({collection:'avatars'})
export class Avatar {

 @Prop({
    type: Number,
    ref: 'User',
    required: true,
  })
  user_id: Number;

  @Prop({ required: false })
  index: string;
  
  @Prop({ required: true })
  shirt_id: string;

  @Prop({ required: true })
  pant_id: string;

  @Prop({ required: true })
  shoe_id: string;

  @Prop({ required: true })
  accessory_id: string;

  @Prop({ required: true })
  avatarUrl: string;

  @Prop({ required: true })
  date: string; // Format: dd/mm/yyyy
}

export const AvatarSchema = SchemaFactory.createForClass(Avatar);
