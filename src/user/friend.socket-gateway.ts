import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway(80, {
  cors: {
    origin: 'http://localhost:3000',
  },
})
export class FriendSocketGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('friendship-request')
  async handleFriendshipRequest(client: any, payload: any) {
    console.log(payload);
    this.server.emit('friend-back', {
      action: 'pong',
    });
  }
}
