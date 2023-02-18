import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DiscordModule as DiscordJSModule } from '@discord-nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { SlashCommandsModule } from './discord/slash-commands.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from './datasource';
import {
  AuthGuard,
  KeycloakConnectModule,
  PolicyEnforcementMode,
  ResourceGuard,
  RoleGuard,
  TokenValidation,
} from 'nest-keycloak-connect';
import { UserController } from './user/user.controller';
import { APP_GUARD } from '@nestjs/core';
import { LovenseModule } from './lovense/lovense.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({ ...AppDataSource.options }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {}
}
