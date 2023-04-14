import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NoSessionFoundError } from 'src/lib/errors/session';
import { SocketGateway } from 'src/socket.gateway';
import { IsNull, Repository } from 'typeorm';
import { PleasureSession } from './entities/pleasure-session.entity';
import { User_PleasureSession } from './entities/user_plesure_session.join-entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(PleasureSession)
    private readonly sessionRepo: Repository<PleasureSession>,
    @InjectRepository(User_PleasureSession)
    private readonly userSessionRepo: Repository<User_PleasureSession>,
    private readonly socketGateway: SocketGateway,
  ) {}

  async getCurrentSession(uid: string) {
    return this.sessionRepo.findOne({
      where: { user: { uid: uid, active: true } },
      relations: ['user'],
    });
  }

  async authorizeMember(sessionId: string, uid: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });
    await this.sessionRepo.update(sessionId, {
      user: [...session.user, { uid: uid, hasControl: true }],
    });
  }

  async sendInvite(sessionId: string, uid: string, initiatorUid: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });
    this.socketGateway.server.to(uid).emit('pleasure-session-invite', {
      sessionId: session.id,
      initiatorUid,
    });
  }

  async acceptInvite(sessionId: string, uid: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });
    if (
      !session ||
      !session.user.find((u) => u.uid == uid) ||
      session.user.find((u) => u.uid == uid).inviteAccepted != null
    ) {
      throw new NoSessionFoundError('No session found!');
    }
    return await this.userSessionRepo.update(
      {
        pleasureSessionId: sessionId,
        uid,
      },
      {
        inviteAccepted: true,
        active: true,
        lastActive: new Date(),
      },
    );
  }

  async declineInvite(sessionId: string, uid: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });
    if (!session || !session.user.find((u) => u.uid == uid)) {
      throw new NoSessionFoundError('No session found!');
    }
    return await this.userSessionRepo.update(
      {
        pleasureSessionId: sessionId,
        uid,
      },
      {
        inviteAccepted: false,
        active: false,
        lastActive: new Date(),
      },
    );
  }

  async inviteAnswered(sessionId: string, uid: string) {
    this.socketGateway.server.to(uid).emit('pleasure-session-invite-answered', {
      sessionId,
    });
  }

  async getInvites(uid: string) {
    const session = await this.sessionRepo.find({
      where: { user: { uid: uid, active: true, inviteAccepted: IsNull() } },
      relations: ['user'],
    });
    return session.map((session) => ({
      sessionId: session.id,
      initiatorUid: session.initiatorId,
    }));
  }

  async create(initiator: string, uids: string[]) {
    const session = await this.sessionRepo.save({
      initiatorId: initiator,
      user: uids.map((uid) => ({ uid: uid })),
    });
    return session;
  }

  async leave(sessionId: string, uid: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });
    await this.userSessionRepo.update(
      {
        pleasureSessionId: sessionId,
        uid,
      },
      {
        active: false,
      },
    );
    if (session.user.length > 1) {
      await this.authorizeMember(
        session.id,
        session.user.find((u) => u.uid != uid).uid,
      );
    }
  }
}
