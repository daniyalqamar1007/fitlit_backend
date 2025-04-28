import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SignupModule } from './auth/signup/signup.module';

@Module({
  imports: [SignupModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
