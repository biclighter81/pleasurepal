import { DiscordModule as DiscordJSModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LovenseCredentials_PleasureSession } from 'src/lovense/entities/credentials_plesure_session.join-entity';
import { LovenseActionQueue } from 'src/lovense/entities/lovense-action-queue.entity';
import { LovenseCredentials } from 'src/lovense/entities/lovense-credentials.entity';
import { PleasureSession } from 'src/lovense/entities/pleasure-session.entity';
import { LovenseToy } from 'src/lovense/entities/lovense-toy.entity';
import { LovenseService } from 'src/lovense/lovense.service';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LovenseActionQueue,
      PleasureSession,
      LovenseCredentials,
      LovenseToy,
      LovenseCredentials_PleasureSession,
    ]),
    DiscordJSModule.forFeature(),
  ],
  controllers: [],
  providers: [SchedulerService, LovenseService],
})
export class SchedulerModule {}
