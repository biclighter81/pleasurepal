import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendshipRequestAlreadyExistsError } from '../lib/errors/friend';
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
    const existingRequest = await this.userFriendshipRequestRepo.findOne({
      where: {
        requestUid: reqUid,
        uid: uid,
      },
    });
    if (existingRequest) {
      throw new FriendshipRequestAlreadyExistsError('Friendship request already exists!')
    }
    const request = await this.userFriendshipRequestRepo.save({
      requestUid: reqUid,
      uid: uid,
    });
    const userSockets = this.friendSocketGateway.connectedUsers.filter((user) => user.id === uid);
    if (userSockets.length) {
      console.log(userSockets)
      for (const userSocket of userSockets) {
        socket.to(userSocket.socketId).emit('friendship-request', { reqUid, uid });
      }
    }
    return request;
  }

  async getFriendshipRequests(uid: string) {
    return this.userFriendshipRequestRepo.find({
      where: {
        uid,
      },
    });
  }
}
