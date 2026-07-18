import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import loadAppConfig from './config/app.config';
import { DatabaseConfigFactory } from './config/database.config';
import { PrototypeModule } from './modules/prototype/prototype.module';
import { RedisModule } from './modules/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadAppConfig],
    }),
    TypeOrmModule.forRootAsync({ useClass: DatabaseConfigFactory }),
    RedisModule,
    PrototypeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
