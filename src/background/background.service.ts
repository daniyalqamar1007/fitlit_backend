import { Injectable } from "@nestjs/common"
import type { Model } from "mongoose"
import type { Background, BackgroundDocument } from "./schemas/background.schema"

@Injectable()
export class BackgroundService {
  private backgroundModel: Model<BackgroundDocument>

  constructor(backgroundModel: Model<BackgroundDocument>) {
    this.backgroundModel = backgroundModel
  }

  async create(backgroundData: Partial<Background>): Promise<Background> {
    const background = new this.backgroundModel(backgroundData)
    return background.save()
  }

  async findAll(): Promise<Background[]> {
    return this.backgroundModel.find().exec()
  }

  async findOne(id: string): Promise<Background> {
    return this.backgroundModel.findById(id).exec()
  }

  async update(id: string, backgroundData: Partial<Background>): Promise<Background> {
    return this.backgroundModel.findByIdAndUpdate(id, backgroundData, { new: true }).exec()
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.backgroundModel.findByIdAndDelete(id).exec()
    return !!result
  }
}
