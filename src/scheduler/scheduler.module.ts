import { DiscordModule as DiscordJSModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LovenseToy } from 'src/lovense/entities/lovense-toy.entity';
import { LovenseService } from 'src/lovense/lovense.service';
import { SchedulerService } from './scheduler.service';
import { DiscordService } from 'src/discord/discord.service';
import { LovenseControlSservice } from 'src/lovense/lovense-control.service';
import { LovenseHeartbeat } from 'src/lovense/entities/lovense-heartbeat.entity';
import { ActionQueue } from 'src/session/entities/action-queue.entity';
import { PleasureSession } from 'src/session/entities/pleasure-session.entity';
import { User_PleasureSession } from 'src/session/entities/user_plesure_session.join-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActionQueue,
      PleasureSession,
      LovenseHeartbeat,
      LovenseToy,
      User_PleasureSession,
    ]),
    DiscordJSModule.forFeature(),
  ],
  controllers: [],
  providers: [
    SchedulerService,
    LovenseService,
    LovenseControlSservice,
    DiscordService,
  ],
})
export class SchedulerModule {}
