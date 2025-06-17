import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BackgroundService } from './background.service';
import { Background, BackgroundSchema } from './schemas/background.schema';
import { AwsModule } from 'src/aws/aws.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Background.name, schema: BackgroundSchema },
    ]),
    AwsModule,
  ],
  providers: [BackgroundService],
  exports: [BackgroundService],
})
export class BackgroundModule {} 