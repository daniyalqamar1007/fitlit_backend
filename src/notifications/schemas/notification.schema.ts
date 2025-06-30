import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import type { Document } from "mongoose"

export type NotificationDocument = Notification & Document

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  userId: string

  @Prop({ required: true })
  title: string

  @Prop({ required: true })
  message: string

  @Prop({ default: "info" })
  type: string

  @Prop({ default: false })
  isRead: boolean

  @Prop()
  data: any
}

export const NotificationSchema = SchemaFactory.createForClass(Notification)
