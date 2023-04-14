import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  NoSessionFoundError,
  UserNotInSessionError,
} from 'src/lib/errors/session';
import { Repository } from 'typeorm';
import { PleasureSession } from './entities/pleasure-session.entity';
import { User_PleasureSession } from './entities/user_plesure_session.join-entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(PleasureSession)
    private readonly sessionRepo: Repository<PleasureSession>,
    @InjectRepository(User_PleasureSession)
    private readonly userSessionRepo: Repository<User_PleasureSession>,
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
    if (!session)
      throw new NoSessionFoundError(`No session found for id ${sessionId}!`);
    if (!session.user.some((user) => user.uid === uid))
      throw new UserNotInSessionError(
        `User ${uid} is not in session ${sessionId}!`,
      );
    await this.sessionRepo.update(sessionId, {
      user: [...session.user, { uid: uid, hasControl: true }],
    });
  }

  async sendInvite() {}

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
    if (!session)
      throw new NoSessionFoundError(`No session found for id ${sessionId}!`);
    if (!session.user.some((user) => user.uid === uid))
      throw new UserNotInSessionError(
        `User ${uid} is not in session ${sessionId}!`,
      );
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
