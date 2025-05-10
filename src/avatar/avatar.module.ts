import { Module } from '@nestjs/common';
import { AvatarController } from './avatar.controller';
import { AvatarService } from './avatar.service';
// import { OpenaiService } from './utils/openai.service';
// import { MulterModule } from '@nestjs/platform-express';

@Module({
  // imports: [MulterModule.register()],
  controllers: [AvatarController],
  providers: [AvatarService],
  exports: [AvatarService],
})
export class AvatarModule {} 
