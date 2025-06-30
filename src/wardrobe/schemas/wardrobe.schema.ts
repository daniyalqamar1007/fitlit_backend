import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import type { Document } from "mongoose"

export type WardrobeItemDocument = WardrobeItem & Document

export enum WardrobeItemCategory {
  SHIRT = "shirt",
  PANTS = "pants",
  SHOES = "shoes",
  ACCESSORIES = "accessories",
}

@Schema({ timestamps: true })
export class WardrobeItem {
  @Prop({ required: true })
  user_id: string

  @Prop({ required: true, enum: WardrobeItemCategory })
  category: WardrobeItemCategory

  @Prop()
  sub_category: string

  @Prop({ required: true })
  name: string

  @Prop()
  description: string

  @Prop({ required: true })
  image_url: string

  @Prop()
  color: string

  @Prop()
  brand: string

  @Prop()
  size: string

  @Prop()
  price: number

  @Prop({ default: true })
  isActive: boolean
}

export const WardrobeItemSchema = SchemaFactory.createForClass(WardrobeItem)
