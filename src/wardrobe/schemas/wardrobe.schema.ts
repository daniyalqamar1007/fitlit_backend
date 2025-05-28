import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from 'mongoose';
export enum WardrobeItemCategory {
  SHIRTS = 'shirts',
  PANTS = 'pants',
  ACCESSORIES = 'accessories',
  SHOES = 'shoes',
}

export enum ShirtSubCategory {
  TSHIRT = 't-shirt',
  HALF_SHIRT = 'half-shirt',
  DRESS_SHIRT = 'dress shirt',
  CASUAL_SHIRT = 'casual shirt',
  POLO_SHIRT = 'polo shirt',
}

export enum PantsSubCategory {
  JEANS = 'jeans',
  TROUSERS = 'trousers',
  SHORTS = 'shorts',
  CARGO = 'cargo',
  TRACK_PANTS = 'track pants',
  FORMAL_PANT = 'formal pant',
}

export enum AccessoriesSubCategory {
  NECKLACE = 'necklace',
  BRACELET = 'bracelet',
  EARRING = 'earring',
  BELT = 'belt',
  HAT = 'hat',
  SCARF = 'scarf',
}

export enum ShoesSubCategory {
  SNEAKERS = 'sneakers',
  FORMAL_SHOES = 'formal shoes',
  BOOTS = 'boots',
  LOAFERS = 'loafers',
  SANDALS = 'sandals',
  SPORTS_SHOE = 'sports shoe',
}


export type WardrobeItemDocument = WardrobeItem & Document;
@Schema({
  timestamps: true,
  collection: 'wardrobe_items',
})
export class WardrobeItem extends Document {
  @Prop({
    type: Number,
    ref: 'User',
    required: true,
  })
  user_id: number;

  @Prop({ type: String, required: true })
  category: string;

  @Prop({ type: String, required: true })
  sub_category: string;

  @Prop({ type: String, required: true })
  image_url: string;

  // @Prop({ type: String, required: true })
  // avatar_url: string;
}

export const WardrobeItemSchema = SchemaFactory.createForClass(WardrobeItem);
