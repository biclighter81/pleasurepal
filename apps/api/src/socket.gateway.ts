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
import { UserFriendshipRequest } from './user/entities/user-friendship-request.entity';
import { DeviceInfo } from './lib/interfaces/device';
import { createHash } from 'crypto';

// eslint-disable-next-line
const dotenv = require('dotenv');
dotenv.config();

@WebSocketGateway(80, {
  cors: {
    origin:
      process.env.NODE_ENV == 'development' ? '*' : 'https://pleasurepal.de',
    credentials: process.env.NODE_ENV == 'development' ? false : true,
  },
})
export class SocketGateway {
  @WebSocketServer()
  public server: Server;

  constructor(
    @InjectRepository(UserFriendshipRequest)
    private readonly userFriendshipRequestRepo: Repository<UserFriendshipRequest>,
  ) { }


  @SubscribeMessage('connect')
  async handleConnection(@ConnectedSocket() client: Socket) {
    console.log('connected', client.handshake.auth);
    const { sub } = client.handshake.auth;
    await client.join(sub);
    const friends = await this.getFriends(sub);
    //await this.emitStatus('online', friends, sub);
    console.log('connected', sub);
  }

  @SubscribeMessage('disconnect')
  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const { sub } = client.handshake.auth;
    const friends = await this.getFriends(sub);
    await this.emitStatus('offline', friends, sub);
  }

  @SubscribeMessage('online')
  async handleOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { uid: string },
  ) {
    const { sub } = client.handshake.auth;
    console.log(sub, 'online')
    this.server.to(payload.uid).emit('friend-online', {
      uid: sub,
      isResponse: true,
    });
  }

  @SubscribeMessage('device-added')
  async handleDeviceAdded(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DeviceInfo,
  ) { }

  @SubscribeMessage('device-removed')
  async handleDeviceRemoved(
    @ConnectedSocket() client: DeviceInfo,
    @MessageBody() payload: any,
  ) {
    const hash = createHash('md5').update(payload.name).digest('hex');
  }

  async emitStatus(
    status: 'online' | 'offline',
    friends: UserFriendshipRequest[],
    sub: string,
  ) {
    if (friends.length) {
      for (const friend of friends) {
        this.server
          .to(friend.to == sub ? friend.from : friend.to)
          .emit(`friend-${status}`, {
            uid: sub,
          });
      }
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
