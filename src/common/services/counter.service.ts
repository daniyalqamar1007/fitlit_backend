import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class CounterService {
  constructor(@InjectModel('Counter') private counterModel: Model<any>) {}

  async getNextSequence(name: string): Promise<number> {
    try {
      const counter = await this.counterModel.findByIdAndUpdate(
        name,
        { $inc: { sequence_value: 1 } },
        { upsert: true, new: true },
      );

      if (!counter || typeof counter.sequence_value !== 'number') {
        throw new Error('Counter update failed or invalid sequence_value');
      }

      return counter.sequence_value;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get next sequence for '${name}'`,
        error.message,
      );
    }
  }
}
