import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(80, {
  cors: {
    origin: 'http://localhost:3000',
  },
})
export class FriendSocketGateway {
  private connectedUsers: any[] = [];
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('connect')
  async handleConnection(@ConnectedSocket() client: Socket) {
    const { sub } = client.handshake.auth;
    const idx = this.connectedUsers.findIndex((user) => user.id === sub);
    this.connectedUsers.splice(idx, 1);
    this.connectedUsers.push({
      id: sub,
      socketId: client.id,
    });
    client.join(sub);
  }

  @SubscribeMessage('friendship-request')
  async handleFriendshipRequest(
    @MessageBody() payload: any,
    @ConnectedSocket() client: Socket,
  ) {
    const sender = client.handshake.auth;
    const receiver = this.connectedUsers.find(
      (user) => user.id === payload.receiverId,
    )?.socketId;
    if (receiver) {
      this.server.to(receiver).emit('friendship-request', {
        sender: sender.sub,
      });
    }
  }
}
