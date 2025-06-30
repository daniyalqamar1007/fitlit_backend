import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import type { Document } from "mongoose"

export type CounterDocument = Counter & Document

@Schema()
export class Counter {
  @Prop({ required: true, unique: true })
  name: string

  @Prop({ required: true, default: 0 })
  value: number
}

export const CounterSchema = SchemaFactory.createForClass(Counter)
