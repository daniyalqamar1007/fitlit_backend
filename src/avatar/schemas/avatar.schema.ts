import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';

@Schema({ timestamps: { createdAt: 'created_at' } })
export class Avatar extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wardrobe' })
  shirt_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wardrobe' })
  pant_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wardrobe' })
  shoe_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wardrobe' })
  accessory_id: Types.ObjectId;

  @Prop({ type: String }) // URL from ChatGPT image generation
  avatar_url: string;
}

export const AvatarSchema = SchemaFactory.createForClass(Avatar);
