import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserSchema } from './schemas/user.schema';
import { CounterService } from '../common/services/counter.service';
import { CounterSchema } from '../common/schemas/counter.schemas';
import { UserController } from './user.controller';
import { AwsService } from '../aws/aws.service';
import { AvatarModule } from 'src/avatar/avatar.module';
import { Follow, FollowSchema } from './schemas/follow.schema';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Counter', schema: CounterSchema },
      { name: Follow.name, schema: FollowSchema },
    ]),
    AvatarModule,
    NotificationModule,
  ],
  controllers: [UserController],

  providers: [UserService, CounterService,AwsService],
  exports: [UserService],
})
export class UserModule {}
