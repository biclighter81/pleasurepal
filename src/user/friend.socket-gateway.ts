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
    origin: '*',
  },
})
export class FriendSocketGateway {
  public connectedUsers: {
    id: string;
    socketId: string;
  }[] = [];
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('connect')
  async handleConnection(@ConnectedSocket() client: Socket) {
    const { sub } = client.handshake.auth;
    this.connectedUsers.push({
      id: sub,
      socketId: client.id,
    });
    client.join(sub);
  }

  @SubscribeMessage('disconnect')
  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const idx = this.connectedUsers.findIndex((user) => user.socketId === client.id);
    this.connectedUsers.splice(idx, 1);
  }
}
