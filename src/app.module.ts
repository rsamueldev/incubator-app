import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { RedisModule } from './redis/redis.module';
import { ReadingsModule } from './readings/readings.module';

import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    SupabaseModule,
    RedisModule,
    ReadingsModule,
  ],




  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
