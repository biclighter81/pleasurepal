import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LovenseCredentials_PleasureSession } from 'src/lovense/entities/credentials_plesure_session.join-entity';
import { LovenseActionQueue } from 'src/lovense/entities/lovense-action-queue.entity';
import { LovenseCredentials } from 'src/lovense/entities/lovense-credentials.entity';
import { LovenseToy } from 'src/lovense/entities/lovense-toy.entity';
import { PleasureSession } from 'src/lovense/entities/pleasure-session.entity';
import { DiscordService } from './discord.service';
import { DiscordModule as DiscordJSModule } from '@discord-nestjs/core';
import { LovenseService } from 'src/lovense/lovense.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LovenseCredentials,
      LovenseToy,
      PleasureSession,
      LovenseCredentials_PleasureSession,
      LovenseActionQueue,
    ]),
    DiscordJSModule.forFeature(),
  ],
  providers: [DiscordService, LovenseService],
  exports: [],
})
export class DiscordModule {}
