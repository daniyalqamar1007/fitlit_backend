import { Injectable, NotFoundException } from "@nestjs/common"
import type { Model } from "mongoose"
import type { User, UserDocument } from "./schemas/user.schema"
import type { FollowDocument } from "./schemas/follow.schema"
import type { UpdateProfileDto } from "./dto/update-profile.dto"
import type { AwsService } from "../aws/aws.service"
import type { Express } from "express"

@Injectable()
export class UserService {
  private userModel: Model<UserDocument>
  private followModel: Model<FollowDocument>
  private awsService: AwsService

  constructor(userModel: Model<UserDocument>, followModel: Model<FollowDocument>, awsService: AwsService) {
    this.userModel = userModel
    this.followModel = followModel
    this.awsService = awsService
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId).select("-password").exec()
    if (!user) {
      throw new NotFoundException("User not found")
    }
    return user
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto, file?: Express.Multer.File): Promise<User> {
    const updateData = { ...updateProfileDto }

    if (file) {
      const profilePictureUrl = await this.awsService.uploadFile(file.buffer, file)
      updateData.profilePicture = profilePictureUrl
    }

    const user = await this.userModel.findByIdAndUpdate(userId, updateData, { new: true }).select("-password").exec()
    if (!user) {
      throw new NotFoundException("User not found")
    }
    return user
  }

  async followUser(followerId: string, followingId: string): Promise<{ message: string }> {
    if (followerId === followingId) {
      throw new Error("Cannot follow yourself")
    }

    const existingFollow = await this.followModel.findOne({ followerId, followingId })
    if (existingFollow) {
      throw new Error("Already following this user")
    }

    const follow = new this.followModel({ followerId, followingId })
    await follow.save()

    return { message: "User followed successfully" }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<{ message: string }> {
    const result = await this.followModel.deleteOne({ followerId, followingId })
    if (result.deletedCount === 0) {
      throw new Error("Not following this user")
    }

    return { message: "User unfollowed successfully" }
  }

  async getFollowers(userId: string): Promise<User[]> {
    const follows = await this.followModel
      .find({ followingId: userId })
      .populate("followerId", "name email profilePicture")
      .exec()
    return follows.map((follow) => follow.followerId as any)
  }

  async getFollowing(userId: string): Promise<User[]> {
    const follows = await this.followModel
      .find({ followerId: userId })
      .populate("followingId", "name email profilePicture")
      .exec()
    return follows.map((follow) => follow.followingId as any)
  }
}
