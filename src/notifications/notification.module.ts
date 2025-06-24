// notification.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { Notification, NotificationSchema } from './schemas/notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema }
    ]),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationGateway,
  ],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}