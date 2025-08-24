import fs from 'fs';
import cors from 'cors';
import Bluebird from 'bluebird';
import { Server } from 'socket.io';
import http from 'http';
import express, { NextFunction, Request, Response } from 'express';

import { RedisConnect } from './setup/RedisConnect';
import { MongoConnect } from './setup/MongoConnect';

import { ScheduledJobsRouter } from './api/scheduler/routes';
import config from './server/config';

global.Promise = <any>Bluebird;

const database = config.get('database');
const redis = config.get('redis');
const server = config.get('server');

export let redisClient;
async function init() {
  const [mongo, redisClient1] = await Promise.all([
    MongoConnect.connect(database),
    RedisConnect.connect(redis),
  ]);

  redisClient = redisClient1;

  const app = express();
  const httpServer = http.createServer(app);

  app.use(express.json());

  app.use(cors());

  app.get('/health', (req: Request, res: Response) => {
    res.send('Running');
  });

  app.use('/job', ScheduledJobsRouter);

  // Error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.name == 'ValidationError') {
      res
        .status(400)
        .json({ error: err.message, code: err.code, details: err.details });
    } else if (err.name == 'NotFoundError') {
      res
        .status(404)
        .json({ error: err.message, code: err.code, details: err.details });
    } else if (err.name == 'AuthenticationError') {
      res
        .status(401)
        .json({ error: err.message, code: err.code, details: err.details });
    } else if (err.name == 'AuthorizationError') {
      res
        .status(403)
        .json({ error: err.message, code: err.code, details: err.details });
    } else {
      res.status(500).json({ details: err.details });
    }
  });

  httpServer.listen(server.port, (): void => {
    console.log(`Server Running at ${server.port}`);
  });
}

try {
  init();
} catch (error) {
  console.error(error);
  process.exit(-1);
}
