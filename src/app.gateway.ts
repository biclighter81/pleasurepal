import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { verifyToken } from './lib/keycloak';
import { KeycloakUser } from './lib/interfaces/keycloak';
import { FriendService } from './user/friend.service';

@WebSocketGateway(80, {
  cors: {
    origin:
      process.env.NODE_ENV == 'development' ? '*' : 'https://pleasurepal.de',
    credentials: process.env.NODE_ENV == 'development' ? false : true,
  },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly friendSrv: FriendService) {}

  @WebSocketServer()
  wss: Server;

  async handleConnection(client: Socket, ...args: any[]) {
    const { sub, token } = client.handshake.auth;
    let user: KeycloakUser;
    try {
      user = await verifyToken(token);
    } catch (e) {
      client.emit('invalid-token');
      return;
    }
    await client.join(sub);
  }

  async handleDisconnect(client: Socket) {
    const { sub } = client.handshake.auth;
    const friends = await this.friendSrv.getFriends(sub);
    for (const friend of friends) {
      this.wss
        .to(friend.to == sub ? friend.from : friend.to)
        .emit('friend-offline', {
          uid: sub,
        });
    }
  }
}
