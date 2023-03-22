import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import {
  FriendshipRequestAlreadyExists,
  FriendshipRequestBlocked,
  FriendshipRequestNotFound,
  FriendshipAlreadyExists,
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
  ) {}

  async fetchByTo(from: string, to: string) {
    return this.userFriendshipRequestRepo.findOne({
      where: {
        from: to,
        to: from,
      },
    });
  }

  async fetchByFrom(from: string, to: string) {
    return this.userFriendshipRequestRepo.findOne({
      where: {
        from,
        to,
      },
    });
  }

  async emitRequest(from: string, to: string) {
    const socket = this.friendSocketGateway.server;
    const userSockets = this.friendSocketGateway.connectedUsers.filter(
      (user) => user.id === to,
    );
    if (userSockets.length) {
      for (const userSocket of userSockets) {
        socket.to(userSocket.socketId).emit('friendship-request', { from, to });
      }
    }
  }

  async emitAccept(from: string, to: string, byRequest?: boolean) {
    const socket = this.friendSocketGateway.server;
    const userSockets = this.friendSocketGateway.connectedUsers.filter(
      (user) => user.id === from,
    );
    if (userSockets.length) {
      for (const userSocket of userSockets) {
        socket.to(userSocket.socketId).emit('friendship-accept', { from, to });
      }
    }
    if (byRequest) {
      const userSockets = this.friendSocketGateway.connectedUsers.filter(
        (user) => user.id === to,
      );
      if (userSockets.length) {
        for (const userSocket of userSockets) {
          socket
            .to(userSocket.socketId)
            .emit('friendship-accept-by-request', { from, to });
        }
      }
    }
  }

  async requestFriendship(from: string, to: string) {
    const byFrom = await this.fetchByFrom(from, to);
    const byTo = await this.fetchByTo(from, to);
    if (!byFrom && !byTo) {
      // No friendship request exists
      const req = await this.userFriendshipRequestRepo.save({
        from,
        to,
      });
      await this.emitRequest(from, to);
      return req;
    }
    if (
      byFrom &&
      !byFrom.acceptedAt &&
      !byFrom.rejectedAt &&
      !byFrom.blockedAt
    ) {
      // Friendship request exists
      throw new FriendshipRequestAlreadyExists(
        'Friendship request already exists!',
      );
    }
    if (byFrom && byFrom.acceptedAt) {
      // Friendship request exists and was accepted
      throw new FriendshipAlreadyExists('Friendship already exists!');
    }
    if (byFrom && byFrom.rejectedAt) {
      // Friendship request exists but was rejected resend request
      const req = await this.userFriendshipRequestRepo.save({
        from,
        to,
        rejectedAt: null,
      });
      await this.emitRequest(from, to);
      return req;
    }
    if (byFrom && byFrom.blockedAt) {
      // Friendship request exists but user was blocked
      throw new FriendshipRequestBlocked('Friendship request blocked!');
    }
    if (byTo && !byTo.acceptedAt && !byTo.rejectedAt && !byTo.blockedAt) {
      // Friendship request exists outgoing from requested user
      const req = await this.userFriendshipRequestRepo.save({
        from: to,
        to: from,
        acceptedAt: new Date(),
      });
      await this.emitAccept(to, from, true);
      return req;
    }
    if (byTo && byTo.acceptedAt) {
      // Friendship request exists outgoing from requested user and was accepted
      throw new FriendshipRequestAlreadyExists(
        'Friendship request already exists!',
      );
    }
    if (byTo && byTo.rejectedAt) {
      // Friendship request exists outgoing from requested user but was rejected by user reset rejectedAt
      const req = await this.userFriendshipRequestRepo.save({
        from: to,
        to: from,
        rejectedAt: null,
        acceptedAt: new Date(),
      });
      return req;
    }
    if (byTo && byTo.blockedAt) {
      // Friendship request exists outgoing from requested user but was blocked by user reset blockedAt
      const req = await this.userFriendshipRequestRepo.save({
        from: to,
        to: from,
        rejectedAt: null,
        blockedAt: null,
        acceptedAt: new Date(),
      });
      return req;
    }
  }

  async getPending(uid: string) {
    return this.userFriendshipRequestRepo.find({
      where: {
        to: uid,
        acceptedAt: IsNull(),
        rejectedAt: IsNull(),
        blockedAt: IsNull(),
      },
    });
  }

  async reject(from: string, to: string) {
    const request = await this.userFriendshipRequestRepo.findOne({
      where: {
        from,
        to,
      },
    });
    if (!request) {
      throw new FriendshipRequestNotFound('Friendship request not found!');
    }
    const result = await this.userFriendshipRequestRepo.update(
      {
        from,
        to,
      },
      {
        rejectedAt: new Date(),
      },
    );
    return result;
  }

  async block(from: string, to: string) {
    const request = await this.userFriendshipRequestRepo.findOne({
      where: {
        from,
        to,
      },
    });
    if (!request) {
      throw new FriendshipRequestNotFound('Friendship request not found!');
    }
    const result = await this.userFriendshipRequestRepo.update(
      {
        from,
        to,
      },
      {
        blockedAt: new Date(),
      },
    );
    return result;
  }

  async accept(from: string, to: string) {
    const request = await this.userFriendshipRequestRepo.findOne({
      where: {
        from,
        to,
      },
    });
    if (!request) {
      throw new FriendshipRequestNotFound('Friendship request not found!');
    }
    const result = await this.userFriendshipRequestRepo.update(
      {
        from,
        to,
      },
      {
        acceptedAt: new Date(),
      },
    );
    await this.emitAccept(from, to);
    return result;
  }

  async getFriends(uid: string) {
    return this.userFriendshipRequestRepo.find({
      where: {
        from: uid,
        acceptedAt: Not(IsNull()),
        rejectedAt: IsNull(),
        blockedAt: IsNull(),
      },
    });
  }
}
