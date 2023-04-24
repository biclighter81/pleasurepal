import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscordService } from './discord.service';
import { DiscordModule as DiscordJSModule } from '@discord-nestjs/core';
import { LovenseService } from 'src/lovense/lovense.service';
import { LovenseHeartbeat } from 'src/lovense/entities/lovense-heartbeat.entity';
import { LovenseModule } from 'src/lovense/lovense.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LovenseHeartbeat]),
    DiscordJSModule.forFeature(),
    LovenseModule,
  ],
  providers: [DiscordService, LovenseService],
  exports: [TypeOrmModule.forFeature([LovenseHeartbeat])],
})
export class DiscordModule {}
