import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum WardrobeItemCategory {
  TOP = 'top',
  BOTTOM = 'bottom',
  FOOTWEAR = 'footwear',
  ACCESSORIES = 'accessories',
  OUTERWEAR = 'outerwear',
  DRESSES = 'dresses',
}

export enum TopSubCategory {
  TSHIRT = 't-shirt',
  SHIRT = 'shirt',
  POLO = 'polo',
  TANK_TOP = 'tank_top',
  BLOUSE = 'blouse',
  SWEATER = 'sweater',
}

export enum BottomSubCategory {
  JEANS = 'jeans',
  CHINOS = 'chinos',
  SHORTS = 'shorts',
  TROUSERS = 'trousers',
  SKIRT = 'skirt',
}

export enum FootwearSubCategory {
  SNEAKERS = 'sneakers',
  BOOTS = 'boots',
  CHELSEA = 'chelsea',
  LOAFERS = 'loafers',
  SANDALS = 'sandals',
  FORMAL = 'formal',
  HEELS = 'heels',
}

export enum AccessorySubCategory {
  WATCH = 'watch',
  BELT = 'belt',
  HAT = 'hat',
  SCARF = 'scarf',
  GLOVES = 'gloves',
  JEWELRY = 'jewelry',
  BAG = 'bag',
  SUNGLASSES = 'sunglasses',
}

export enum OuterwearSubCategory {
  JACKET = 'jacket',
  COAT = 'coat',
  HOODIE = 'hoodie',
  CARDIGAN = 'cardigan',
  BLAZER = 'blazer',
}

export enum DressSubCategory {
  CASUAL = 'casual',
  FORMAL = 'formal',
  COCKTAIL = 'cocktail',
  SUNDRESS = 'sundress',
  EVENING = 'evening',
}

@Schema({
  timestamps: true,
  collection: 'wardrobe_items',
})
export class WardrobeItem extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user_id: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    enum: WardrobeItemCategory,
    required: true,
  })
  category: WardrobeItemCategory;

  @Prop({ type: String, required: true })
  image_url: string;

  @Prop({
    type: String,
    required: true,
  })
  sub_category: string;

  @Prop({ type: String, required: true })
  name: string;
}

export const WardrobeItemSchema = SchemaFactory.createForClass(WardrobeItem);
