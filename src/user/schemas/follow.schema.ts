import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import type { Document } from "mongoose"

export type FollowDocument = Follow & Document

@Schema({ timestamps: true })
export class Follow {
  @Prop({ required: true })
  followerId: string

  @Prop({ required: true })
  followingId: string
}

export const FollowSchema = SchemaFactory.createForClass(Follow)
