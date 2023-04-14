import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LovenseToy } from 'src/lovense/entities/lovense-toy.entity';
import { DiscordService } from './discord.service';
import { DiscordModule as DiscordJSModule } from '@discord-nestjs/core';
import { LovenseService } from 'src/lovense/lovense.service';
import { LovenseHeartbeat } from 'src/lovense/entities/lovense-heartbeat.entity';
import { PleasureSession } from 'src/session/entities/pleasure-session.entity';
import { User_PleasureSession } from 'src/session/entities/user_plesure_session.join-entity';
import { ActionQueue } from 'src/session/entities/action-queue.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LovenseHeartbeat,
      LovenseToy,
      PleasureSession,
      User_PleasureSession,
      ActionQueue,
    ]),
    DiscordJSModule.forFeature(),
  ],
  providers: [DiscordService, LovenseService],
  exports: [],
})
export class DiscordModule {}
