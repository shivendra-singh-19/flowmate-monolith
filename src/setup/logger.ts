import { format } from 'winston';

const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return stack
    ? `${timestamp} | ${level} | ${message} \n Stack trace: ${stack}`
    : `${timestamp} | ${level} | ${message}`;
});
