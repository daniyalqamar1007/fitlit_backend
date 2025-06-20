import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FollowDocument = Follow & Document;

@Schema({ timestamps: true })
export class Follow {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  follower: Types.ObjectId; // The user who follows

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  following: Types.ObjectId; // The user being followed
}

export const FollowSchema = SchemaFactory.createForClass(Follow); 