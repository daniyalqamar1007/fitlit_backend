import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { BackgroundService } from "./background.service"
import { Background, BackgroundSchema } from "./schemas/background.schema"

@Module({
  imports: [MongooseModule.forFeature([{ name: Background.name, schema: BackgroundSchema }])],
  providers: [BackgroundService],
  exports: [BackgroundService],
})
export class BackgroundModule {}
