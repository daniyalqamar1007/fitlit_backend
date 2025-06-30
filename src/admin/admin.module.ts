// src/admin/admin.module.ts
import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { JwtModule } from "@nestjs/jwt"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { AdminController } from "./admin.controller"
import { AdminService } from "./admin.service"
import { User, UserSchema } from "../user/schemas/user.schema"
import { UserModule } from "../user/user.module"
import { AwsModule } from "src/aws/aws.module"
import { AvatarModule } from "src/avatar/avatar.module"

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      // { name: Avatar.name, schema: AvatarSchema },
      // { name: WardrobeItem.name, schema: WardrobeItemSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
        signOptions: { expiresIn: "1d" },
      }),
    }),
    UserModule,
    AwsModule,
    AvatarModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
