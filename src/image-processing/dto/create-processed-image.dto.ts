import { IsString, IsOptional, IsEnum } from "class-validator"

export enum ProcessType {
  BACKGROUND_REMOVAL = "background_removal",
  AVATAR_GENERATION = "avatar_generation",
  CLOTHING_PROCESSING = "clothing_processing",
  OUTFIT_GENERATION = "outfit_generation",
  BACKGROUND_GENERATION = "background_generation",
}

export class CreateProcessedImageDto {
  @IsString()
  originalImageUrl: string

  @IsString()
  @IsOptional()
  processedImageUrl?: string

  @IsEnum(ProcessType)
  processType: ProcessType

  @IsString()
  userId: string

  @IsString()
  @IsOptional()
  prompt?: string

  @IsString()
  @IsOptional()
  category?: string

  @IsOptional()
  parameters?: any

  @IsString()
  @IsOptional()
  status?: string
}
