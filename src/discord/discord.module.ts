import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { DiscordModule as DiscordJSModule } from '@discord-nestjs/core';
import { DiscordController } from './discord.controller';

@Module({
  imports: [DiscordJSModule.forFeature()],
  controllers: [DiscordController],
  providers: [DiscordService],
})
export class DiscordModule {}
