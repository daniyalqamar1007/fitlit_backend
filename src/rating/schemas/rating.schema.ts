import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Rating extends Document {
  @Prop({ type: Number, ref: 'User', required: true })
  userId: number

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true, maxlength: 1000 })
  message: string;

//   @Prop({ default: false })
//   isDeleted: boolean;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);

