import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BackgroundDocument = Background & Document;

@Schema({ collection: 'backgrounds' })
export class Background {
  @Prop({
    type: Number,
    ref: 'User',
    required: true,
  })
  user_id: number;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ required: false, default: false })
  isActive: boolean;

  @Prop({ required: false })
  prompt: string;

  @Prop({ required: false })
  createdAt: Date;
}

export const BackgroundSchema = SchemaFactory.createForClass(Background); 