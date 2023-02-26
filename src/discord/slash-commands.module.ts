import { DiscordModule as DiscordJSModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LovenseCredentials_PleasureSession } from 'src/lovense/entities/credentials_plesure_session.join-entity';
import { LovenseActionQueue } from 'src/lovense/entities/lovense-action-queue.entity';
import { LovenseCredentials } from 'src/lovense/entities/lovense-credentials.entity';
import { PleasureSession } from 'src/lovense/entities/pleasure-session.entity';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LovenseCredentials,
      LovenseToy,
      PleasureSession,
      LovenseCredentials_PleasureSession,
      LovenseActionQueue,
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
