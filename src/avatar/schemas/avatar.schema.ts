import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { WardrobeItem } from 'src/wardrobe/schemas/wardrobe.schema';
import { Schema as MongooseSchema } from 'mongoose';
export type AvatarDocument = Avatar & Document;

@Schema({ collection: 'avatars' })
export class Avatar {
  @Prop({
    type: Number,
    ref: 'User',
    required: true,
  })
  user_id: number;

  // @Prop({ required: false })
  // index: string;

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

  // @Prop({ required: false })
  // accessory_id: string;

  @Prop({ required: true })
  avatarUrl: string;

  @Prop({ required: false })
  date: string; // Format: dd/mm/yyyy
}

export const AvatarSchema = SchemaFactory.createForClass(Avatar);
