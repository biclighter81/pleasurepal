import { DiscordModule as DiscordJSModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { LovenseService } from 'src/lovense/lovense.service';
import { LeaveCommand } from './commands/leave';
import { LinkCommand } from './commands/link';
import { PleasureCommand } from './commands/pleasure';
import { SessionCommand } from './commands/session';
import { SkipCommand } from './commands/skip';
import { AuthorizeCommand } from './commands/authorize';
import { DiscordService } from './discord.service';
import { LovenseControlService } from 'src/lovense/lovense-control.service';
import { SessionInfoCommand } from './commands/session-info';
import { SessionService } from 'src/session/session.service';
import { DiscordSessionService } from 'src/session/discord-session.service';
import { DeviceService } from 'src/device/device.service';
import { ChatService } from 'src/chat/chat.service';
import { UserModule } from 'src/user/user.module';
import { LovenseModule } from 'src/lovense/lovense.module';
import { SessionModule } from 'src/session/session.module';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    DiscordJSModule.forFeature(),
    UserModule,
    LovenseModule,
    SessionModule,
    ChatModule,
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
    LovenseControlService,
    DiscordService,
    SessionService,
    DiscordSessionService,
    DeviceService,
    ChatService,
  ],
})
export class SlashCommandsModule {}
