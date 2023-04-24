import { DiscordModule as DiscordJSModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscordService } from 'src/discord/discord.service';
import { DiscordSessionService } from './discord-session.service';
import { DeferredDiscordInvite } from './entities/deferred-discord-invite.entity';
import { PleasureSession } from './entities/pleasure-session.entity';
import { User_PleasureSession } from './entities/user_plesure_session.join-entity';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { KeycloakConnectModule } from 'nest-keycloak-connect';
import { ChatService } from 'src/chat/chat.service';
import { UserModule } from 'src/user/user.module';
import { ChatModule } from 'src/chat/chat.module';
import { DiscordModule } from 'src/discord/discord.module';
import { SessionGateway } from './session.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PleasureSession,
      User_PleasureSession,
      DeferredDiscordInvite,
    ]),
    KeycloakConnectModule.register({
      authServerUrl: process.env.KEYCLOAK_URL,
      realm: process.env.KEYCLOAK_REALM,
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      secret: process.env.KEYCLOAK_CLIENT_SECRET,
    }),
    DiscordJSModule.forFeature(),
    UserModule,
    ChatModule,
    DiscordModule,
  ],
  providers: [
    SessionService,
    DiscordSessionService,
    DiscordService,
    ChatService,
    SessionGateway,
  ],
  controllers: [SessionController],
  exports: [
    TypeOrmModule.forFeature([
      PleasureSession,
      User_PleasureSession,
      DeferredDiscordInvite,
    ]),
    SessionGateway,
  ],
})
export class SessionModule {}
