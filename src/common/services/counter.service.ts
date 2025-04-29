import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class CounterService {
  constructor(@InjectModel('Counter') private counterModel: Model<any>) {}

  async getNextSequence(name: string): Promise<number> {
    const counter = await this.counterModel.findByIdAndUpdate(
      name,
      { $inc: { sequence_value: 1 } },
      { upsert: true, new: true },
    );
    return counter.sequence_value;
  }
}
