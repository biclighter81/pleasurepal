import { DiscordModule as DiscordJSModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LovenseToy } from 'src/lovense/entities/lovense-toy.entity';
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
import { PleasureSession } from 'src/session/entities/pleasure-session.entity';
import { User_PleasureSession } from 'src/session/entities/user_plesure_session.join-entity';
import { ActionQueue } from 'src/session/entities/action-queue.entity';
import { SessionService } from 'src/session/session.service';
import { DiscordSessionService } from 'src/session/discord-session.service';
import { DeferredDiscordInvite } from 'src/session/entities/deferred-discord-invite.entity';
import { SocketGateway } from 'src/socket.gateway';
import { UserFriendshipRequest } from 'src/user/entities/user-friendship-request.entity';
import { DeviceService } from 'src/device/device.service';
import { LovenseHeartbeat } from 'src/lovense/entities/lovense-heartbeat.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LovenseHeartbeat,
      LovenseToy,
      PleasureSession,
      User_PleasureSession,
      ActionQueue,
      DeferredDiscordInvite,
      UserFriendshipRequest,
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
    LovenseControlSservice,
    DiscordService,
    SessionService,
    DiscordSessionService,
    SocketGateway,
    DeviceService,
  ],
})
export class SlashCommandsModule {}
