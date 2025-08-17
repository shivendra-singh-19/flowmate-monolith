import _ from 'lodash';
import {
  ISchedulerTask,
  SchedulerTaskModel,
} from '../../../models/SchedulerModel';
import { QueueInstance } from '../../../QueueInstance';
import { Job, JobsOptions } from 'bullmq';
import mongoose from 'mongoose';

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
    schedules: string[];
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
    schedules: string[];
    requestBody: any;
  }) {
    const { name, pattern, schedules = [], requestBody } = payload;
    const isRecurring = schedules.length == 0 ? true : false;
    const taskDoc: ISchedulerTask = {
      _id: new mongoose.Types.ObjectId(),
      name,
      pattern: isRecurring ? pattern : undefined,
      schedules: !isRecurring
        ? _.map(schedules, (schedule) => ({
            scheduleTime: new Date(schedule),
          })).sort((a, b) =>
            a.scheduleTime.toString().localeCompare(b.scheduleTime.toString())
          )
        : undefined,
      requestBody,
      isPaused: false,
      isRecurring,
    };

    const task = new SchedulerTaskModel(taskDoc);

    await task.save();

    if (isRecurring) {
      await this.addOneRecurringJob(task);
    } else {
      await this.addMultipleDelayedJobs(task);
    }

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
        _id,
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

  static async addMultipleDelayedJobs(task: ISchedulerTask) {
    const { schedules, name, _id } = task;
    const bulkJobs: BulkJobs[] = [];
    for (const { scheduleTime: schedule } of schedules) {
      const delayInSeconds = (new Date(schedule).getTime() - Date.now()) / 1000;

      const jobOption: JobsOptions = {
        removeOnComplete: {
          age: 24 * 60 * 60,
        },
        removeOnFail: {
          age: 7 * 24 * 60 * 60,
        },
        jobId: `${name} | ${schedule} | ${Date.now()}`,
        delay: delayInSeconds,
      };

      bulkJobs.push({
        name,
        data: {
          _id: _id.toString(),
        },
        opts: jobOption,
      });
    }

    const queue = QueueInstance.getInstance(SCHEDULER_QUEUE);
    const response = await queue.addBulk(bulkJobs);

    const updatedSchedules = [];

    for (let i = 0; i < schedules.length; i++) {
      const schedule = schedules[i];
      const updatedResponse = {
        ...schedule,
        jobId: response[i].id,
      };

      updatedSchedules.push(updatedResponse);
    }

    await SchedulerTaskModel.updateOne(
      { _id },
      {
        $set: {
          schedules: updatedSchedules,
        },
      }
    ).exec();

    return;
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
}
