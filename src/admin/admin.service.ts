// src/admin/admin.service.ts
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import type { Model } from "mongoose"
import type { User, UserDocument } from "../user/schemas/user.schema"
import type { AdminUserResponseDto, QueryParamsDto } from "./dto/admin-user.dto"
import type { Avatar } from "../avatar/schemas/avatar.schema" // adjust path as needed
import type { WardrobeItem } from "src/wardrobe/schemas/wardrobe.schema"
import type { UpdateUserDto } from "./dto/update-user.dto"
import type * as Multer from "multer"
import type { AwsService } from "src/aws/aws.service"
import type { AvatarService } from "src/avatar/avatar.service"
import * as bcrypt from "bcrypt"
import * as jwt from "jsonwebtoken"

@Injectable()
export class AdminService {
  private userModel: Model<UserDocument>
  private avatarModel: Model<Avatar>
  private wardrobeModel: Model<WardrobeItem>
  private AwsService: AwsService
  private AvatarService: AvatarService

  constructor(
    userModel: Model<UserDocument>,
    avatarModel: Model<Avatar>,
    wardrobeModel: Model<WardrobeItem>,
    AwsService: AwsService,
    AvatarService: AvatarService,
  ) {
    this.userModel = userModel
    this.avatarModel = avatarModel
    this.wardrobeModel = wardrobeModel
    this.AwsService = AwsService
    this.AvatarService = AvatarService
  }

  async getNewUsers(days = 7): Promise<User[]> {
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - days)

    return this.userModel
      .find({
        createdAt: { $gte: threshold },
      })
      .sort({ createdAt: -1 })
      .exec()
  }

  async getNewUserCount(days = 7): Promise<number> {
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - days)

    return this.userModel
      .countDocuments({
        createdAt: { $gte: threshold },
      })
      .exec()
  }

  async getAllUsers(queryParams: QueryParamsDto): Promise<{
    users: AdminUserResponseDto[]
    total: number
    page: number
    limit: number
  }> {
    const { page = 1, limit = 100, searchTerm, emailVerified } = queryParams
    const skip = (page - 1) * limit

    // Build filter based on query parameters
    const filter: any = {}

    // if (emailVerified !== undefined) {
    //   filter.emailVerified = emailVerified;
    // }

    if (searchTerm) {
      filter.$or = [{ name: { $regex: searchTerm, $options: "i" } }, { email: { $regex: searchTerm, $options: "i" } }]
    }

    const users = await this.userModel
      .find(filter)
      // .select('-password -otp -otpExpiry')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec()

    //  console.log(users);

    const total = await this.userModel.countDocuments(filter)

    const usersWithAvatarCount = await Promise.all(
      users.map(async (user) => {
        const avatarCount = await this.avatarModel.countDocuments({ user_id: user.userId }).exec()
        return {
          // ...this.mapToAdminUserResponse(user),
          user,
          avatarCount,
        }
      }),
    )

    return {
      // users: usersWithAvatarCount,
      users,
      total,
      page: Number(page),
      limit: Number(limit),
    }
  }

  async getUserById(userId: number): Promise<AdminUserResponseDto> {
    const user = await this.userModel.findOne({ userId }).exec()

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    const avatars = await this.avatarModel.find({ user_id: userId }).lean().exec()

    const shirts = await this.wardrobeModel.find({ user_id: userId, category: "Shirts" }).lean().exec()

    const pants = await this.wardrobeModel.find({ user_id: userId, category: "Pants" }).lean().exec()

    const shoes = await this.wardrobeModel.find({ user_id: userId, category: "Shoes" }).lean().exec()

    const accessories = await this.wardrobeModel.find({ user_id: userId, category: "Accessories" }).lean().exec()

    return {
      ...this.mapToAdminUserResponse(user),
      avatars,
      shirts,
      pants,
      shoes,
      accessories,
    }
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    const result = await this.userModel.deleteOne({ userId }).exec()

    // Delete avatars linked to the user
    await this.avatarModel.deleteMany({ user_id: userId }).exec()

    // Delete wardrobe items linked to the user
    await this.wardrobeModel.deleteMany({ user_id: userId }).exec()

    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    return { message: `User with ID ${userId} has been successfully deleted` }
  }

  async createAdminUser(email: string): Promise<AdminUserResponseDto> {
    const user = await this.userModel.findOne({ email }).exec()

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`)
    }

    user.isAdmin = true
    await user.save()

    return this.mapToAdminUserResponse(user)
  }

  async revokeAdminAccess(userId: number): Promise<AdminUserResponseDto> {
    const user = await this.userModel.findOne({ userId }).exec()

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    if (user.isAdmin) {
      user.isAdmin = false
      await user.save()
    }

    return this.mapToAdminUserResponse(user)
  }

  private mapToAdminUserResponse(user: UserDocument): AdminUserResponseDto {
    return {
      userId: user.userId,
      name: user.name,
      email: user.email,
      // phoneNo: user.phoneNo,
      profilePicture: user.profilePicture,
      gender: user.gender,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  async getAllWardrobeItems(category: string) {
    const items = await this.wardrobeModel.aggregate([{ $match: { category } }]).exec()
    console.log(items.length)

    const count = await this.wardrobeModel.countDocuments({ category }).exec()
    console.log(count)

    return {
      items,
      count,
    }
  }

  async getAllAvatars() {
    const avatars = await this.avatarModel.find().lean().exec()

    const count = await this.avatarModel.countDocuments().exec()

    return {
      avatars,
      count,
    }
  }

  async getAdminCount() {
    const count = await this.userModel.countDocuments({ isAdmin: true }).exec()

    return {
      count,
    }
  }

  async updateUser(
    userId: number,
    updateData: UpdateUserDto,
    file?: Multer.File, // Make file optional
  ): Promise<AdminUserResponseDto> {
    try {
      const user = await this.userModel.findOne({ userId }).exec()

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`)
      }

      // Handle image update only if a new file is provided
      if (file) {
        try {
          const buffer: any = await this.AvatarService.getSignupAvatar(file.path)
          const imageUrl = await this.AwsService.uploadFile(buffer, file)

          if (imageUrl) {
            user.profilePicture = imageUrl
          }
        } catch (imageError) {
          // Log the error but don't fail the entire update
          console.error("Error updating profile picture:", imageError)
          // Optionally throw if image update is critical
          // throw new BadRequestException('Failed to update profile picture');
        }
      }

      // Handle other field updates
      if (updateData) {
        // Check if email is being updated and if it already exists
        if (updateData.email && updateData.email !== user.email) {
          const existingUser = await this.userModel
            .findOne({
              email: updateData.email,
              userId: { $ne: userId }, // Exclude current user
            })
            .exec()

          if (existingUser) {
            throw new BadRequestException(`User with email ${updateData.email} already exists`)
          }
        }

        // Update only the fields that are provided and not empty
        Object.keys(updateData).forEach((key) => {
          const value = updateData[key]

          // Skip undefined, null, and empty string values
          if (value !== undefined && value !== null && value !== "") {
            // Additional check for strings to avoid updating with just whitespace
            if (typeof value === "string" && value.trim() === "") {
              return // Skip empty or whitespace-only strings
            }

            user[key] = value
          }
        })
      }

      // Only update timestamp if something actually changed
      const hasChanges =
        file ||
        (updateData &&
          Object.keys(updateData).some((key) => {
            const value = updateData[key]
            return (
              value !== undefined &&
              value !== null &&
              value !== "" &&
              (typeof value !== "string" || value.trim() !== "")
            )
          }))

      if (hasChanges) {
        user.updatedAt = new Date()
        await user.save()
      }

      return this.mapToAdminUserResponse(user)
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }

      // Handle unexpected errors
      console.error("Unexpected error in updateUser:", error)
      throw new BadRequestException("Failed to update user")
    }
  }

  async createAdmin(adminData: { email: string; password: string; name: string }) {
    const hashedPassword = await bcrypt.hash(adminData.password, 10)
    const admin = new this.userModel({
      ...adminData,
      password: hashedPassword,
      role: "admin",
    })
    return admin.save()
  }

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email, role: "admin" })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error("Invalid credentials")
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "24h" })

    return { token, user: { id: user._id, email: user.email, name: user.name } }
  }

  async createUser(createUserDto: any) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10)
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    })
    return user.save()
  }
}
