import Joi from 'joi';
import { GeneralUtils } from '../../utils/GeneralUtils';
import { SchedulerUtils } from './utils/SchedulerUtils';

export class SchedulerApi {
  /**
   * Creating new cron task
   * @param object
   * @param options
   * @returns
   */
  static async createNewCronTask(object, options) {
    await GeneralUtils.validateBody(
      object,
      Joi.object({
        name: Joi.string().required(),
        isRecurring: Joi.boolean().default(false),
        pattern: Joi.when('isRecurring', {
          is: true,
          then: Joi.string().required(),
        }),
        schedules: Joi.when('isRecurring', {
          is: false,
          then: Joi.array().items(Joi.string()).min(1),
        }),
        requestBody: Joi.object({
          url: Joi.string().uri().required(),
          method: Joi.string()
            .valid('get', 'post', 'put', 'delete', 'patch', 'head', 'options')
            .default('get'),
          headers: Joi.object().pattern(Joi.string(), Joi.any()),
          params: Joi.object().pattern(Joi.string(), Joi.any()),
          data: Joi.any(),
          timeout: Joi.number().integer().min(0),
          withCredentials: Joi.boolean(),
          responseType: Joi.string().valid(
            'arraybuffer',
            'blob',
            'document',
            'json',
            'text',
            'stream'
          ),
        }).unknown(true),
      })
    );

    const { name, isRecurring, pattern, schedules = [], requestBody } = object;

    const response = await SchedulerUtils.addJobToQueue({
      name,
      isRecurring,
      pattern,
      schedules,
      requestBody,
    });

    return response;
  }

  static async fetchAllTasks(object, options) {}

  static async fetchOneTask(object, options) {}

  static async updateRecurringTask(object, options) {}

  static async updateNonRecurringTask(object, options) {}

  static async deleteRecurringTask(object, options) {}

  static async deleteNonRecurringTask(object, options) {}

  static async fetchNextRun(object, options) {}

  static async pauseRecurringTask(object, options) {}
}
