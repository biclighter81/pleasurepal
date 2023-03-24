import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { KeycloakConnectModule } from 'nest-keycloak-connect';
import { FriendService } from '../user/friend.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserFriendshipRequest } from '../user/entities/user-friendship-request.entity';
import { SocketGateway } from '../socket.gateway';
import { Conversation } from './entities/conversation.entity';
import { ConversationParticipants } from './entities/conversation-participants.entity';
import { Message } from './entities/message.entity';

// eslint-disable-next-line
const dotenv = require('dotenv');
dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserFriendshipRequest,
      Conversation,
      ConversationParticipants,
      Message
    ]),
    KeycloakConnectModule
      .register({
        authServerUrl: process.env.KEYCLOAK_URL,
        realm: process.env.KEYCLOAK_REALM,
        clientId: process.env.KEYCLOAK_CLIENT_ID,
        secret: process.env.KEYCLOAK_CLIENT_SECRET,
      })
  ],
  providers: [ChatService, FriendService, SocketGateway],
  controllers: [ChatController]
})
export class ChatModule { }
