import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscordService } from 'src/discord/discord.service';
import { LovenseCredentials_DiscordSession } from './entities/credentials_discord_session.join-entity';
import { LovenseCredentials } from './entities/lovense-credentials.entity';
import { LovenseDiscordSession } from './entities/lovense-discord-session.entity';
import { LovenseToy } from './entities/lovense-toy.entity';
import { LovenseController } from './lovense.controller';
import { LovenseService } from './lovense.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LovenseCredentials,
      LovenseToy,
      LovenseDiscordSession,
      LovenseCredentials_DiscordSession,
    ]),
    DiscordModule.forFeature(),
  ],
  controllers: [LovenseController],
  providers: [LovenseService],
  exports: [],
})
export class LovenseModule {}
