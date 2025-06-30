import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import type { Document } from "mongoose"

export type BackgroundImageDocument = BackgroundImage & Document

@Schema({ timestamps: true })
export class BackgroundImage {
  @Prop({ required: true })
  name: string

  @Prop({ required: true })
  imageUrl: string

  @Prop()
  category: string

  @Prop({ default: true })
  isActive: boolean

  @Prop()
  createdBy: string
}

export const BackgroundImageSchema = SchemaFactory.createForClass(BackgroundImage)
