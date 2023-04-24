import { DiscordModule as DiscordJSModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LovenseService } from 'src/lovense/lovense.service';
import { DiscordService } from 'src/discord/discord.service';
import { ActionQueue } from 'src/session/entities/action-queue.entity';
import { PleasureSession } from 'src/session/entities/pleasure-session.entity';
import { LovenseModule } from 'src/lovense/lovense.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActionQueue, PleasureSession]),
    DiscordJSModule.forFeature(),
    LovenseModule,
  ],
  controllers: [],
  providers: [LovenseService, DiscordService],
})
export class SchedulerModule {}
