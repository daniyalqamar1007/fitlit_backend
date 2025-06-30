import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import type { Document } from "mongoose"

export type AppSettingsDocument = AppSettings & Document

@Schema({ timestamps: true })
export class AppSettings {
  @Prop({ default: false })
  maintenanceMode: boolean

  @Prop({ default: true })
  allowRegistration: boolean

  @Prop({ default: 10485760 }) // 10MB
  maxFileSize: number

  @Prop({ default: "Welcome to FitLit!" })
  welcomeMessage: string
}

export const AppSettingsSchema = SchemaFactory.createForClass(AppSettings)
