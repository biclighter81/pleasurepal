import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LovenseCredentials_DiscordSession } from './entities/credentials_discord_session.join-entity';
import { LovenseActionQueue } from './entities/lovense-action-queue.entity';
import { LovenseCredentials } from './entities/lovense-credentials.entity';
import { LovenseDiscordSession } from './entities/lovense-discord-session.entity';
import { LovenseToy } from './entities/lovense-toy.entity';
import { LovenseSessionService } from './lovense-session.service';
import { LovenseController } from './lovense.controller';
import { LovenseService } from './lovense.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LovenseCredentials,
      LovenseToy,
      LovenseDiscordSession,
      LovenseCredentials_DiscordSession,
      LovenseActionQueue,
    ]),
    DiscordModule.forFeature(),
  ],
  controllers: [LovenseController],
  providers: [LovenseService, LovenseSessionService],
  exports: [],
})
export class LovenseModule {}
