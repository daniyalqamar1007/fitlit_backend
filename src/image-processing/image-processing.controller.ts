import { Controller, Get, Post, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFile } from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import type { ImageProcessingService } from "./image-processing.service"
import type { CreateProcessedImageDto } from "./dto/create-processed-image.dto"
import type { UpdateProcessedImageDto } from "./dto/update-processed-image.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import type { RequestWithUser } from "../interfaces/interface"
import { multerOptions } from "../aws/aws.multer.config"
import type { Express } from "express"

@Controller("image-processing")
export class ImageProcessingController {
  constructor(private readonly imageProcessingService: ImageProcessingService) {}

  @UseGuards(JwtAuthGuard)
  @Post("processed-images")
  async createProcessedImage(createDto: CreateProcessedImageDto, @Req() req: RequestWithUser) {
    return this.imageProcessingService.createProcessedImage({
      ...createDto,
      userId: req.user.userId,
    })
  }

  @UseGuards(JwtAuthGuard)
  @Get('processed-images')
  async getAllProcessedImages(@Req() req: RequestWithUser) {
    return this.imageProcessingService.getAllProcessedImages(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('processed-images/:id')
  async getProcessedImage(@Param('id') id: string) {
    return this.imageProcessingService.getProcessedImage(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("processed-images/:id")
  async updateProcessedImage(@Param('id') id: string, updateDto: UpdateProcessedImageDto) {
    return this.imageProcessingService.updateProcessedImage(id, updateDto)
  }

  @UseGuards(JwtAuthGuard)
  @Delete('processed-images/:id')
  async deleteProcessedImage(@Param('id') id: string) {
    return this.imageProcessingService.deleteProcessedImage(id);
  }

  @Post('remove-background')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async removeBackground(@UploadedFile() file: Express.Multer.File) {
    const result = await this.imageProcessingService.removeBackground(file.buffer, 'Buffer');
    return { success: true, processedImage: result.toString('base64') };
  }

  @Post("generate-avatar")
  @UseInterceptors(FileInterceptor("file", multerOptions))
  async generateAvatar(@UploadedFile() file: Express.Multer.File, body: { prompt?: string }) {
    // Save file temporarily
    const fs = require("fs")
    const path = require("path")
    const tempPath = path.join("./uploads", `temp-${Date.now()}-${file.originalname}`)
    fs.writeFileSync(tempPath, file.buffer)

    try {
      const result = await this.imageProcessingService.generateAvatar(tempPath, body.prompt)

      // Clean up temp file
      fs.unlinkSync(tempPath)

      if (result && typeof result !== "boolean") {
        return { success: true, processedImage: result.toString("base64") }
      }
      return { success: false, message: "Avatar generation failed" }
    } catch (error) {
      // Clean up temp file on error
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath)
      }
      throw error
    }
  }

  @Get("cache/stats")
  async getCacheStats() {
    const totalCached = await this.imageProcessingService["imageCacheModel"].countDocuments()
    const recentHits = await this.imageProcessingService["imageCacheModel"]
      .find({ hitCount: { $gt: 0 } })
      .sort({ hitCount: -1 })
      .limit(10)

    return {
      totalCached,
      recentHits: recentHits.length,
      topCached: recentHits,
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("cache/clear")
  async clearExpiredCache() {
    const deletedCount = await this.imageProcessingService.clearExpiredCache()
    return { message: `Cleared ${deletedCount} expired cache entries` }
  }

  @Get("health")
  async getHealth() {
    return {
      status: "ok",
      services: {
        replicate: !!process.env.REPLICATE_API_TOKEN,
        removeBackground: true,
        aws: !!process.env.AWS_ACCESS_KEY,
      },
      timestamp: new Date().toISOString(),
    }
  }
}
