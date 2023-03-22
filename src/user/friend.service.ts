import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  FriendshipRequestAlreadyExistsError,
  FriendshipRequestBlocked,
  FriendshipRequestNotFound,
} from '../lib/errors/friend';
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

  async fetchByTo(from: string, to: string) {
    return this.userFriendshipRequestRepo.findOne({
      where: {
        from: to,
        to: from,
      }
    })
  }

  async fetchByFrom(from: string, to: string) {
    return this.userFriendshipRequestRepo.findOne({
      where: {
        from,
        to
      }
    })
  }

  async emitRequest(from: string, to: string) {
    const socket = this.friendSocketGateway.server;
    const userSockets = this.friendSocketGateway.connectedUsers.filter(
      (user) => user.id === to,
    );
    if (userSockets.length) {
      for (const userSocket of userSockets) {
        socket
          .to(userSocket.socketId)
          .emit('friendship-request', { from, to });
      }
    }
  }

  async requestFriendship(from: string, to: string) {
    const byFrom = await this.fetchByFrom(from, to);
    const byTo = await this.fetchByTo(from, to);
    if (!byFrom && !byTo || (byFrom.acceptedAt || byTo.acceptedAt)) {
      // No friendship request exists
      const req = await this.userFriendshipRequestRepo.save({
        from,
        to
      })
      await this.emitRequest(from, to);
      return req;
    }
    if (byFrom && !byFrom.acceptedAt && !byFrom.rejectedAt && !byFrom.blockedAt) {
      // Friendship request exists
      throw new FriendshipRequestAlreadyExistsError('Friendship request already exists!',);
    }
    if (byUid && byUid.rejectedAt) {
      // Friendship request exists but was rejected resend request
      const req = await this.userFriendshipRequestRepo.save({
        uid,
        requestUid: from,
        rejectedAt: null,
      })
      await this.emitRequest(from, uid);
      return req;
    }
    if (byUid && byUid.blockedAt) {
      // Friendship request exists but user was blocked
      throw new FriendshipRequestBlocked('Friendship request blocked!');
    }
    if (byfrom && !byfrom.acceptedAt && !byfrom.rejectedAt && !byfrom.blockedAt) {
      // Friendship request exists outgoing from requested user
      const req = await this.userFriendshipRequestRepo.save({
        uid,
        requestUid: from,
        acceptedAt: new Date(),
      })
      return req;
    }
    if (byfrom && byfrom.rejectedAt) {
      // Friendship request exists outgoing from requested user but was rejected by user reset rejectedAt
      const req = await this.userFriendshipRequestRepo.save({
        uid,
        requestUid: from,
        rejectedAt: null,
        acceptedAt: new Date(),
      })
      return req;
    }
    if (byfrom && byfrom.blockedAt) {
      // Friendship request exists outgoing from requested user but was blocked by user reset blockedAt
      const req = await this.userFriendshipRequestRepo.save({
        uid,
        requestUid: from,
        rejectedAt: null,
        blockedAt: null,
        acceptedAt: new Date(),
      })
      return req;
    }
  }

  async getPending(uid: string) {
    return this.userFriendshipRequestRepo.find({
      where: {
        uid,
        acceptedAt: IsNull(),
        rejectedAt: IsNull(),
      },
    });
  }

  async reject(uid: string, from: string) {
    const socket = this.friendSocketGateway.server;
    const userSockets = this.friendSocketGateway.connectedUsers.filter(
      (user) => user.id === from,
    );
    const request = await this.userFriendshipRequestRepo.findOne({
      where: {
        requestUid: from,
        uid,
      },
    });
    if (!request) {
      throw new FriendshipRequestNotFound('Friendship request not found!');
    }
    const result = await this.userFriendshipRequestRepo.update(
      {
        requestUid: from,
        uid,
      },
      {
        rejectedAt: new Date(),
      },
    );
    if (userSockets.length) {
      for (const userSocket of userSockets) {
        socket.to(userSocket.socketId).emit('friendship-rejected', { uid });
      }
    }
    return result;
  }

  async block(uid: string, from: string) {
    const socket = this.friendSocketGateway.server;
    const userSockets = this.friendSocketGateway.connectedUsers.filter(
      (user) => user.id === from,
    );
    const request = await this.userFriendshipRequestRepo.findOne({
      where: {
        requestUid: from,
        uid,
      },
    });
    if (!request) {
      throw new FriendshipRequestNotFound('Friendship request not found!');
    }
    const result = await this.userFriendshipRequestRepo.update(
      {
        requestUid: from,
        uid,
      },
      {
        blockedAt: new Date(),
      },
    );
    if (userSockets.length) {
      for (const userSocket of userSockets) {
        socket.to(userSocket.socketId).emit('friendship-blocked', { uid });
      }
    }
    return result;
  }

  async accept(uid: string, from: string) {
    const socket = this.friendSocketGateway.server;
    const userSockets = this.friendSocketGateway.connectedUsers.filter(
      (user) => user.id === from,
    );
    const request = await this.userFriendshipRequestRepo.findOne({
      where: {
        requestUid: from,
        uid,
      },
    });
    if (!request) {
      throw new FriendshipRequestNotFound('Friendship request not found!');
    }
    const result = await this.userFriendshipRequestRepo.update(
      {
        requestUid: from,
        uid,
      },
      {
        acceptedAt: new Date(),
      },
    );
    if (userSockets.length) {
      for (const userSocket of userSockets) {
        socket.to(userSocket.socketId).emit('friendship-accepted', { uid });
      }
    }
    return result;
  }

  async getFriends(uid: string) { }
}
