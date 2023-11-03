import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { FriendService } from './friend.service';
import { Server, Socket } from 'socket.io';
import { Inject, forwardRef } from '@nestjs/common';

@WebSocketGateway(80, {
  cors: {
    origin:
      process.env.NODE_ENV == 'development' ? '*' : 'https://pleasurepal.de',
    credentials: process.env.NODE_ENV == 'development' ? false : true,
  },
})
export class FriendGateway {
  constructor(
    @Inject(forwardRef(() => FriendService))
    private readonly friendSrv: FriendService,
  ) { }

  @WebSocketServer()
  wss: Server;

  @SubscribeMessage('online')
  async handleOnline(@ConnectedSocket() client: Socket) {
    const { sub } = client.handshake.auth;
    this.emitOnline(sub);
  }

  @SubscribeMessage('ack-friend-online')
  async handleAckOnline(@ConnectedSocket() client: Socket, @MessageBody() friend: { uid: string }) {
    const { sub } = client.handshake.auth;
    this.wss.to(friend.uid).emit('friend-online', { uid: sub, ack: true })
  }

  async emitOnline(sub: string) {
    const friends = await this.friendSrv.getFriends(sub);
    for (const friend of friends) {
      this.wss
        .to(friend.to == sub ? friend.from : friend.to)
        .emit('friend-online', {
          uid: sub,
        });
    }
  }
}
