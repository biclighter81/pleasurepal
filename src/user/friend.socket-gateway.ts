import { InjectRepository } from '@nestjs/typeorm';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IsNull, Not, Repository } from 'typeorm';
import { UserFriendshipRequest } from './entities/user-friendship-request.entity';

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

  constructor(
    @InjectRepository(UserFriendshipRequest)
    private readonly userFriendshipRequestRepo: Repository<UserFriendshipRequest>,
  ) {}

  @SubscribeMessage('connect')
  async handleConnection(@ConnectedSocket() client: Socket) {
    const { sub } = client.handshake.auth;
    this.connectedUsers.push({
      id: sub,
      socketId: client.id,
    });
    await client.join(sub);
    const friends = await this.getFriends(sub);
    await this.emitOnlineFriends(friends, sub, client);
  }

  @SubscribeMessage('disconnect')
  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const idx = this.connectedUsers.findIndex(
      (user) => user.socketId === client.id,
    );
    this.connectedUsers.splice(idx, 1);
  }

  async emitOnlineFriends(
    friends: UserFriendshipRequest[],
    sub: string,
    client: Socket,
  ) {
    const onlineFriends = friends.filter((f) =>
      this.connectedUsers.find((u) => u.id === (f.to == sub ? f.from : f.to)),
    );
    if (onlineFriends.length) {
      for (const friend of onlineFriends) {
        client
          .to(friend.to == sub ? friend.from : friend.to)
          .emit('friend-online', {
            uid: sub,
          });
      }
      client.emit(
        'online-friends',
        onlineFriends.map((f) => (f.to == sub ? f.from : f.to)),
      );
    }
  }

  async getFriends(sub: string) {
    const friends = await this.userFriendshipRequestRepo
      .createQueryBuilder()
      .where({
        from: sub,
        acceptedAt: Not(IsNull()),
      })
      .orWhere({
        to: sub,
        acceptedAt: Not(IsNull()),
      })
      .getMany();
    return friends;
  }
}
