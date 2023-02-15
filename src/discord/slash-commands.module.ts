import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LovenseCredentials } from 'src/lovense/entities/lovense-credentials.entity';
import { LovenseDiscordSession } from 'src/lovense/entities/lovense-discord-session.entity';
import { LovenseToy } from 'src/lovense/entities/lovense-toy.entity';
import { LovenseService } from 'src/lovense/lovense.service';
import { HelloWorldCommand } from './commands/hello-world.command';
import { LinkCommand } from './commands/link.command';
import { PleasureCommand } from './commands/pleasure';
import { SessionCommand } from './commands/session';
import { UnlinkCommand } from './commands/unlink.command';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LovenseCredentials,
      LovenseToy,
      LovenseDiscordSession,
    ]),
    DiscordModule.forFeature(),
  ],
  providers: [
    LovenseService,
    HelloWorldCommand,
    LinkCommand,
    UnlinkCommand,
    PleasureCommand,
    SessionCommand,
  ],
})
export class SlashCommandsModule {}
