import { required } from 'joi';
import mongoose, { Schema, Types } from 'mongoose';

export interface ISchedulerTask {
  _id?: Types.ObjectId;
  name: string;
  pattern?: string;
  requestBody: {
    url: string;
    headers: any;
    data: any;
    method: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'optional';
    timeout: number;
  };
  jobId?: string;
  isPaused: boolean;
  nextRunId: Types.ObjectId;
}

export const SchedulerTaskSchema = new Schema<ISchedulerTask>({
  name: { type: String, unique: true },
  pattern: { type: String },
  requestBody: {
    url: { type: String, required: true },
    headers: { type: Schema.Types.Mixed },
    data: { type: Schema.Types.Mixed },
    method: {
      type: String,
      enum: ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'],
    },
    timeout: { type: Number },
  },
  jobId: { type: String },
  isPaused: { type: Boolean, default: false },
  nextRunId: { type: Schema.Types.ObjectId },
});

SchedulerTaskSchema.index({ name: 1 });

export const SchedulerTaskModel = mongoose.model(
  'SchedulerTask',
  SchedulerTaskSchema,
  'SchedulerTasks'
);
