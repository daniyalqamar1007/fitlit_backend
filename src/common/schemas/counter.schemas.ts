import { Schema } from 'mongoose';

export const CounterSchema = new Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 },
});
