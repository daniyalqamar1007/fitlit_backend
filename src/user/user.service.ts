import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from '../auth/dto/signup.dto/signup.dto';
import { CounterService } from '../common/services/counter.service';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  async findById(id: number) {
    return this.userModel.findOne({ userId: id }); // assuming userId is the numeric field
  }

  constructor(
    @InjectModel('User') private userModel: Model<any>,
    private counterService: CounterService,
  ) {}

  async createUser(dto: CreateUserDto) {
    try {
      const userExists = await this.userModel.findOne({ email: dto.email });
      if (userExists) {
        throw new BadRequestException('Email already in use');
      }

      const userId = await this.counterService.getNextSequence('user');
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const user = new this.userModel({
        ...dto,
        password: hashedPassword,
        userId,
      });

      return await user.save();
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create user',
        error.message,
      );
    }
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async updatePassword(email: string, hashedPassword: string) {
    return this.userModel.updateOne({ email }, { password: hashedPassword });
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  async findByIdForProfile(id: string): Promise<Partial<User>> {
    const user = await this.userModel.findOne({ userId: id }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      email: user.email,
      name: user.name,
      gender: user.gender,
      profilePicture: user.profilePicture || null,
    };
  }

  async updateProfile(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Partial<User>> {
    const user = await this.userModel
      .findOneAndUpdate(
        { userId: id },
        { $set: updateProfileDto },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      name: user.name,
      email: user.email,
      gender: user.gender,
      profilePicture: user.profilePicture || null,
    };
  }
}
