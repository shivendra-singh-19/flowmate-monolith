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
        pattern: Joi.string().required(),
        requestBody: Joi.object({
          url: Joi.string().uri().required(),
          method: Joi.string()
            .valid('get', 'post', 'put', 'delete', 'patch', 'head', 'options')
            .default('get'),
          headers: Joi.object().pattern(Joi.string(), Joi.any()),
          params: Joi.object().pattern(Joi.string(), Joi.any()),
          data: Joi.any(),
          timeout: Joi.number().integer().min(0),
        }).unknown(true),
      })
    );

    const { name, isRecurring, pattern, requestBody } = object;

    const response = await SchedulerUtils.addJobToQueue({
      name,
      isRecurring,
      pattern,
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
