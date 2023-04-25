import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { KeycloakConnectModule } from 'nest-keycloak-connect';
import { FriendService } from '../user/friend.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserFriendshipRequest } from '../user/entities/user-friendship-request.entity';
import { Conversation } from './entities/conversation.entity';
import { ConversationParticipants } from './entities/conversation-participants.entity';
import { Message } from './entities/message.entity';
import { UserModule } from 'src/user/user.module';
import { ChatGateway } from './chat.gateways';

// eslint-disable-next-line
const dotenv = require('dotenv');
dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    KeycloakConnectModule.register({
      authServerUrl: process.env.KEYCLOAK_URL,
      realm: process.env.KEYCLOAK_REALM,
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      secret: process.env.KEYCLOAK_CLIENT_SECRET,
    }),
    UserModule,
  ],
  providers: [ChatService, FriendService, ChatGateway],
  controllers: [ChatController],
  exports: [TypeOrmModule.forFeature([Conversation, Message]), ChatGateway],
})
export class ChatModule {}
