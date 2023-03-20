import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFriendshipRequest } from './entities/user-friendship-request.entity';
import { FriendSocketGateway } from './friend.socket-gateway';

@Injectable()
export class FriendService {
  private readonly logger: Logger = new Logger(FriendService.name);

  constructor(
    @InjectRepository(UserFriendshipRequest)
    private readonly userFriendshipRequestRepo: Repository<UserFriendshipRequest>,
    private readonly friendSocketGateway: FriendSocketGateway,
  ) { }

  async requestFriendship(reqUid: string, uid: string) {
    const socket = this.friendSocketGateway.server;
    const request = await this.userFriendshipRequestRepo.save({
      requstUid: reqUid,
      uid: uid,
    });
    const userSocket = this.friendSocketGateway.connectedUsers.find((user) => user.id === uid);
    if (userSocket) {
      socket.to(userSocket.socketId).emit('friendship-request', { reqUid, uid });
    }
    return request;
  }
}
