import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AvatarService } from './avatar.service';
import { AvatarController } from './avatar.controller';
import { Avatar, AvatarSchema } from './schemas/avatar.schema';
import { WardrobeItem, WardrobeItemSchema } from 'src/wardrobe/schemas/wardrobe.schema';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { UserModule } from 'src/user/user.module';
import { AwsModule } from 'src/aws/aws.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Avatar.name, schema: AvatarSchema },
      { name: WardrobeItem.name, schema: WardrobeItemSchema },
      { name: User.name, schema: UserSchema },
    ]),
     forwardRef(() => UserModule), // Use forwardRef here
    AwsModule,
    AvatarModule
  ],
  controllers: [AvatarController],
  providers: [AvatarService],
  exports: [AvatarService],
})
export class AvatarModule {}