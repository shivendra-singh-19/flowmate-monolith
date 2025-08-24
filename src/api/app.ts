import { NextFunction, Request, Response } from 'express';

import { InternalServerError } from '../error/Errors';

export const api = {
  http: function (handler: any) {
    return async function (
      req: Request | any,
      res: Response,
      next: NextFunction
    ) {
      try {
        const object = req.body;
        const options = {
          params: req.params,
          query: req.query,
          headers: req.headers,
          user: req.user,
        };

        const result = await handler(object, options);
        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Internal Server Error',
          error: error.details, // you can include specific details here
        });
      }
    };
  },
};
