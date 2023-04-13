import { DiscordModule as DiscordJSModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LovenseToy } from 'src/lovense/entities/lovense-toy.entity';
import { LovenseSessionService } from 'src/lovense/lovense-session.service';
import { LovenseService } from 'src/lovense/lovense.service';
import { LeaveCommand } from './commands/leave';
import { LinkCommand } from './commands/link';
import { PleasureCommand } from './commands/pleasure';
import { SessionCommand } from './commands/session';
import { SkipCommand } from './commands/skip';
import { AuthorizeCommand } from './commands/authorize';
import { DiscordService } from './discord.service';
import { LovenseControlSservice } from 'src/lovense/lovense-control.service';
import { SessionInfoCommand } from './commands/session-info';
import { LovenseHeartbeat } from 'src/lovense/entities/lovense-heartbeat.entity';
import { PleasureSession } from 'src/session/entities/pleasure-session.entity';
import { User_PleasureSession } from 'src/session/entities/user_plesure_session.join-entity';
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
    DiscordJSModule.forFeature(),
  ],
  providers: [
    LinkCommand,
    PleasureCommand,
    SessionCommand,
    SkipCommand,
    LeaveCommand,
    AuthorizeCommand,
    SessionInfoCommand,
    LovenseService,
    LovenseSessionService,
    LovenseControlSservice,
    DiscordService,
  ],
})
export class SlashCommandsModule {}
