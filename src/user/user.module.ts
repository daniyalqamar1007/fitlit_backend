import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { UserController } from "./user.controller"
import { UserService } from "./user.service"
import { User, UserSchema } from "./schemas/user.schema"
import { Follow, FollowSchema } from "./schemas/follow.schema"
import { AwsModule } from "../aws/aws.module"

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Follow.name, schema: FollowSchema },
    ]),
    AwsModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
