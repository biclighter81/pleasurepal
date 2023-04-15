import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscordService } from 'src/discord/discord.service';
import { LovenseHeartbeat } from 'src/lovense/entities/lovense-heartbeat.entity';
import { SocketGateway } from 'src/socket.gateway';
import { UserFriendshipRequest } from 'src/user/entities/user-friendship-request.entity';
import { DiscordSessionService } from './discord-session.service';
import { DeferredDiscordInvite } from './entities/deferred-discord-invite.entity';
import { PleasureSession } from './entities/pleasure-session.entity';
import { User_PleasureSession } from './entities/user_plesure_session.join-entity';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { KeycloakConnectModule } from 'nest-keycloak-connect';
import { ChatService } from 'src/chat/chat.service';
import { FriendService } from 'src/user/friend.service';
import { Conversation } from 'src/chat/entities/conversation.entity';
import { Message } from 'src/chat/entities/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PleasureSession,
      User_PleasureSession,
      LovenseHeartbeat,
      DeferredDiscordInvite,
      UserFriendshipRequest,
      Conversation,
      Message,
    ]),
    KeycloakConnectModule.register({
      authServerUrl: process.env.KEYCLOAK_URL,
      realm: process.env.KEYCLOAK_REALM,
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      secret: process.env.KEYCLOAK_CLIENT_SECRET,
    }),
    DiscordModule.forFeature(),
  ],
  providers: [
    SessionService,
    DiscordSessionService,
    DiscordService,
    SocketGateway,
    ChatService,
    FriendService,
  ],
  controllers: [SessionController],
})
export class SessionModule {}
