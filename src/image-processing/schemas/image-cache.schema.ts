import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import type { Document } from "mongoose"

export type ImageCacheDocument = ImageCache & Document

@Schema({ timestamps: true })
export class ImageCache {
  @Prop({ required: true, unique: true })
  hash: string

  @Prop({ required: true })
  processedImageUrl: string

  @Prop({ required: true })
  processType: string

  @Prop({ default: 0 })
  hitCount: number

  @Prop({ default: Date.now, expires: 604800 }) // 7 days
  expiresAt: Date
}

export const ImageCacheSchema = SchemaFactory.createForClass(ImageCache)
