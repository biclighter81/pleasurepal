import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LovenseToy } from './entities/lovense-toy.entity';
import { LovenseController } from './lovense.controller';
import { LovenseService } from './lovense.service';
import { DiscordService } from 'src/discord/discord.service';
import { LovenseControlService } from './lovense-control.service';
import { LovenseHeartbeat } from './entities/lovense-heartbeat.entity';
import { User_PleasureSession } from 'src/session/entities/user_plesure_session.join-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LovenseHeartbeat,
      LovenseToy,
      User_PleasureSession,
    ]),
    DiscordModule.forFeature(),
  ],
  controllers: [LovenseController],
  providers: [LovenseService, LovenseControlService, DiscordService],
  exports: [
    TypeOrmModule.forFeature([
      LovenseHeartbeat,
      LovenseToy,
      User_PleasureSession,
    ]),
  ],
})
export class LovenseModule {}
