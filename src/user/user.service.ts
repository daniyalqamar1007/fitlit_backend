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
import { OtpVerifyDto } from 'src/auth/dto/signup.dto/otp-verify.dto';

@Injectable()
export class UserService {
  async findById(id: number) {
    return this.userModel.findOne({ userId: id }); // assuming userId is the numeric field
  }

  constructor(
    @InjectModel('User') private userModel: Model<any>,
    private counterService: CounterService,
  ) {}

  async createUser(dto: OtpVerifyDto) {
    try {
      const userExists = await this.userModel.findOne({ email: dto.email });
      if (userExists) {
        throw new BadRequestException('Email already in use');
      }

      const userId = await this.counterService.getNextSequence('user');
      // const hashedPassword = await bcrypt.hash(dto.password, 10);

      const user = new this.userModel({
        ...dto,
        // password: hashedPassword,
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

  async softDeleteUser(
    userId: string,
  ): Promise<{ message: string; success: boolean }> {
    try {
      // First check if user exists and is not already deleted
      const user = await this.userModel.findOne({userId});

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.isDeleted) {
        return {
          success: false,
          message: 'Account is already deleted',
        };
      }

      // Perform soft delete
      const currentDate = new Date();
      const updatedUser = await this.userModel.findOneAndUpdate(
        {userId},
        {
          $set: {
            isDeleted: true,
            deletedAt: currentDate,
            // Optionally anonymize sensitive data
            email: `deleted_${userId}_${currentDate.getTime()}@deleted.com`,
            phone: null,
            // You can add more fields to anonymize if needed
          },
        },
        { new: true },
      );

      if (!updatedUser) {
        throw new Error('Failed to delete account');
      }

      return {
        success: true,
        message: 'Account deleted successfully',
      };
    } catch (error) {
      console.error('Error in soft delete:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new Error('Failed to delete account. Please try again.');
    }
  }
}
