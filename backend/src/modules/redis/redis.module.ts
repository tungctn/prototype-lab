import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppConfig } from '../../config/app.config';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      inject: [ConfigService],
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService<AppConfig>) => {
        const redisUrl = configService.getOrThrow('REDIS_URL', { infer: true });
        const url = new URL(redisUrl);
        const logger = new Logger('RedisModule');

        const client = new Redis({
          host: url.hostname,
          port: Number(url.port || 6379),
          username: url.username || undefined,
          password: url.password || undefined,
          keyPrefix: configService.get('REDIS_KEY_PREFIX', { infer: true }),
          retryStrategy: (times) => Math.min(times * 100, 5000),
        });

        client.on('connect', () => {
          logger.log(`Connected to Redis at ${url.host}`);
        });
        client.on('error', (error) => {
          logger.error(error);
        });

        return client;
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
