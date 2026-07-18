import * as path from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { AppConfig } from './app.config';

@Injectable()
export class DatabaseConfigFactory implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService<AppConfig>) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      url: this.configService.getOrThrow('DATABASE_URL', { infer: true }),
      entities: [path.join(__dirname, '..', '**', '*.entity{.ts,.js}')],
      migrations: [path.join(__dirname, '..', 'migrations', '*{.ts,.js}')],
      autoLoadEntities: true,
      synchronize: this.configService.get('TYPEORM_SYNCHRONIZE', {
        infer: true,
      }),
      logging: this.configService.get('TYPEORM_LOGGING', { infer: true }),
    };
  }
}
