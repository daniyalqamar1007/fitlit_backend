import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserSchema } from './schemas/user.schema';
import { CounterService } from '../common/services/counter.service';
import { CounterSchema } from '../common/schemas/counter.schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Counter', schema: CounterSchema },
    ]),
  ],
  providers: [UserService, CounterService],
  exports: [UserService],
})
export class UserModule {}
