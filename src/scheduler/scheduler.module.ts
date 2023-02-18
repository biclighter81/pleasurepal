import {
  DiscordModule as DiscordJSModule,
  DiscordModule,
} from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LovenseCredentials_DiscordSession } from 'src/lovense/entities/credentials_discord_session.join-entity';
import { LovenseActionQueue } from 'src/lovense/entities/lovense-action-queue.entity';
import { LovenseCredentials } from 'src/lovense/entities/lovense-credentials.entity';
import { LovenseDiscordSession } from 'src/lovense/entities/lovense-discord-session.entity';
import { LovenseToy } from 'src/lovense/entities/lovense-toy.entity';
import { LovenseService } from 'src/lovense/lovense.service';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LovenseActionQueue,
      LovenseDiscordSession,
      LovenseCredentials,
      LovenseToy,
      LovenseCredentials_DiscordSession,
    ]),
    DiscordJSModule.forFeature(),
  ],
  controllers: [],
  providers: [SchedulerService, LovenseService],
})
export class SchedulerModule {}
