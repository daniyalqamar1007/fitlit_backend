import { Injectable, Logger } from "@nestjs/common"
import type { Model } from "mongoose"
import type { ProcessedImage, ProcessedImageDocument } from "./schemas/processed-image.schema"
import type { ImageCache, ImageCacheDocument } from "./schemas/image-cache.schema"
import type { AwsService } from "../aws/aws.service"
import * as crypto from "crypto"
import * as fs from "fs"
import * as sharp from "sharp"
import axios from "axios"

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name)
  private readonly replicateApiKey = process.env.REPLICATE_API_TOKEN
  private readonly removeApiKey = "vur1J4WkuezAiJUJJB78bs8R" // Your Remove.bg API Key

  private processedImageModel: Model<ProcessedImageDocument>
  private imageCacheModel: Model<ImageCacheDocument>
  private awsService: AwsService

  constructor(
    processedImageModel: Model<ProcessedImageDocument>,
    imageCacheModel: Model<ImageCacheDocument>,
    awsService: AwsService,
  ) {
    this.processedImageModel = processedImageModel
    this.imageCacheModel = imageCacheModel
    this.awsService = awsService

    if (!this.replicateApiKey) {
      this.logger.warn("REPLICATE_API_TOKEN is not set! Using fallback processing.")
    }
  }

  // CRUD Operations for ProcessedImage
  async createProcessedImage(data: Partial<ProcessedImage>): Promise<ProcessedImage> {
    const processedImage = new this.processedImageModel(data)
    return processedImage.save()
  }

  async getProcessedImage(id: string): Promise<ProcessedImage | null> {
    return this.processedImageModel.findById(id).exec()
  }

  async updateProcessedImage(id: string, data: Partial<ProcessedImage>): Promise<ProcessedImage | null> {
    return this.processedImageModel.findByIdAndUpdate(id, data, { new: true }).exec()
  }

  async deleteProcessedImage(id: string): Promise<boolean> {
    const result = await this.processedImageModel.findByIdAndDelete(id).exec()
    return !!result
  }

  async getAllProcessedImages(userId?: string): Promise<ProcessedImage[]> {
    const query = userId ? { userId } : {}
    return this.processedImageModel.find(query).sort({ createdAt: -1 }).exec()
  }

  // CRUD Operations for ImageCache
  async createImageCache(data: Partial<ImageCache>): Promise<ImageCache> {
    const imageCache = new this.imageCacheModel(data)
    return imageCache.save()
  }

  async getImageCache(hash: string): Promise<ImageCache | null> {
    return this.imageCacheModel.findOne({ hash }).exec()
  }

  async updateImageCache(hash: string, data: Partial<ImageCache>): Promise<ImageCache | null> {
    return this.imageCacheModel.findOneAndUpdate({ hash }, data, { new: true }).exec()
  }

  async deleteImageCache(hash: string): Promise<boolean> {
    const result = await this.imageCacheModel.findOneAndDelete({ hash }).exec()
    return !!result
  }

  async clearExpiredCache(): Promise<number> {
    const expiredDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    const result = await this.imageCacheModel
      .deleteMany({
        createdAt: { $lt: expiredDate },
      })
      .exec()
    return result.deletedCount
  }

  // Generate hash for caching
  private generateHash(input: string | Buffer): string {
    return crypto.createHash("md5").update(input).digest("hex")
  }

  // Fast background removal using Remove.bg API
  async removeBackground(input: string | Buffer, type: "Path" | "Buffer"): Promise<Buffer> {
    try {
      let base64Image: string
      let hash: string

      if (type === "Path") {
        const imageBuffer = fs.readFileSync(input as string)
        base64Image = imageBuffer.toString("base64")
        hash = this.generateHash(imageBuffer)
      } else {
        base64Image = (input as Buffer).toString("base64")
        hash = this.generateHash(input as Buffer)
      }

      // Check cache first
      const cached = await this.getImageCache(hash)
      if (cached && cached.processedImageUrl) {
        this.logger.log("Using cached background removal result")
        const response = await axios.get(cached.processedImageUrl, { responseType: "arraybuffer" })
        return Buffer.from(response.data)
      }

      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": this.removeApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_file_b64: base64Image,
          size: "auto",
        }),
      })

      if (!response.ok) {
        throw new Error(`Remove.bg API failed: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const resultBuffer = Buffer.from(arrayBuffer)

      // Cache the result
      const imageUrl = await this.awsService.uploadFile(resultBuffer, { originalname: "cached-bg-removal.png" } as any)
      await this.createImageCache({
        hash,
        processedImageUrl: imageUrl,
        processType: "background_removal",
      })

      return resultBuffer
    } catch (error) {
      this.logger.error("Background removal failed:", error)
      throw error
    }
  }

  // Fast avatar generation using Replicate API
  async generateAvatar(filePath: string, prompt?: string): Promise<Buffer | boolean> {
    try {
      const imageBuffer = fs.readFileSync(filePath)
      const hash = this.generateHash(imageBuffer)

      // Check cache first
      const cached = await this.getImageCache(hash)
      if (cached && cached.processedImageUrl) {
        this.logger.log("Using cached avatar generation result")
        const response = await axios.get(cached.processedImageUrl, { responseType: "arraybuffer" })
        return Buffer.from(response.data)
      }

      if (!this.replicateApiKey) {
        // Fallback to basic processing
        return this.fallbackAvatarProcessing(imageBuffer)
      }

      // Use Replicate API for faster processing
      const base64Image = imageBuffer.toString("base64")

      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Token ${this.replicateApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b", // InstantID model
          input: {
            image: `data:image/jpeg;base64,${base64Image}`,
            prompt:
              prompt ||
              "Transform this person into a full-body 3D digital avatar with clean lines, realistic proportions, and transparent background",
            negative_prompt: "blurry, low quality, distorted",
            num_inference_steps: 20,
            guidance_scale: 7.5,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Replicate API failed: ${response.status}`)
      }

      const prediction = await response.json()

      // Poll for completion (Replicate is async)
      const result = await this.pollReplicateResult(prediction.id)

      if (result && result.output) {
        const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output
        const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" })
        const resultBuffer = Buffer.from(imageResponse.data)

        // Cache the result
        const cachedUrl = await this.awsService.uploadFile(resultBuffer, { originalname: "cached-avatar.png" } as any)
        await this.createImageCache({
          hash,
          processedImageUrl: cachedUrl,
          processType: "avatar_generation",
        })

        return resultBuffer
      }

      return false
    } catch (error) {
      this.logger.error("Avatar generation failed:", error)
      return this.fallbackAvatarProcessing(fs.readFileSync(filePath))
    }
  }

  // Fast outfit generation using multiple models
  async generateOutfit(imageUrls: string[], profilePicture: string): Promise<Buffer | boolean> {
    try {
      const combinedHash = this.generateHash(imageUrls.join("") + profilePicture)

      // Check cache first
      const cached = await this.getImageCache(combinedHash)
      if (cached && cached.processedImageUrl) {
        this.logger.log("Using cached outfit generation result")
        const response = await axios.get(cached.processedImageUrl, { responseType: "arraybuffer" })
        return Buffer.from(response.data)
      }

      if (!this.replicateApiKey) {
        return this.fallbackOutfitProcessing(imageUrls, profilePicture)
      }

      // Download all images
      const imageBuffers = await Promise.all([
        ...imageUrls.map((url) => this.downloadImage(url)),
        this.downloadImage(profilePicture),
      ])

      // Use Replicate's ControlNet for outfit generation
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Token ${this.replicateApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", // ControlNet model
          input: {
            image: `data:image/jpeg;base64,${imageBuffers[imageBuffers.length - 1].toString("base64")}`,
            prompt: "Full body 3D avatar wearing the provided clothing items, clean background, high quality",
            num_inference_steps: 20,
            guidance_scale: 7.5,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Replicate API failed: ${response.status}`)
      }

      const prediction = await response.json()
      const result = await this.pollReplicateResult(prediction.id)

      if (result && result.output) {
        const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output
        const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" })
        const resultBuffer = Buffer.from(imageResponse.data)

        // Cache the result
        const cachedUrl = await this.awsService.uploadFile(resultBuffer, { originalname: "cached-outfit.png" } as any)
        await this.createImageCache({
          hash: combinedHash,
          processedImageUrl: cachedUrl,
          processType: "outfit_generation",
        })

        return resultBuffer
      }

      return false
    } catch (error) {
      this.logger.error("Outfit generation failed:", error)
      return this.fallbackOutfitProcessing(imageUrls, profilePicture)
    }
  }

  // Fast clothing item processing
  async processClothingItem(filePath: string, category: string): Promise<Buffer | boolean> {
    try {
      const imageBuffer = fs.readFileSync(filePath)
      const hash = this.generateHash(imageBuffer + category)

      // Check cache first
      const cached = await this.getImageCache(hash)
      if (cached && cached.processedImageUrl) {
        this.logger.log("Using cached clothing processing result")
        const response = await axios.get(cached.processedImageUrl, { responseType: "arraybuffer" })
        return Buffer.from(response.data)
      }

      if (!this.replicateApiKey) {
        return this.fallbackClothingProcessing(imageBuffer, category)
      }

      const base64Image = imageBuffer.toString("base64")

      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Token ${this.replicateApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b",
          input: {
            image: `data:image/jpeg;base64,${base64Image}`,
            prompt: `Convert this ${category} into a detailed 3D model, preserving fabric texture and design, transparent background`,
            negative_prompt: "background, person, model, blurry",
            num_inference_steps: 15,
            guidance_scale: 7.0,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Replicate API failed: ${response.status}`)
      }

      const prediction = await response.json()
      const result = await this.pollReplicateResult(prediction.id)

      if (result && result.output) {
        const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output
        const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" })
        const resultBuffer = Buffer.from(imageResponse.data)

        // Cache the result
        const cachedUrl = await this.awsService.uploadFile(resultBuffer, { originalname: "cached-clothing.png" } as any)
        await this.createImageCache({
          hash,
          processedImageUrl: cachedUrl,
          processType: "clothing_processing",
        })

        return resultBuffer
      }

      return false
    } catch (error) {
      this.logger.error("Clothing processing failed:", error)
      return this.fallbackClothingProcessing(fs.readFileSync(filePath), category)
    }
  }

  // Helper method to poll Replicate results
  private async pollReplicateResult(predictionId: string, maxAttempts = 30): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          Authorization: `Token ${this.replicateApiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get prediction status: ${response.status}`)
      }

      const result = await response.json()

      if (result.status === "succeeded") {
        return result
      } else if (result.status === "failed") {
        throw new Error("Prediction failed")
      }

      // Wait 2 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    throw new Error("Prediction timed out")
  }

  // Helper method to download images
  private async downloadImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: "arraybuffer" })
    return Buffer.from(response.data)
  }

  // Fallback processing methods using Sharp for basic operations
  private async fallbackAvatarProcessing(imageBuffer: Buffer): Promise<Buffer> {
    try {
      // Basic image processing with Sharp
      const processedBuffer = await sharp(imageBuffer)
        .resize(1024, 1536, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()

      return processedBuffer
    } catch (error) {
      this.logger.error("Fallback avatar processing failed:", error)
      return imageBuffer
    }
  }

  private async fallbackClothingProcessing(imageBuffer: Buffer, category: string): Promise<Buffer> {
    try {
      // Basic clothing processing
      const processedBuffer = await sharp(imageBuffer)
        .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()

      return processedBuffer
    } catch (error) {
      this.logger.error("Fallback clothing processing failed:", error)
      return imageBuffer
    }
  }

  private async fallbackOutfitProcessing(imageUrls: string[], profilePicture: string): Promise<Buffer> {
    try {
      // Download profile picture and create a basic composite
      const profileBuffer = await this.downloadImage(profilePicture)

      const processedBuffer = await sharp(profileBuffer)
        .resize(1024, 1536, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()

      return processedBuffer
    } catch (error) {
      this.logger.error("Fallback outfit processing failed:", error)
      const profileBuffer = await this.downloadImage(profilePicture)
      return profileBuffer
    }
  }

  // Background image generation
  async generateBackgroundImage(prompt: string): Promise<Buffer | boolean> {
    try {
      const hash = this.generateHash(prompt)

      // Check cache first
      const cached = await this.getImageCache(hash)
      if (cached && cached.processedImageUrl) {
        this.logger.log("Using cached background generation result")
        const response = await axios.get(cached.processedImageUrl, { responseType: "arraybuffer" })
        return Buffer.from(response.data)
      }

      if (!this.replicateApiKey) {
        // Return a solid color background as fallback
        const fallbackBuffer = await sharp({
          create: {
            width: 1024,
            height: 1024,
            channels: 4,
            background: { r: 135, g: 206, b: 235, alpha: 1 }, // Sky blue
          },
        })
          .png()
          .toBuffer()

        return fallbackBuffer
      }

      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Token ${this.replicateApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4", // SDXL model
          input: {
            prompt: prompt,
            negative_prompt: "low quality, blurry, distorted",
            num_inference_steps: 20,
            guidance_scale: 7.5,
            width: 1024,
            height: 1024,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Replicate API failed: ${response.status}`)
      }

      const prediction = await response.json()
      const result = await this.pollReplicateResult(prediction.id)

      if (result && result.output) {
        const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output
        const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" })
        const resultBuffer = Buffer.from(imageResponse.data)

        // Cache the result
        const cachedUrl = await this.awsService.uploadFile(resultBuffer, {
          originalname: "cached-background.png",
        } as any)
        await this.createImageCache({
          hash,
          processedImageUrl: cachedUrl,
          processType: "background_generation",
        })

        return resultBuffer
      }

      return false
    } catch (error) {
      this.logger.error("Background generation failed:", error)
      return false
    }
  }
}
