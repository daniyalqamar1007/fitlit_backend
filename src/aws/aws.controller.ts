import { Controller, Post, UseInterceptors } from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import type { AwsService } from "./aws.service"
import { multerOptions } from "./aws.multer.config"
import type { Express } from "express"

@Controller("aws")
export class AwsController {
  constructor(private readonly awsService: AwsService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file", multerOptions))
  async uploadFile(file: Express.Multer.File) {
    return this.awsService.uploadFile(file.buffer, file)
  }

  @Post("delete")
  async deleteFile(url: string) {
    return this.awsService.deleteFile(url)
  }
}
