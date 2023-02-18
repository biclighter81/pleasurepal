import { DiscordModule as DiscordJSModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LovenseCredentials_DiscordSession } from 'src/lovense/entities/credentials_discord_session.join-entity';
import { LovenseActionQueue } from 'src/lovense/entities/lovense-action-queue.entity';
import { LovenseCredentials } from 'src/lovense/entities/lovense-credentials.entity';
import { LovenseDiscordSession } from 'src/lovense/entities/lovense-discord-session.entity';
import { LovenseToy } from 'src/lovense/entities/lovense-toy.entity';
import { LovenseSessionService } from 'src/lovense/lovense-session.service';
import { LovenseService } from 'src/lovense/lovense.service';
import { LeaveCommand } from './commands/leave';
import { LinkCommand } from './commands/link';
import { PleasureCommand } from './commands/pleasure';
import { SessionCommand } from './commands/session';
import { SkipCommand } from './commands/skip';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LovenseCredentials,
      LovenseToy,
      LovenseDiscordSession,
      LovenseCredentials_DiscordSession,
      LovenseActionQueue,
    ]),
    DiscordJSModule.forFeature(),
  ],
  providers: [
    LovenseService,
    LinkCommand,
    PleasureCommand,
    SessionCommand,
    SkipCommand,
    LeaveCommand,
    LovenseSessionService,
  ],
})
export class SlashCommandsModule {}
