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
import { DeferredDiscordInvite } from 'src/session/entities/deferred-discord-invite.entity';
import { SocketGateway } from 'src/socket.gateway';
import { UserFriendshipRequest } from 'src/user/entities/user-friendship-request.entity';
import { DeviceService } from 'src/device/device.service';
import { ChatService } from 'src/chat/chat.service';
import { FriendService } from 'src/user/friend.service';
import { Conversation } from 'src/chat/entities/conversation.entity';
import { Message } from 'src/chat/entities/message.entity';

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
      Conversation,
      Message,
    ]),
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
    FriendService,
  ],
})
export class SlashCommandsModule {}
