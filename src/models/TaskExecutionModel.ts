import { required } from 'joi';
import mongoose, { Schema, Types } from 'mongoose';

export const TASK_EXECUTION_STATUS = {
  COMPLETED: 'completed',
  FAILED: 'failed',
  RUNNING: 'running',
  PENDING: 'pending',
} as const;

export type TaskExecutionStatus =
  (typeof TASK_EXECUTION_STATUS)[keyof typeof TASK_EXECUTION_STATUS];

export interface ITaskExecution {
  _id?: Types.ObjectId;
  taskId: Types.ObjectId;
  response?: any;
  startedAt?: Date;
  finishedAt?: Date;
  failedAt?: Date;
  status: TaskExecutionStatus;
  scheduledAt: Date;
}

export const TaskExecutionsSchema = new Schema<ITaskExecution>({
  taskId: { type: Schema.Types.ObjectId, required: true },
  response: { type: Schema.Types.Mixed },
  startedAt: { type: Date },
  finishedAt: { type: Date },
  failedAt: { type: Date },
  status: {
    type: String,
    enum: [...Object.values(TASK_EXECUTION_STATUS)],
    default: TASK_EXECUTION_STATUS.PENDING,
  },
  scheduledAt: { type: Date, required: true },
});

TaskExecutionsSchema.index({ taskId: 1 });

export const TaskExecutionModel = mongoose.model(
  'TaskExecution',
  TaskExecutionsSchema,
  'TaskExecution'
);
