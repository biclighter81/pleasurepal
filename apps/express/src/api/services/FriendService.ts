import { inject, injectable } from "inversify";
import { UserFriendshipRequest } from "../../lib/entities/user-friendship-request.entity";
import { FriendshipAlreadyExists, FriendshipRequestAlreadyExists, FriendshipRequestBlocked, FriendshipRequestNotFound } from "../../lib/errors/friend";
import { getKCUserById } from "../../lib/keycloak";
import TYPES from "../../lib/symbols";
import { IsNull, Repository } from "typeorm";
import { Socket } from "../services/Socket";

@injectable()
export class FriendService {

  public constructor(
    @inject(TYPES.UserFriendShipRequestRepository) private userFriendshipRequestRepo: Repository<UserFriendshipRequest>,
    @inject(TYPES.Socket) private socket: Socket,
  ) { }

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
    const server = this.socket.getServer();
    server.to(to).emit('friendship-request', { from, to });
  }

  async emitAccept(from: string, to: string, byRequest?: boolean) {
    const server = this.socket.getServer();
    server.to(from).emit('friendship-accept', { from, to });
    server.to(to).emit('friend-online', { uid: from });
    if (byRequest) {
      server.to(to).emit('friendship-accept-by-request', { from, to });
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
    const friends = await this.userFriendshipRequestRepo
      .createQueryBuilder()
      .where('"from" = :uid', { uid })
      .orWhere('"to" = :uid', { uid })
      .andWhere('"acceptedAt" IS NOT NULL')
      .andWhere('"rejectedAt" IS NULL')
      .andWhere('"blockedAt" IS NULL')
      .getMany();
    const users = await Promise.all(
      friends.map(async (friend) => {
        const friendUid = friend.from === uid ? friend.to : friend.from;
        return getKCUserById(friendUid);
      }),
    );
    return friends.map((f) => {
      const friendUid = f.from === uid ? f.to : f.from;
      const friend = users.find((u) => u.id === friendUid);
      return {
        ...f,
        username: friend.username,
        email: friend.email,
        uid: friendUid,
      };
    });
  }

  async getFriend(uid: string, friendUid: string) {
    const friend = await this.userFriendshipRequestRepo
      .createQueryBuilder()
      .where('("from" = :uid OR "to" = :uid)', { uid })
      .andWhere('("from" = :friendUid OR "to" = :friendUid)', { friendUid })
      .andWhere('"acceptedAt" IS NOT NULL')
      .andWhere('"rejectedAt" IS NULL')
      .andWhere('"blockedAt" IS NULL')
      .getOne();
    const user = await getKCUserById(friendUid);
    return {
      ...friend,
      username: user.username,
      email: user.email,
    };
  }

  async emitOnline(sub: string) {
    const friends = await this.getFriends(sub);
    const server = this.socket.getServer();
    for (const friend of friends) {
      server.to(friend.to == sub ? friend.from : friend.to)
        .emit('friend-online', {
          uid: sub,
        });
    }
  }

}