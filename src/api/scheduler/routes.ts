import express from 'express';
import { api } from '../app';
import { SchedulerApi } from './SchedulerApi';

export const ScheduledJobsRouter = express.Router();

ScheduledJobsRouter.post('/create', api.http(SchedulerApi.createNewCronTask));
