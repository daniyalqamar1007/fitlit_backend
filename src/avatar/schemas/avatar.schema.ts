import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { WardrobeItem } from 'src/wardrobe/schemas/wardrobe.schema';

export type AvatarDocument = Avatar & Document;

@Schema({ collection: 'avatars' })
export class Avatar {
  @Prop({
    type: Number,
    ref: 'User',
    required: true,
  })
  user_id: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'WardrobeItem',
  })
  shirt_id: WardrobeItem;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'WardrobeItem',
  })
  pant_id: WardrobeItem;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'WardrobeItem',
  })
  shoe_id: WardrobeItem;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'WardrobeItem',
  })
  accessories_id: WardrobeItem;

  @Prop({ required: true })
  avatarUrl: string;

  @Prop({ required: false })
  date: string; // Format: dd/mm/yyyy

  @Prop({ required: false })
  stored_message: string; // ✅ Added this line
}

export const AvatarSchema = SchemaFactory.createForClass(Avatar);
