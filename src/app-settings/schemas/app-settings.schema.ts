import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AppSettingsDocument = AppSettings & Document;

@Schema()
export class AppSettings {
  @Prop({ required: true })
  ios_version: string;

  @Prop({ required: true })
  android_version: string;

  @Prop({ required: true })
  ios_deployed_version: string;

  @Prop({ required: true })
  android_deployed_version: string;
}

export const AppSettingsSchema = SchemaFactory.createForClass(AppSettings);
