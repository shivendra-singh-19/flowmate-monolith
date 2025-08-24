import _ from 'lodash';
import cron from 'cron-parser';
import mongoose from 'mongoose';
import { Job, JobsOptions } from 'bullmq';

import {
  ISchedulerTask,
  SchedulerTaskModel,
} from '../../../models/SchedulerModel';
import { QueueInstance } from '../../../QueueInstance';
import {
  ITaskExecution,
  TASK_EXECUTION_STATUS,
  TaskExecutionModel,
} from '../../../models/TaskExecutionModel';

interface BulkJobs {
  name: string;
  data: {
    _id: string;
  };
  opts?: JobsOptions;
}

const SCHEDULER_QUEUE = 'scheduler';
export class SchedulerUtils {
  /**
   * Adding job to the queue
   * @param payload
   * @returns
   */
  static async addJobToQueue(payload: {
    name: string;
    isRecurring: boolean;
    pattern: string;
    requestBody: any;
  }) {
    const { task } = await this.insertTaskEntry(payload);

    return {
      message: 'Successfully added jobs to the queue',
      data: task,
    };
  }

  /**
   * Making db entry for the job
   * @param payload
   * @returns
   */
  static async insertTaskEntry(payload: {
    name: string;
    pattern: string;
    requestBody: any;
  }) {
    const { name, pattern, requestBody } = payload;

    const nextRunTime = this.getNextCronRun(pattern);

    const taskDoc: Partial<ISchedulerTask> = {
      _id: new mongoose.Types.ObjectId(),
      name,
      pattern: pattern,
      requestBody,
      isPaused: false,
    };

    const taskExecutionDoc: ITaskExecution = {
      _id: new mongoose.Types.ObjectId(),
      taskId: taskDoc._id,
      status: TASK_EXECUTION_STATUS.PENDING,
      scheduledAt: nextRunTime,
    };

    taskDoc.nextRunId = taskExecutionDoc._id;

    const [task, taskExecution] = await Promise.all([
      new SchedulerTaskModel(taskDoc).save(),
      new TaskExecutionModel(taskExecutionDoc).save(),
    ]);

    await this.addOneRecurringJob(task);

    return {
      task: taskDoc,
    };
  }

  static async addOneRecurringJob(
    task: ISchedulerTask
  ): Promise<Job<any, any, string>> {
    const { pattern, name, _id } = task;
    const queue = QueueInstance.getInstance(SCHEDULER_QUEUE);

    const jobOptions: JobsOptions = this.fetchRecurringJobOptions(
      pattern,
      name
    );

    const response = await queue.add(
      'scheduler',
      {
        taskId: _id.toString(),
      },
      jobOptions
    );

    const repeatJobKey = response.repeatJobKey;

    await SchedulerTaskModel.updateOne(
      { _id },
      {
        $set: {
          jobId: repeatJobKey,
        },
      }
    ).exec();

    return response;
  }

  static fetchRecurringJobOptions(pattern: string, name: string) {
    return {
      removeOnComplete: {
        age: 60 * 60 * 24,
      },
      removeOnFail: {
        age: 60 * 60 * 24 * 7,
      },
      repeat: {
        pattern,
      },
      jobId: `${name} | ${new Date()}`,
    };
  }

  /**
   * Fetch next cron run time
   * @param pattern
   * @returns
   */
  static getNextCronRun(pattern: string) {
    const expression = cron.parse(pattern);
    const nextRunDate = expression.next().toDate();
    return nextRunDate;
  }
}
