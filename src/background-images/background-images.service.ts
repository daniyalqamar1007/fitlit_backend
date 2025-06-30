import { Injectable, Logger, NotFoundException } from "@nestjs/common"
import type { Model } from "mongoose"
import type { BackgroundImageDocument } from "./schemas/background-image.schema"
import type { CreateBackgroundImageDto } from "./dto/create-background-image.dto"
import type { AwsService } from "src/aws/aws.service"
import * as fs from "fs"
import * as path from "path"
import * as sharp from "sharp"
import { v4 as uuidv4 } from "uuid"
import type { ImageProcessingService } from "../image-processing/image-processing.service"
import { Types } from "mongoose"

interface UploadedFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  destination?: string
  filename?: string
  path?: string
  buffer?: Buffer
  size: number
}

@Injectable()
export class BackgroundImagesService {
  private readonly logger = new Logger(BackgroundImagesService.name)
  private readonly MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
  private readonly TEMP_DIR = path.join(process.cwd(), "temp")

  constructor(
    private backgroundImageModel: Model<BackgroundImageDocument>,
    private awsS3Service: AwsService,
    private imageProcessingService: ImageProcessingService,
  ) {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.TEMP_DIR)) {
      fs.mkdirSync(this.TEMP_DIR, { recursive: true })
    }

    this.logger.log("BackgroundImagesService initialized with optimized processing")
  }

  private async optimizeAndSaveImage(buffer: Buffer): Promise<string> {
    try {
      // Get image metadata
      const metadata = await sharp(buffer).metadata()

      // Calculate new dimensions while maintaining aspect ratio
      let width = metadata.width
      let height = metadata.height
      const maxDimension = 512 // Reduced from 1024 to 512

      if (width && height) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      // Generate unique filename
      const filename = `${uuidv4()}.jpg`
      const outputPath = path.join(this.TEMP_DIR, filename)

      // Resize and save the image with more aggressive compression
      await sharp(buffer)
        .resize(width, height)
        .jpeg({
          quality: 80, // Reduced quality
          mozjpeg: true, // Use mozjpeg for better compression
          chromaSubsampling: "4:2:0", // More aggressive chroma subsampling
        })
        .toFile(outputPath)

      // Verify the file size
      const stats = fs.statSync(outputPath)
      if (stats.size > this.MAX_FILE_SIZE) {
        // If still too large, try even more aggressive compression
        await sharp(outputPath)
          .jpeg({
            quality: 40,
            mozjpeg: true,
            chromaSubsampling: "4:2:0",
          })
          .toFile(outputPath)
      }

      return outputPath
    } catch (error) {
      this.logger.error("Error optimizing image:", error)
      throw new Error("Failed to process image")
    }
  }

  async create(createBackgroundImageDto: CreateBackgroundImageDto): Promise<BackgroundImageDocument> {
    const backgroundImage = new this.backgroundImageModel(createBackgroundImageDto)
    return backgroundImage.save()
  }

  async findAll(): Promise<BackgroundImageDocument[]> {
    return this.backgroundImageModel.find().sort({ createdAt: -1 }).exec()
  }

  async findActive(): Promise<BackgroundImageDocument[]> {
    return this.backgroundImageModel.find({ isActive: true }).sort({ createdAt: -1 }).exec()
  }

  async findOne(id: string): Promise<BackgroundImageDocument> {
    const backgroundImage = await this.backgroundImageModel.findById(id).exec()
    if (!backgroundImage) {
      throw new NotFoundException(`Background image with ID ${id} not found`)
    }
    return backgroundImage
  }

  async changeStatus(id: string, isActive: boolean): Promise<BackgroundImageDocument> {
    const backgroundImage = await this.backgroundImageModel.findByIdAndUpdate(id, { isActive }, { new: true }).exec()

    if (!backgroundImage) {
      throw new NotFoundException(`Background image with ID ${id} not found`)
    }

    return backgroundImage
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.backgroundImageModel.findByIdAndDelete(id).exec()
    return !!result
  }

  async generateBackground(prompt: string, userId: string): Promise<any> {
    try {
      const result = await this.imageProcessingService.generateBackgroundImage(prompt)

      if (result && typeof result !== "boolean") {
        // Save generated background to database
        const backgroundImage = new this.backgroundImageModel({
          name: `Generated: ${prompt.substring(0, 50)}...`,
          imageUrl: "data:image/png;base64," + result.toString("base64"),
          category: "generated",
          createdBy: userId,
          isActive: true,
        })

        await backgroundImage.save()

        return {
          success: true,
          backgroundImage,
          message: "Background generated successfully",
        }
      }

      return {
        success: false,
        message: "Background generation failed",
      }
    } catch (error) {
      console.error("Background generation error:", error)
      return {
        success: false,
        message: "Background generation failed",
        error: error.message,
      }
    }
  }

  async createFromPrompt(userId: string, dto: CreateBackgroundImageDto) {
    try {
      if (!dto.prompt) {
        throw new Error("Prompt is required")
      }

      const result = await this.imageProcessingService.generateBackgroundImage(dto.prompt)

      if (result && typeof result !== "boolean") {
        // Upload to S3
        const imageUrl = await this.awsS3Service.uploadFile(result, { originalname: "background.png" } as any)

        await this.backgroundImageModel.updateMany({ user_id: userId }, { $set: { status: false } })

        // Save to database
        const created = new this.backgroundImageModel({
          user_id: userId,
          image_url: imageUrl,
          status: true,
        })

        await created.save()

        return {
          success: true,
          image_url: imageUrl,
        }
      }

      return {
        success: false,
        message: "Failed to generate image",
      }
    } catch (error) {
      this.logger.error("Error creating background image:", error)
      return {
        success: false,
        message: error.message,
      }
    }
  }

  async createFromImage(userId: string, file: UploadedFile) {
    let tempFilePath: string | null = null

    try {
      if (!file || (!file.buffer && !file.path)) {
        throw new Error("No file uploaded")
      }

      let imageBuffer: Buffer

      if (file.buffer) {
        imageBuffer = file.buffer
      } else if (file.path) {
        imageBuffer = fs.readFileSync(file.path)
      } else {
        throw new Error("Invalid file format")
      }

      // Check file size
      if (imageBuffer.length > this.MAX_FILE_SIZE * 4) {
        throw new Error("File size too large. Maximum size is 8MB")
      }

      // Optimize and save image to temp file
      tempFilePath = await this.optimizeAndSaveImage(imageBuffer)

      // Use the new image processing service for background processing
      const result = await this.imageProcessingService.generateBackgroundImage(
        "Transform this image into a professional background suitable for avatar display",
      )

      if (result && typeof result !== "boolean") {
        // Upload to S3
        const imageUrl = await this.awsS3Service.uploadFile(result, { originalname: "background.png" } as any)

        // Save to database
        await this.backgroundImageModel.updateMany({ user_id: userId }, { $set: { status: false } })

        const created = new this.backgroundImageModel({
          user_id: userId,
          image_url: imageUrl,
          status: true,
        })

        await created.save()

        return {
          success: true,
          image_url: imageUrl,
        }
      }

      return {
        success: false,
        message: "Failed to process image",
      }
    } catch (error) {
      this.logger.error("Error processing background image:", error)
      return {
        success: false,
        message: error.message,
      }
    } finally {
      // Clean up temporary files
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path)
      }
    }
  }

  async getAllUserBackgroundImages(userId: string) {
    try {
      // First verify if the user ID is valid
      if (!userId || !Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID")
      }

      // Log the query parameters for debugging
      console.log("Searching for images with user ID:", userId)

      const images = await this.backgroundImageModel
        .find({ user_id: userId })
        .select("image_url status")
        .sort({ createdAt: -1 })

      // Log the query results for debugging
      console.log("Found images:", images)
      console.log("Number of images found:", images.length)
      return {
        success: true,
        images: images.map((img) => ({
          id: img._id,
          image_url: img.image_url,
          status: img.status,
        })),
      }
    } catch (error) {
      this.logger.error("Error fetching background images:", error)
      return {
        success: false,
        message: error.message,
      }
    }
  }

  async changeBackgroundStatus(userId: string, backgroundImageId: string) {
    try {
      console.log("Service received userId:", userId)
      console.log("Service received backgroundImageId:", backgroundImageId)

      // Convert userId to number since that's how it's stored in the database
      const userIdNum = Number.parseInt(userId, 10)
      console.log("userIdNum", userIdNum)

      // Verify if the user ID and background image ID are valid
      if (!userIdNum || isNaN(userIdNum)) {
        throw new Error("Invalid user ID")
      }
      if (!backgroundImageId || !Types.ObjectId.isValid(backgroundImageId)) {
        throw new Error("Invalid background image ID")
      }

      // First check if the image exists and belongs to the user
      const existingImage = await this.backgroundImageModel.findOne({
        _id: new Types.ObjectId(backgroundImageId),
        user_id: userIdNum,
      })
      console.log("existingImage", existingImage)

      if (!existingImage) {
        throw new Error("Background image not found or does not belong to user")
      }

      // Set all user's background images to false
      const updateManyResult = await this.backgroundImageModel.updateMany(
        { user_id: userIdNum },
        { $set: { status: false } },
      )
      console.log("Update many result:", updateManyResult)

      // Update the specific image to true
      const updatedImage = await this.backgroundImageModel.findByIdAndUpdate(
        new Types.ObjectId(backgroundImageId),
        { $set: { status: true } },
        { new: true },
      )
      console.log("Updated image:", updatedImage)

      if (!updatedImage) {
        throw new Error("Failed to update background image status")
      }

      // Verify the update
      const verifyImage = await this.backgroundImageModel.findById(backgroundImageId)
      console.log("Verification after update:", verifyImage)

      return {
        success: true,
        message: "Background image status updated successfully",
        image: {
          id: updatedImage._id,
          image_url: updatedImage.image_url,
          status: updatedImage.status,
        },
      }
    } catch (error) {
      this.logger.error("Error changing background image status:", error)
      throw error
    }
  }
}
