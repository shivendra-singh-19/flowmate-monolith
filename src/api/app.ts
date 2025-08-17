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
        console.error(error.details);
        res.sendStatus(500);
      }
    };
  },
};
