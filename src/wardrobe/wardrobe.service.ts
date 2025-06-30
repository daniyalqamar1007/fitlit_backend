import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import type { Model, Types } from "mongoose"
import type { WardrobeItem, WardrobeItemDocument } from "./schemas/wardrobe.schema"
import type { AvatarService } from "src/avatar/avatar.service"
import type { AwsService } from "src/aws/aws.service"
import * as fs from "fs"
import type { ImageProcessingService } from "../image-processing/image-processing.service"

type SwipeItem = { _id: Types.ObjectId; avatar?: string }

type SwipeState = {
  leftSwipe: SwipeItem[]
  rightSwipe: SwipeItem[]
  index: number
}

type UserSwipeState = {
  shirt: SwipeState
  pants: SwipeState
  shoes: SwipeState
  accessories: SwipeState
}

@Injectable()
export class WardrobeService {
  private userSwipeState: { [userId: string]: UserSwipeState } = {}

  constructor(
    private wardrobeItemModel: Model<WardrobeItemDocument>,
    private readonly avatarService: AvatarService,
    private readonly awsS3Service: AwsService,
    private readonly imageProcessingService: ImageProcessingService,
  ) {}

  async create(userId: string, createWardrobeItemDto: any, file: any) {
    try {
      const category = createWardrobeItemDto.category
      console.log(category)
      console.log(file.path)

      // Use the new faster image processing service
      const response1 = await this.imageProcessingService.processClothingItem(file.path, category)
      console.log(response1)

      if (!response1 || typeof response1 === "boolean" || !(response1 instanceof Buffer)) {
        throw new BadRequestException("Failed to generate valid 3D clothing buffer")
      }

      const imageUrl1 = await this.awsS3Service.uploadFile(response1, file)

      const newWardrobeItem = new this.wardrobeItemModel({
        ...createWardrobeItemDto,
        user_id: userId,
        category: createWardrobeItemDto.category,
        sub_category: createWardrobeItemDto.sub_category,
        image_url: imageUrl1,
      })

      return newWardrobeItem.save()
    } catch (error) {
      throw new BadRequestException(error.message)
    } finally {
      fs.unlink(file.path, (err: any) => {
        if (err) {
          console.log("File deletion error:", err)
        }
      })
    }
  }

  // Enhanced swipe functionality
  async swipe(userId: string, dto: any, file?: any) {
    try {
      const { swipeCategory, direction, itemId } = dto

      // Initialize user swipe state if not exists
      if (!this.userSwipeState[userId]) {
        this.userSwipeState[userId] = {
          shirt: { leftSwipe: [], rightSwipe: [], index: 0 },
          pants: { leftSwipe: [], rightSwipe: [], index: 0 },
          shoes: { leftSwipe: [], rightSwipe: [], index: 0 },
          accessories: { leftSwipe: [], rightSwipe: [], index: 0 },
        }
      }

      const userState = this.userSwipeState[userId]
      const categoryState = userState[swipeCategory as keyof UserSwipeState]

      if (!categoryState) {
        throw new BadRequestException("Invalid swipe category")
      }

      // Get the item being swiped
      const item = await this.wardrobeItemModel.findById(itemId)
      if (!item) {
        throw new NotFoundException("Wardrobe item not found")
      }

      // Process the swipe
      if (direction === "left") {
        categoryState.leftSwipe.push({ _id: item._id })
      } else if (direction === "right") {
        categoryState.rightSwipe.push({ _id: item._id })

        // Generate avatar with this item if it's a right swipe
        const avatarResult = await this.generateSwipeAvatar(userId, item, swipeCategory)
        if (avatarResult) {
          categoryState.rightSwipe[categoryState.rightSwipe.length - 1].avatar = avatarResult
        }
      }

      // Get next item for swiping
      const nextItem = await this.getNextSwipeItem(userId, swipeCategory)

      return {
        success: true,
        message: `Swiped ${direction} on ${swipeCategory}`,
        nextItem,
        swipeState: categoryState,
        avatar: direction === "right" ? categoryState.rightSwipe[categoryState.rightSwipe.length - 1]?.avatar : null,
      }
    } catch (error) {
      console.error("Swipe error:", error)
      throw new BadRequestException(`Swipe failed: ${error.message}`)
    }
  }

  private async generateSwipeAvatar(userId: string, item: WardrobeItem, category: string): Promise<string | null> {
    try {
      // Use the fast image processing service to generate avatar with this clothing item
      const result = await this.imageProcessingService.processClothingItem(item.image_url, category)

      if (result && typeof result !== "boolean") {
        // Upload the processed result
        const avatarUrl = await this.awsS3Service.uploadFile(result, {
          originalname: `swipe-${category}-${Date.now()}.png`,
        } as any)

        return avatarUrl
      }

      return null
    } catch (error) {
      console.error("Generate swipe avatar error:", error)
      return null
    }
  }

  async getNextSwipeItem(userId: string, category: string) {
    try {
      // Get user's swipe state
      const userState = this.userSwipeState[userId]
      if (!userState) {
        this.userSwipeState[userId] = {
          shirt: { leftSwipe: [], rightSwipe: [], index: 0 },
          pants: { leftSwipe: [], rightSwipe: [], index: 0 },
          shoes: { leftSwipe: [], rightSwipe: [], index: 0 },
          accessories: { leftSwipe: [], rightSwipe: [], index: 0 },
        }
      }

      const categoryState = userState[category as keyof UserSwipeState]

      // Get already swiped item IDs
      const swipedIds = [
        ...categoryState.leftSwipe.map((item) => item._id),
        ...categoryState.rightSwipe.map((item) => item._id),
      ]

      // Find next unswipped item
      const nextItem = await this.wardrobeItemModel
        .findOne({
          user_id: userId,
          category: category,
          _id: { $nin: swipedIds },
        })
        .exec()

      return {
        success: true,
        item: nextItem,
        hasMore: !!nextItem,
      }
    } catch (error) {
      console.error("Get next swipe item error:", error)
      return {
        success: false,
        item: null,
        hasMore: false,
        error: error.message,
      }
    }
  }

  async getSwipeState(userId: string) {
    return {
      success: true,
      state: this.userSwipeState[userId] || {
        shirt: { leftSwipe: [], rightSwipe: [], index: 0 },
        pants: { leftSwipe: [], rightSwipe: [], index: 0 },
        shoes: { leftSwipe: [], rightSwipe: [], index: 0 },
        accessories: { leftSwipe: [], rightSwipe: [], index: 0 },
      },
    }
  }

  clearSwipeState(userId: string) {
    delete this.userSwipeState[userId]
  }

  async findAll(userId?: string, category?: string, subCategory?: string): Promise<WardrobeItem[]> {
    const query: any = {}

    if (userId) {
      query.user_id = userId
    }

    if (category) {
      query.category = category
    }

    if (subCategory) {
      query.sub_category = subCategory
    }

    return this.wardrobeItemModel.find(query).exec()
  }

  async findOne(id: string): Promise<WardrobeItem> {
    const wardrobeItem = await this.wardrobeItemModel.findById(id).exec()
    if (!wardrobeItem) {
      throw new NotFoundException(`Wardrobe item with ID ${id} not found`)
    }
    return wardrobeItem
  }

  async remove(id: string, userId: string): Promise<boolean> {
    // First check if the item exists at all
    const item = await this.wardrobeItemModel.findById(id).exec()
    if (!item) {
      throw new NotFoundException(`Wardrobe item with ID ${id} not found`)
    }

    // Then delete by ID only, without checking user ID
    const result = await this.wardrobeItemModel
      .deleteOne({
        _id: id,
      })
      .exec()

    return true
  }
}

export interface SwipeResponse {
  avatar: string | null
}
