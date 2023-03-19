import { DiscordModule as DiscordJSModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LovenseActionQueue } from 'src/lovense/entities/lovense-action-queue.entity';
import { PleasureSession } from 'src/lovense/entities/pleasure-session.entity';
import { LovenseToy } from 'src/lovense/entities/lovense-toy.entity';
import { LovenseService } from 'src/lovense/lovense.service';
import { SchedulerService } from './scheduler.service';
import { DiscordService } from 'src/discord/discord.service';
import { LovenseControlSservice } from 'src/lovense/lovense-control.service';
import { User } from 'src/user/entities/user.entity';
import { User_PleasureSession } from 'src/lovense/entities/credentials_plesure_session.join-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LovenseActionQueue,
      PleasureSession,
      User,
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
