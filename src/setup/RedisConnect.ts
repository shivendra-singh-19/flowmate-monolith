import Redis from 'ioredis';

export class RedisConnect {
  static async connect(redisConfig: any) {
    const redisClient = new Redis({
      ...redisConfig,
      retryStrategy: () => {
        return 100;
      },
    });

    redisClient.on('connect', () => {
      console.log('Connection successfull to redis');
    });

    redisClient.on('error', (error: any) => {
      console.error('Error connecting to redis', error);
    });

    return redisClient;
  }
}
