import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Model as MongooseModel } from 'mongoose';
import { CreateUserDto } from '../auth/dto/signup.dto/signup.dto';
import { CounterService } from '../common/services/counter.service';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { OtpVerifyDto } from 'src/auth/dto/signup.dto/otp-verify.dto';
import { Follow, FollowDocument } from './schemas/follow.schema';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class UserService {
  async findById(id: number) {
    return this.userModel.findOne({ userId: id }); // assuming userId is the numeric field
  }

  constructor(
    @InjectModel('User') private userModel: Model<any>,
    private counterService: CounterService,
    @InjectModel(Follow.name) private followModel: MongooseModel<FollowDocument>,
    private notificationService: NotificationService,
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
      userId:user.userId,
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
      userId:user.userId,
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

  async followOrUnfollow(currentUserId: number, targetUserId: number, action: 'follow' | 'unfollow') {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('You cannot follow/unfollow yourself');
    }
    const follower = await this.userModel.findOne({ userId: currentUserId });
    const following = await this.userModel.findOne({ userId: targetUserId });
    if (!follower || !following) {
      throw new NotFoundException('User not found');
    }
    const followerObjId = follower._id;
    const followingObjId = following._id;
    if (action === 'follow') {
      const exists = await this.followModel.findOne({ follower: followerObjId, following: followingObjId });
      if (exists) {
        return { success: false, message: 'Already following' };
      }
      await this.followModel.create({ follower: followerObjId, following: followingObjId });
      // Create notification for follow
      await this.notificationService.createNotification(
        targetUserId,
        'follow',
        `${follower.name} started following you`,
        currentUserId,
      );
      return { success: true, message: 'Followed successfully' };
    } else {
      const res = await this.followModel.deleteOne({ follower: followerObjId, following: followingObjId });
      if (res.deletedCount > 0) {
        // Create notification for unfollow
        await this.notificationService.createNotification(
          targetUserId,
          'unfollow',
          `${follower.name} unfollowed you`,
          currentUserId,
        );
        return { success: true, message: 'Unfollowed successfully' };
      } else {
        return { success: false, message: 'Not following' };
      }
    }
  }

  async getFollowCounts(userId: number) {
    const user = await this.userModel.findOne({ userId });
    if (!user) throw new NotFoundException('User not found');
    const userObjId = user._id;
    const followingCount = await this.followModel.countDocuments({ follower: userObjId });
    const followersCount = await this.followModel.countDocuments({ following: userObjId });
    return {
      following: followingCount,
      followers: followersCount,
    };
  }

  async isFollowing(currentUserId: number, targetUserId: number): Promise<boolean> {
    const currentUser = await this.userModel.findOne({ userId: currentUserId });
    const targetUser = await this.userModel.findOne({ userId: targetUserId });
    if (!currentUser || !targetUser) return false;
    const exists = await this.followModel.findOne({
      follower: currentUser._id,
      following: targetUser._id,
    });
    return !!exists;
  }
}
