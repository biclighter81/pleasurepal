import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LovenseActionQueue } from 'src/lovense/entities/lovense-action-queue.entity';
import { LovenseToy } from 'src/lovense/entities/lovense-toy.entity';
import { PleasureSession } from 'src/lovense/entities/pleasure-session.entity';
import { DiscordService } from './discord.service';
import { DiscordModule as DiscordJSModule } from '@discord-nestjs/core';
import { LovenseService } from 'src/lovense/lovense.service';
import { User } from 'src/user/entities/user.entity';
import { User_PleasureSession } from 'src/lovense/entities/user_plesure_session.join-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      LovenseToy,
      PleasureSession,
      User_PleasureSession,
      LovenseActionQueue,
    ]),
    DiscordJSModule.forFeature(),
  ],
  providers: [DiscordService, LovenseService],
  exports: [],
})
export class DiscordModule {}
