import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DiscordModule as DiscordJSModule } from '@discord-nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { SlashCommandsModule } from './discord/slash-commands.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from './datasource';
import { KeycloakConnectModule } from 'nest-keycloak-connect';
import { LovenseModule } from './lovense/lovense.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerModule } from './scheduler/scheduler.module';
import { MembershipModule } from './membership/membership.module';
import { ChatModule } from './chat/chat.module';
import { DeviceModule } from './device/device.module';
import { SessionModule } from './session/session.module';
import { AppGateway } from './app.gateway';
import { FriendService } from './user/friend.service';
import { UserFriendshipRequest } from './user/entities/user-friendship-request.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CqrsModule } from './cqrs/cqrs.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({ ...AppDataSource.options }),
    TypeOrmModule.forFeature([UserFriendshipRequest]),
    EventEmitterModule.forRoot(),
    DiscordJSModule.forRootAsync({
      useFactory: () => ({
        token: process.env.DISCORD_TOKEN,
        discordClientOptions: {
          intents: [
            'Guilds',
            'GuildMessages',
            'GuildMessageReactions',
            'GuildVoiceStates',
            'GuildMembers',
            'GuildPresences',
            'GuildMessageTyping',
            'DirectMessages',
            'DirectMessageReactions',
            'DirectMessageTyping',
            'GuildInvites',
            'GuildVoiceStates',
            'GuildMessageReactions',
            'GuildMessageTyping',
          ],
        },
      }),
    }),
    KeycloakConnectModule.register({
      authServerUrl: process.env.KEYCLOAK_URL,
      realm: process.env.KEYCLOAK_REALM,
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      secret: process.env.KEYCLOAK_CLIENT_SECRET,
    }),
    ScheduleModule.forRoot(),
    SlashCommandsModule,
    UserModule,
    LovenseModule,
    SchedulerModule,
    MembershipModule,
    ChatModule,
    DeviceModule,
    SessionModule,
    CqrsModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppGateway, FriendService],
})
export class AppModule {
  constructor() {}
}
