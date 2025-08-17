import { Schema } from 'joi';

import { ValidationError } from '../error/Errors';

export class GeneralUtils {
  /**
   * Fetching paginated view values
   * @param query
   * @param MAX_PAGE_LIMIT
   * @returns
   */
  static parseOffsetPageParams(query: any, MAX_PAGE_LIMIT = 30) {
    const limit = parseInt(query?.limit ?? MAX_PAGE_LIMIT);
    const page = parseInt(query?.page);
    const skip = (page - 1) * limit;
    return {
      limit,
      skip,
      page,
    };
  }

  /**
   * Validating joi schema (body)
   * @param body
   * @param schema
   */
  static async validateBody(body: any, schema: Schema) {
    const { error } = await schema.validateAsync(body);

    if (error) {
      throw new ValidationError(error);
    }
  }

  /**
   * Validating Joi schema (params)
   * @param params
   * @param schema
   */
  static async validateParams(params: any, schema: Schema) {
    const updatedSchema = schema.options({ allowUnknown: false });

    const { error } = await updatedSchema.validateAsync(params);

    if (error) {
      throw new ValidationError(error);
    }
  }

  /**
   * Validating joi schema (query)
   * @param query
   * @param schema
   */
  static async validateQuery(query: any, schema: Schema) {
    const updatedSchema = schema.options({ allowUnknown: false });

    const { error } = await updatedSchema.validateAsync(query);

    if (error) {
      throw new ValidationError(error);
    }
  }
}
