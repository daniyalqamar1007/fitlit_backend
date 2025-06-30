import { Injectable } from "@nestjs/common"
import type { Model } from "mongoose"
import type { CounterDocument } from "../schemas/counter.schemas"

@Injectable()
export class CounterService {
  private counterModel: Model<CounterDocument>

  constructor(counterModel: Model<CounterDocument>) {
    this.counterModel = counterModel
  }

  async getNextSequence(name: string): Promise<number> {
    const counter = await this.counterModel.findOneAndUpdate(
      { name },
      { $inc: { value: 1 } },
      { new: true, upsert: true },
    )
    return counter.value
  }

  async getCurrentValue(name: string): Promise<number> {
    const counter = await this.counterModel.findOne({ name })
    return counter ? counter.value : 0
  }

  async resetCounter(name: string): Promise<void> {
    await this.counterModel.findOneAndUpdate({ name }, { value: 0 }, { upsert: true })
  }
}
