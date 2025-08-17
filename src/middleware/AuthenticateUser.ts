import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';

import { AuthenticationError, AuthorizationError } from '../error/Errors';

export const authenticateUser = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    /**
     * Sending 401 for missing token
     */
    throw new AuthenticationError({
      message: `Authorization token missing.`,
    });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err: any, user: any) => {
    if (err) {
      throw new AuthorizationError({
        message: `Invalid Auhtorization token.`,
      });
    }

    req.user = user;
    next();
  });
};
