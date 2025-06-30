import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import type { Document } from "mongoose"

export type ProcessedImageDocument = ProcessedImage & Document

@Schema({ timestamps: true })
export class ProcessedImage {
  @Prop({ required: true })
  userId: string

  @Prop({ required: true })
  originalImageUrl: string

  @Prop({ required: true })
  processedImageUrl: string

  @Prop({ required: true })
  processType: string

  @Prop({ type: Object })
  parameters: any

  @Prop({ default: "completed" })
  status: string

  @Prop({ default: 0 })
  processingTime: number
}

export const ProcessedImageSchema = SchemaFactory.createForClass(ProcessedImage)
