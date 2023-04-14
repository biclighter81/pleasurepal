import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeycloakConnectModule } from 'nest-keycloak-connect';
import { SocketGateway } from '../socket.gateway';
import { UserFriendshipRequest } from './entities/user-friendship-request.entity';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import { UserController } from './user.controller';

// eslint-disable-next-line
const dotenv = require('dotenv');
dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forFeature([UserFriendshipRequest]),
    KeycloakConnectModule.register({
      authServerUrl: process.env.KEYCLOAK_URL,
      realm: process.env.KEYCLOAK_REALM,
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      secret: process.env.KEYCLOAK_CLIENT_SECRET,
    }),
  ],
  controllers: [UserController, FriendController],
  providers: [FriendService, SocketGateway],
})
export class UserModule {}
