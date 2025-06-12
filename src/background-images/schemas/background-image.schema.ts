import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class BackgroundImage extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  user_id: Types.ObjectId;

  @Prop({ required: true })
  image_url: string;

  @Prop({ default: true })
  status: boolean;

  @Prop()
  prompt: string;
}

export const BackgroundImageSchema = SchemaFactory.createForClass(BackgroundImage); 