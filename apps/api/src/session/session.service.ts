import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatService } from 'src/chat/chat.service';
import { NoSessionFoundError } from 'src/lib/errors/session';
import { generateName } from 'src/lib/name-generator';
import { In, IsNull, Repository } from 'typeorm';
import { PleasureSession } from './entities/pleasure-session.entity';
import { User_PleasureSession } from './entities/user_plesure_session.join-entity';
import { SessionGateway } from './session.gateway';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(PleasureSession)
    private readonly sessionRepo: Repository<PleasureSession>,
    @InjectRepository(User_PleasureSession)
    private readonly userSessionRepo: Repository<User_PleasureSession>,
    private readonly sessionGateway: SessionGateway,
    private readonly chatSrv: ChatService,
  ) {}

  async getCurrentSession(uid: string) {
    const session = await this.sessionRepo.findOne({
      where: { user: { uid: uid, active: true } },
      relations: ['user'],
    });
    if (!session) {
      return null;
    }
    const users = await this.userSessionRepo.find({
      where: { pleasureSessionId: session.id },
    });
    return { ...session, user: users };
  }

  async getSession(id: string, uid: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: id, user: [{ uid: uid }] },
      relations: ['user'],
    });
    if (!session) {
      throw new NoSessionFoundError(`No session found with id ${id}`);
    }
    return session;
  }

  async getSessions(uid: string, offset?: number) {
    const total = await this.sessionRepo.count({
      where: { user: { uid: uid } },
    });
    const count = await this.sessionRepo.count({
      where: { user: { uid: uid } },
    });
    const sessions = await this.sessionRepo.find({
      where: { user: { uid: uid } },
      skip: offset,
      take: 10,
      relations: ['user'],
      order: {
        active: 'DESC',
        updatedAt: 'DESC',
      },
    });
    return {
      sessions,
      total,
      offset,
      nextOffset: offset + 10 < count ? offset + 10 : null,
    };
  }

  async searchSessions(uid: string, q: string, offset?: number) {
    const searchResult = (await this.sessionRepo.query(
      `select id from pleasure_session ps inner join user_pleasure_session ups on ps.id = ups."pleasureSessionId" where ups."uid"::text = $1 and (ps."name" ilike $2 or ups.uid::text ilike $2 or ps.id::text ilike $2)`,
      [uid, `%${q}%`],
    )) as { id: string }[];
    const total = searchResult.length;
    const sessions = await this.sessionRepo.find({
      where: { id: In(searchResult.map((r) => r.id)) },
      relations: ['user'],
      order: {
        active: 'DESC',
        updatedAt: 'DESC',
      },
    });
    return { sessions, total, offset };
  }

  async authorizeMember(sessionId: string, uid: string) {
    await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });
    await this.userSessionRepo.update(
      {
        pleasureSessionId: sessionId,
        uid,
      },
      {
        hasControl: true,
      },
    );
  }

  async sendInvite(sessionId: string, uid: string, initiatorUid: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });
    this.sessionGateway.wss.to(uid).emit('pleasure-session-invite', {
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
    this.sessionGateway.wss.to(uid).emit('pleasure-session-invite-answered', {
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

  async create(initiator: string, uids: string[], name?: string) {
    if (!name) name = generateName();
    const session = await this.sessionRepo.save({
      initiatorId: initiator,
      name,
      user: uids.map((uid) => ({
        uid: uid,
        hasControl: uid == initiator ? true : false,
      })),
    });
    await this.chatSrv.createGroupConversation(uids, true, session.id);
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
