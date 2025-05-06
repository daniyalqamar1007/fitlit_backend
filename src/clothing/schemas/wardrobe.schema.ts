import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum ClothingCategory {
  SHIRT = 'shirt',
  PANT = 'pant',
  SHOE = 'shoe',
  ACCESSORY = 'accessories',
}

export enum ShirtSubCategory {
  TSHIRT = 't-shirt',
  DRESS = 'dress',
}

export enum PantSubCategory {
  JEANS = 'jeans',
  CHINOS = 'chinos',
  SHORTS = 'shorts',
}

export enum ShoeSubCategory {
  SNEAKERS = 'sneakers',
  BOOTS = 'boots',
  CHELSEA = 'chelsea',
}

export enum AccessorySubCategory {
  WATCH = 'watch',
  BELT = 'belt',
  HAT = 'hat',
}

@Schema({
  timestamps: true,
  collection: 'wardrobe_items', 
})
export class Clothing extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user_id: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    enum: ClothingCategory,
    required: true,
  })
  category: ClothingCategory;

  @Prop({ type: String, required: true })
  image_url: string;

  @Prop({
    type: String,
    required: true,
  })
  sub_category: string;
}

export const ClothingSchema = SchemaFactory.createForClass(Clothing);
