import { Module } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { SocketGateway } from 'src/socket.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserFriendshipRequest } from 'src/user/entities/user-friendship-request.entity';
import { KeycloakConnectModule } from 'nest-keycloak-connect';
import { Device } from './entities/device.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserFriendshipRequest, Device]),
    KeycloakConnectModule.register({
      authServerUrl: process.env.KEYCLOAK_URL,
      realm: process.env.KEYCLOAK_REALM,
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      secret: process.env.KEYCLOAK_CLIENT_SECRET,
    }),
  ],
  controllers: [DeviceController],
  providers: [DeviceService, SocketGateway],
})
export class DeviceModule {}
