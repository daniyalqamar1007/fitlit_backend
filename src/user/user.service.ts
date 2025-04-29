import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from '../auth/dto/signup.dto';
import { CounterService } from '../common/services/counter.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private userModel: Model<any>,
    private counterService: CounterService,
  ) {}

  async createUser(dto: CreateUserDto) {
    const userId = await this.counterService.getNextSequence('user');
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = new this.userModel({
      ...dto,
      password: hashedPassword,
      userId,
    });

    return user.save();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }
}
