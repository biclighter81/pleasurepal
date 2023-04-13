import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscordService } from 'src/discord/discord.service';
import { LovenseHeartbeat } from 'src/lovense/entities/lovense-heartbeat.entity';
import { DiscordSessionService } from './discord-session.service';
import { PleasureSession } from './entities/pleasure-session.entity';
import { User_PleasureSession } from './entities/user_plesure_session.join-entity';
import { SessionService } from './session.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PleasureSession,
      User_PleasureSession,
      LovenseHeartbeat,
    ]),
    DiscordModule.forFeature(),
  ],
  providers: [SessionService, DiscordSessionService, DiscordService],
})
export class SessionModule {}
