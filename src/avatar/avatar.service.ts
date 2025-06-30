import { Injectable, Logger } from "@nestjs/common"
import type { CreateAvatarDto } from "./dto/create-avatar.dto"
import * as fs from "fs"
import * as path from "path"
import { type Model, Types } from "mongoose"
import type { AvatarDocument } from "./schemas/avatar.schema"
import type { WardrobeItemDocument } from "../wardrobe/schemas/wardrobe.schema"
import * as sharp from "sharp"
import type { AwsService } from "src/aws/aws.service"
import type { NotificationService } from "../notifications/notification.service"
import type { ImageProcessingService } from "../image-processing/image-processing.service"

type InputType = "Path" | "Buffer"

interface UserSwipeState {
  swipeIndex: number
  previous: { avatar: string }[]
  next: { avatar: string }[]
  currentOutfit: {
    shirt_id?: string
    accessories_id?: string
    pant_id?: string
    shoe_id?: string
  }
}

@Injectable()
export class AvatarService {
  private readonly apiKey = "vur1J4WkuezAiJUJJB78bs8R" // Your Remove.bg API Key
  private userSwipeStates = new Map<string, UserSwipeState>()
  private readonly logger = new Logger(AvatarService.name)

  private awsS3Service: AwsService
  private notificationService: NotificationService
  private imageProcessingService: ImageProcessingService

  constructor(
    private avatarModel: Model<AvatarDocument>,
    private wardropeModel: Model<WardrobeItemDocument>,
    awsS3Service: AwsService,
    notificationService: NotificationService,
    imageProcessingService: ImageProcessingService,
  ) {
    this.awsS3Service = awsS3Service
    this.notificationService = notificationService
    this.imageProcessingService = imageProcessingService
    this.logger.log("AvatarService initialized with all dependencies")
  }

  async saveavatar(dto: CreateAvatarDto, userId: string, stackimage?: any) {
    try {
      let stackimageUrl = ""
      if (stackimage) {
        const buffer = stackimage.buffer || (stackimage.path ? fs.readFileSync(stackimage.path) : null)
        if (!buffer) {
          throw new Error("Invalid stackimage: no buffer or path found")
        }
        stackimageUrl = await this.awsS3Service.uploadFile(buffer, { originalname: userId + "_stackimage.png" } as any)
      }
      console.log("stackimageUrl", stackimageUrl)
      console.log("dto", dto)
      const created = new this.avatarModel({
        user_id: userId,
        shirt_id: new Types.ObjectId(dto.shirt_id),
        pant_id: new Types.ObjectId(dto.pant_id),
        shoe_id: new Types.ObjectId(dto.shoe_id),
        backgroundimageurl: dto.backgroundimageurl,
        accessories_id: new Types.ObjectId(dto.accessories_id),
        stored_message: dto.stored_message,
        avatarUrl: dto.avatarUrl,
        date: dto.date,
        stackimage: stackimageUrl,
      })

      await created.save()
      console.log("all data is saved")

      return {
        success: true,
        message: "Avatar saved successfully",
        avatarUrl: dto.avatarUrl,
        backgroundimageurl: dto.backgroundimageurl,
        stackimage: stackimageUrl,
      }
    } catch (error) {
      throw new Error(`Failed to save avatar: ${error.message}`)
    }
  }

  async checkAvailability(id: string, date: string) {
    console.log(date)
    console.log(id)
    const avatar = await this.avatarModel.findOne({ user_id: id, date })
    console.log(avatar)

    if (avatar) {
      return {
        success: true,
        avatarUrl: avatar.avatarUrl,
        backgroundimageurl: avatar.backgroundimageurl,
        stackimage: avatar.stackimage,
      }
    } else {
      return {
        success: false,
        message: "Not saved yet",
        index: 1,
      }
    }
  }

  async getAvatarsByDate(userId: string) {
    try {
      const avatars = await this.avatarModel
        .find({
          user_id: userId,
          date: { $exists: true, $ne: null },
        })
        .select("avatarUrl date stored_message backgroundimageurl stackimage")
        .sort({ date: -1 })
        .lean()

      return {
        success: true,
        data: avatars.map((avatar) => ({
          date: avatar.date,
          avatarUrl: avatar.avatarUrl,
          stored_message: avatar.stored_message ?? "",
          backgroundimageurl: avatar.backgroundimageurl,
          stackimage: avatar.stackimage,
        })),
      }
    } catch (error) {
      throw new Error(`Error fetching avatars by date: ${error.message}`)
    }
  }

  async removeBackground(input: string | Buffer, type: InputType): Promise<Buffer> {
    return this.imageProcessingService.removeBackground(input, type)
  }

  async convertToPng(filePath: string): Promise<string | null> {
    const dir = path.dirname(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const isPng = ext === ".png"

    if (isPng) {
      console.log("File is already a PNG.")
      return filePath
    }

    console.log("File is not a PNG.")

    const baseName = path.basename(filePath).replace(/\.(png|jpe?g|webp|bmp|gif|tiff?)+$/i, "")

    const outputPath = path.join(dir, `${baseName}.png`)

    try {
      await sharp(filePath).png().toFile(outputPath)
      console.log(`Converted to PNG: ${outputPath}`)
      fs.unlinkSync(filePath)
      console.log(`Deleted original file: ${filePath}`)
      return outputPath
    } catch (err) {
      console.error("Conversion failed:", err)
      return null
    }
  }

  async getSignupAvatar(filePath: string, prompt?: string) {
    try {
      const result = await this.imageProcessingService.generateAvatar(filePath, prompt)

      if (result && typeof result !== "boolean") {
        return result
      }

      console.log("Avatar generated successfully")
      return true
    } catch (error) {
      console.error("Error during avatar processing:", error.message)
      return false
    }
  }

  generateAvatarPrompt(category?: string): string {
    const clothingMap: Record<string, string> = {
      tshirt: "a modern, fitted shirt with clean design and subtle detail",
      accessories: "minimalist yet stylish accessories with clean lines and subtle metallic highlights",
      pant: "well-fitted casual pants in a neutral tone with realistic folds",
      shoe: "stylish, casual shoes with a modern silhouette and soft shadows",
    }

    const clothingDescription = clothingMap[category!.toLowerCase()] || "casual clothing"

    return `Transform this person into a full-body 3D digital avatar wearing ${clothingDescription}. 
Ensure clean lines, realistic proportions, soft shading, and expressive but simple features. 
Maintain a balanced, stylized appearance suitable for virtual environments.`
  }

  async getUpdated3DAvatar(source: string, category: string, prompt?: string) {
    try {
      const result = await this.imageProcessingService.processClothingItem(source, category)

      if (result && typeof result !== "boolean") {
        return result
      }

      console.log("3D avatar processed successfully")
      return true
    } catch (error: any) {
      console.error("Error during 3D avatar processing:", error.message)
      return false
    }
  }

  async generateOutfit(source1: string, source5: string, source2: string, source3: string, source4: string) {
    try {
      console.log("Starting outfit generation with new service")

      const imageUrls = [source1, source5, source2, source3]
      const result = await this.imageProcessingService.generateOutfit(imageUrls, source4)

      if (result && typeof result !== "boolean") {
        return result
      }

      return false
    } catch (error) {
      console.error("Error generating outfit:", error.message)
      return false
    }
  }

  // Enhanced swipe functionality
  async swipe(dto: any, userId: string) {
    try {
      const { direction, category, itemId } = dto

      // Get or initialize user swipe state
      let userState = this.userSwipeStates.get(userId)
      if (!userState) {
        userState = {
          swipeIndex: 0,
          previous: [],
          next: [],
          currentOutfit: {},
        }
        this.userSwipeStates.set(userId, userState)
      }

      // Get the current item being swiped
      const currentItem = await this.wardropeModel.findById(itemId)
      if (!currentItem) {
        return { success: false, message: "Item not found" }
      }

      // Update current outfit based on swipe direction
      if (direction === "right") {
        // Right swipe = like/select
        userState.currentOutfit[category + "_id"] = itemId

        // Generate new avatar with updated outfit if we have all required items
        if (this.hasCompleteOutfit(userState.currentOutfit)) {
          const avatarResult = await this.generateSwipeAvatar(userState.currentOutfit, userId)
          if (avatarResult) {
            userState.previous.push({ avatar: avatarResult })
          }
        }
      }

      // Get next item for this category
      const nextItem = await this.getNextItemForCategory(userId, category, itemId)

      return {
        success: true,
        message: `Swiped ${direction} on ${category}`,
        nextItem,
        currentOutfit: userState.currentOutfit,
        hasCompleteOutfit: this.hasCompleteOutfit(userState.currentOutfit),
      }
    } catch (error) {
      console.error("Swipe error:", error)
      return {
        success: false,
        message: "Swipe operation failed",
        error: error.message,
      }
    }
  }

  private hasCompleteOutfit(outfit: any): boolean {
    return !!(outfit.shirt_id && outfit.pant_id && outfit.shoe_id)
  }

  private async generateSwipeAvatar(outfit: any, userId: string): Promise<string | null> {
    try {
      // Get all clothing items
      const [shirt, pants, shoes, accessories] = await Promise.all([
        this.wardropeModel.findById(outfit.shirt_id),
        this.wardropeModel.findById(outfit.pant_id),
        this.wardropeModel.findById(outfit.shoe_id),
        outfit.accessories_id ? this.wardropeModel.findById(outfit.accessories_id) : null,
      ])

      if (!shirt || !pants || !shoes) {
        return null
      }

      // Use the fast image processing service
      const imageUrls = [shirt.image_url, accessories?.image_url || "", pants.image_url, shoes.image_url].filter(
        Boolean,
      )

      // Get user's profile picture (you might need to implement this)
      const user = await this.getUserProfilePicture(userId)
      const profilePicture = user?.profilePicture || "default-avatar.png"

      const result = await this.imageProcessingService.generateOutfit(imageUrls, profilePicture)

      if (result && typeof result !== "boolean") {
        // Upload the generated avatar
        const avatarUrl = await this.awsS3Service.uploadFile(result, {
          originalname: `swipe-avatar-${Date.now()}.png`,
        } as any)

        return avatarUrl
      }

      return null
    } catch (error) {
      console.error("Generate swipe avatar error:", error)
      return null
    }
  }

  private async getNextItemForCategory(userId: string, category: string, currentItemId: string) {
    try {
      // Get user's wardrobe items for this category, excluding the current item
      const items = await this.wardropeModel
        .find({
          user_id: userId,
          category: category,
          _id: { $ne: currentItemId },
        })
        .limit(1)
        .exec()

      return items[0] || null
    } catch (error) {
      console.error("Get next item error:", error)
      return null
    }
  }

  private async getUserProfilePicture(userId: string) {
    // This would typically fetch from your User model
    // For now, return a placeholder
    return { profilePicture: "https://via.placeholder.com/400x600" }
  }

  async getSwipeState(userId: string) {
    const userState = this.userSwipeStates.get(userId)
    return {
      success: true,
      state: userState || {
        swipeIndex: 0,
        previous: [],
        next: [],
        currentOutfit: {},
      },
    }
  }

  async resetSwipeState(userId: string) {
    this.userSwipeStates.delete(userId)
    return {
      success: true,
      message: "Swipe state reset successfully",
    }
  }

  // Background processing function
  private async processAvatarInBackground(
    dto: {
      shirt_id: string
      accessories_id: string
      pant_id: string
      shoe_id: string
      profile_picture: string
    },
    userId: string,
  ) {
    try {
      const { shirt_id, accessories_id, pant_id, shoe_id } = dto

      const source1 = await this.wardropeModel.findOne({ _id: shirt_id }).select("image_url")
      const source5 = await this.wardropeModel.findOne({ _id: accessories_id }).select("image_url")
      const source2 = await this.wardropeModel.findOne({ _id: pant_id }).select("image_url")
      const source3 = await this.wardropeModel.findOne({ _id: shoe_id }).select("image_url")

      console.log("now starting background generation")

      const generateOutfitBuffer = await this.generateOutfit(
        source1!.image_url,
        source5!.image_url,
        source2!.image_url,
        source3!.image_url,
        dto.profile_picture,
      )

      console.log(generateOutfitBuffer)

      if (typeof generateOutfitBuffer !== "boolean") {
        const generateOutfitUrl = await this.awsS3Service.uploadFile(generateOutfitBuffer, {
          originalname: "generated-outfit.png",
        } as any)

        console.log(generateOutfitUrl)

        const created = new this.avatarModel({
          user_id: userId,
          avatarUrl: generateOutfitUrl,
          shirt_id: shirt_id,
          accessories_id: accessories_id,
          pant_id: pant_id,
          shoe_id: shoe_id,
        })

        await created.save()
        console.log("Avatar generated and saved in background")
      }
    } catch (error) {
      console.error("Background processing error:", error)
    }
  }

  async outfit(
    dto: {
      shirt_id: string
      accessories_id: string
      pant_id: string
      shoe_id: string
      profile_picture: string
    },
    userId: string,
  ) {
    try {
      const { shirt_id, accessories_id, pant_id, shoe_id } = dto

      // Check if avatar already exists
      const avatar = await this.avatarModel.findOne({
        user_id: userId,
        shirt_id,
        accessories_id,
        pant_id,
        shoe_id,
      })

      if (avatar !== null) {
        return {
          success: true,
          avatar: avatar.avatarUrl,
        }
      }

      // If avatar doesn't exist, return success immediately
      // and start background processing
      console.log("Starting background avatar generation")

      // Process in background (don't await)
      this.processAvatarInBackground(dto, userId)

      return {
        success: true,
        message: "Avatar generation started",
        status: "processing",
      }
    } catch (error) {
      console.log(error)
      return {
        success: false,
        message: "Failed to process avatar request",
        status: "error",
      }
    }
  }

  async getAllUserAvatars(userId: string) {
    try {
      const avatars = await this.avatarModel.find({ user_id: userId }).select("avatarUrl").sort({ createdAt: -1 })

      const avatarUrls = avatars.map((avatar) => avatar.avatarUrl)
      console.log(avatarUrls.length)

      return {
        success: true,
        avatars: avatarUrls,
        count: avatarUrls.length,
      }
    } catch (error) {
      throw new Error(`Failed to fetch user avatars: ${error.message}`)
    }
  }

  async getNotificationsForUser(userId: string) {
    try {
      return this.notificationService.getNotificationsForUser(userId)
    } catch (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`)
    }
  }
}

// FileLike class moved outside of AvatarService
class FileLike extends Blob {
  lastModified: number
  name: string
  constructor(buffer: Buffer, name: string, type: string) {
    super([buffer], { type })
    this.lastModified = Date.now()
    this.name = name
  }
}
