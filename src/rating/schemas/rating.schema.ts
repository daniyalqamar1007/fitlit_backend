import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import type { Document } from "mongoose"

export type RatingDocument = Rating & Document

@Schema({ timestamps: true })
export class Rating {
  @Prop({ required: true })
  userId: string

  @Prop({ required: true })
  targetId: string

  @Prop({ required: true, enum: ["avatar", "wardrobe_item"] })
  targetType: string

  @Prop({ required: true, min: 1, max: 5 })
  rating: number

  @Prop()
  comment: string
}

export const RatingSchema = SchemaFactory.createForClass(Rating)
