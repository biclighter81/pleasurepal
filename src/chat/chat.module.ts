import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { KeycloakConnectModule } from 'nest-keycloak-connect';

// eslint-disable-next-line
const dotenv = require('dotenv');
dotenv.config();

@Module({
  imports: [
    KeycloakConnectModule
      .register({
        authServerUrl: process.env.KEYCLOAK_URL,
        realm: process.env.KEYCLOAK_REALM,
        clientId: process.env.KEYCLOAK_CLIENT_ID,
        secret: process.env.KEYCLOAK_CLIENT_SECRET,
      })
  ],
  providers: [ChatService],
  controllers: [ChatController]
})
export class ChatModule { }
