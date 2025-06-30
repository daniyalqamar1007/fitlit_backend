import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { type Document, Types } from "mongoose"

export type AvatarDocument = Avatar & Document

@Schema({ timestamps: true })
export class Avatar {
  @Prop({ required: true })
  user_id: string

  @Prop({ type: Types.ObjectId, ref: "WardrobeItem" })
  shirt_id: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: "WardrobeItem" })
  pant_id: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: "WardrobeItem" })
  shoe_id: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: "WardrobeItem" })
  accessories_id: Types.ObjectId

  @Prop()
  backgroundimageurl: string

  @Prop()
  stored_message: string

  @Prop({ required: true })
  avatarUrl: string

  @Prop()
  date: string

  @Prop()
  stackimage: string
}

export const AvatarSchema = SchemaFactory.createForClass(Avatar)
