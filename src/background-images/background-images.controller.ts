import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from "@nestjs/common"
import type { BackgroundImagesService } from "./background-images.service"
import type { CreateBackgroundImageDto } from "./dto/create-background-image.dto"
import type { ChangeBackgroundStatusDto } from "./dto/change-background-status.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import type { RequestWithUser } from "../interfaces/interface"

@Controller("background-images")
export class BackgroundImagesController {
  constructor(private readonly backgroundImagesService: BackgroundImagesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(createBackgroundImageDto: CreateBackgroundImageDto) {
    return this.backgroundImagesService.create(createBackgroundImageDto)
  }

  @Get()
  findAll() {
    return this.backgroundImagesService.findAll()
  }

  @Get("active")
  findActive() {
    return this.backgroundImagesService.findActive()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.backgroundImagesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/status")
  changeStatus(@Param('id') id: string, @Body() changeStatusDto: ChangeBackgroundStatusDto) {
    return this.backgroundImagesService.changeStatus(id, changeStatusDto.isActive)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.backgroundImagesService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("generate")
  async generateBackground(@Body() dto: { prompt: string }, @Req() req: RequestWithUser) {
    return this.backgroundImagesService.generateBackground(dto.prompt, req.user.userId)
  }
}
