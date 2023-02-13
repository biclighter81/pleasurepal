import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { DiscordModule as DiscordJSModule } from '@discord-nestjs/core';

@Module({
  imports: [DiscordJSModule.forFeature()],
  controllers: [],
  providers: [DiscordService],
})
export class DiscordModule {}
