import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LovenseToy } from './entities/lovense-toy.entity';
import { LovenseSessionService } from './lovense-session.service';
import { LovenseController } from './lovense.controller';
import { LovenseService } from './lovense.service';
import { DiscordService } from 'src/discord/discord.service';
import { LovenseControlSservice } from './lovense-control.service';
import { LovenseHeartbeat } from './entities/lovense-heartbeat.entity';
import { User_PleasureSession } from 'src/session/entities/user_plesure_session.join-entity';
import { PleasureSession } from 'src/session/entities/pleasure-session.entity';
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
    DiscordModule.forFeature(),
  ],
  controllers: [LovenseController],
  providers: [
    LovenseService,
    LovenseSessionService,
    LovenseControlSservice,
    DiscordService,
  ],
  exports: [],
})
export class LovenseModule {}
