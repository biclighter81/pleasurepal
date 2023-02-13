import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LovenseCredentials } from 'src/lovense/entities/lovense-credentials.entity';
import { LovenseToy } from 'src/lovense/entities/lovense-toy.entity';
import { LovenseService } from 'src/lovense/lovense.service';
import { HelloWorldCommand } from './commands/hello-world.command';
import { DiscordService } from './discord.service';

@Module({
  imports: [
    DiscordModule.forFeature(),
    TypeOrmModule.forFeature([LovenseCredentials, LovenseToy]),
  ],
  providers: [HelloWorldCommand, LovenseService, DiscordService],
})
export class SlashCommandsModule {}
