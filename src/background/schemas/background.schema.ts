import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import type { Document } from "mongoose"

export type BackgroundDocument = Background & Document

@Schema({ timestamps: true })
export class Background {
  @Prop({ required: true })
  name: string

  @Prop({ required: true })
  imageUrl: string

  @Prop()
  description: string

  @Prop({ default: true })
  isActive: boolean
}

export const BackgroundSchema = SchemaFactory.createForClass(Background)
