import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ButtonInteraction,
  CacheType,
  CommandInteraction,
  User as DiscordUser,
} from 'discord.js';
import { DiscordService } from 'src/discord/discord.service';
import { KeycloakUser } from 'src/lib/interfaces/keycloak';
import { getDiscordUidByKCId, getKCUserByDiscordId } from 'src/lib/keycloak';
import {
  INVITED_NOT_LINKED,
  INVITED_NO_ACCOUNT,
  NEED_TO_REGISTER_PLEASUREPAL,
} from 'src/lib/reply-messages';
import { LOVENSE_HEARTBEAT_INTERVAL } from 'src/lib/utils';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { LovenseFunctionCommand } from './dto/lovense-command.dto';
import { LovenseActionQueue } from './entities/lovense-action-queue.entity';
import { PleasureSession } from './entities/pleasure-session.entity';
import { User_PleasureSession } from './entities/user_plesure_session.join-entity';
import { LovenseControlSservice } from './lovense-control.service';
import { LovenseService } from './lovense.service';

@Injectable()
export class LovenseSessionService {
  private readonly logger: Logger = new Logger(LovenseSessionService.name);

  constructor(
    @InjectRepository(PleasureSession)
    private readonly pleasureSessionRepo: Repository<PleasureSession>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(LovenseActionQueue)
    private readonly actionQueueRepo: Repository<LovenseActionQueue>,
    @InjectRepository(User_PleasureSession)
    private readonly userPleasureSessionRepo: Repository<User_PleasureSession>,
    private readonly lovenseSrv: LovenseService,
    private readonly lovenseControlSrv: LovenseControlSservice,
    private readonly discordSrv: DiscordService,
  ) {}

  async getCurrentSession(kcId: string): Promise<PleasureSession | undefined> {
    const session = await this.pleasureSessionRepo.findOne({
      where: {
        active: true,
        user: {
          uid: kcId,
          active: true,
        },
      },
      relations: ['user'],
    });
    return session;
  }

  async getSessionDiscordUsers(
    sessionId: string,
  ): Promise<(DiscordUser & { kcId: string })[]> {
    const session = await this.pleasureSessionRepo.findOne({
      where: {
        id: sessionId,
      },
      relations: ['user'],
    });
    const users = [];
    for (const cred of session.user) {
      const discordUid = await getDiscordUidByKCId(cred.uid);
      const user = await this.discordSrv.getUser(discordUid);
      if (user) {
        users.push({
          ...user,
          kcId: cred.uid,
        });
      }
    }
    return users;
  }

  async authorizeUser(sessionId: string, kcId: string) {
    await this.userPleasureSessionRepo.update(
      {
        pleasureSessionId: sessionId,
        uid: kcId,
      },
      {
        hasControl: true,
      },
    );
  }

  async validateDiscordSessionReq(interaction: CommandInteraction): Promise<
    | {
        kcUser: KeycloakUser;
        user: User;
        session: PleasureSession;
      }
    | undefined
  > {
    const kcUser = await getKCUserByDiscordId(interaction.user.id);
    if (!kcUser) {
      await interaction.reply(NEED_TO_REGISTER_PLEASUREPAL);
      return undefined;
    }
    const user = await this.lovenseSrv.getUser(kcUser.id);
    if (
      !user ||
      !user.lastHeartbeat ||
      user.lastHeartbeat.getTime() < Date.now() - LOVENSE_HEARTBEAT_INTERVAL
    ) {
      const qr = await this.lovenseSrv.getLinkQrCode(
        kcUser.id,
        kcUser.username,
      );
      await this.discordSrv.pollLinkStatus(interaction, qr, kcUser.id);
      return undefined;
    }
    const session = await this.getCurrentSession(kcUser.id);
    if (!session) {
      await interaction.reply({
        content:
          ':x: You are currently not in a pleasurepal session! Create one with `/session`',
        ephemeral: true,
      });
      return undefined;
    }
    return {
      kcUser,
      user,
      session,
    };
  }

  async getCommandQueue(sessionId: string): Promise<LovenseActionQueue[]> {
    return await this.actionQueueRepo.find({
      where: {
        sessionId,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async createSession(uids: string[], initiatorUid: string) {
    const initiator = await getKCUserByDiscordId(initiatorUid);
    // Disable all previous sessions for this user
    await this.pleasureSessionRepo.update(
      {
        initiatorId: initiator.id,
      },
      {
        active: false,
      },
    );
    let users: User[] = [];
    for (const uid of uids) {
      const kcUser = await getKCUserByDiscordId(uid);
      // Handle users that have not linked their discord accounts
      if (!kcUser) continue;
      let user = await this.userRepo.findOne({
        where: { uid: kcUser.id },
      });
      // Handle users that have not linked their lovense accounts
      if (!user) {
        // send message to user
        user = await this.userRepo.save({
          uid: kcUser.id,
        });
      }
      users.push(user);
    }
    const session = await this.pleasureSessionRepo.save(
      {
        initiatorId: initiator.id,
        isDiscord: true,
        user: users.map((c) => {
          return {
            uid: c.uid,
            inviteAccepted: c.uid == initiator.id,
            hasControl: c.uid == initiator.id,
          };
        }),
      },
      {},
    );
    return session;
  }

  async sendSessionCommand(
    sessionId: string,
    command: LovenseFunctionCommand,
    user: User,
  ) {
    // Get session with all users which have accepted the invite
    const session = await this.pleasureSessionRepo.findOne({
      where: {
        id: sessionId,
        active: true,
        user: {
          pleasureSessionId: sessionId,
          inviteAccepted: true,
          active: true,
        },
      },
      relations: ['user'],
    });
    if (!session) throw new Error('No session found');
    // Check if user has control over the session
    const userHasControl = session.user.some(
      (c) => c.uid === user.uid && c.hasControl,
    );
    if (!userHasControl)
      throw new Error(
        'You do not have control over this session! Ask the initiator to give you control.',
      );
    // Add command to session queue
    const queue = await this.actionQueueRepo.find({
      where: {
        sessionId: session.id,
      },
    });
    // increase index of latest action by 1
    const maxIndex = !queue.length
      ? -1
      : Math.max(...queue.map((q) => q.index));
    // save action
    const newAction = await this.actionQueueRepo.save({
      sessionId: session.id,
      index: maxIndex + 1,
      action: JSON.stringify(command),
      startedAt: maxIndex === -1 ? new Date() : null,
    });

    // if first action in queue, send command to all users directly
    if (!queue.length) {
      const allPromises = session.user.map((p) =>
        this.lovenseControlSrv.sendLovenseFunction({
          kcId: p.uid,
          ...command,
        }),
      );
      return await Promise.all(allPromises);
    }
    return newAction;
  }

  async sendSessionInvites(
    uids: string[],
    initiatorUid: string,
    initiatorInteraction: ButtonInteraction<CacheType>,
  ) {
    const initiator = await this.discordSrv.getUser(initiatorUid);
    // Fetch KC users from discord ids
    const invitedUsers = await Promise.all(
      uids
        .filter((uid) => uid != initiator.id)
        .map(async (uid) => {
          const user = await this.lovenseSrv.discordSrv.getUser(uid);
          return user;
        }),
    );
    // Create session
    const session = await this.createSession(uids, initiatorUid);

    let incompletedAccounts: DiscordUser[] = [];
    // Send invites
    for (const user of invitedUsers) {
      const kcUser = await getKCUserByDiscordId(user.id);
      // Handle users that have not linked their discord accounts
      if (!kcUser) {
        await user.send(INVITED_NO_ACCOUNT(initiator.username)); //todo: send invite link to join after account completion
        incompletedAccounts.push(user);
        continue;
      }
      const lovenseUser = await this.userRepo.findOne({
        where: { uid: kcUser.id },
      });
      if (
        !lovenseUser ||
        !lovenseUser.lastHeartbeat ||
        lovenseUser.lastHeartbeat.getTime() <
          Date.now() - LOVENSE_HEARTBEAT_INTERVAL
      ) {
        const qr = await this.lovenseSrv.getLinkQrCode(kcUser.id, kcUser.id);
        this.discordSrv
          .pollLinkStatus(user, qr, kcUser.id)
          .then(async (success) => {
            if (success) {
              user.send(
                ':white_check_mark: We have noticed that you have opened the Lovense Remote app and successfully linked your account. You have now access to the session, you have been invited to. :smirk:',
              );
              await this.userPleasureSessionRepo.update(
                {
                  pleasureSessionId: session.id,
                  uid: kcUser.id,
                },
                {
                  active: true,
                  inviteAccepted: true,
                },
              );
            }
          });
        continue;
      }
      // Send invite message
      await this.lovenseSrv.sendInviteMessage({
        user,
        initiator,
        session,
        invitedUsers,
        lovenseUser,
        initiatorInteraction,
      });
    }

    //make incompletedAccounts distinct by there id
    const distinctUids = [...new Set(incompletedAccounts.map((u) => u.id))];
    incompletedAccounts = distinctUids.map((uid) => {
      return incompletedAccounts.find((u) => u.id == uid);
    });

    return {
      session,
      incompletedAccounts,
    };
  }

  async leaveSession(uid: string, session: PleasureSession) {
    //pass rights to next user
    const invites = await this.userPleasureSessionRepo.find({
      where: {
        pleasureSessionId: session.id,
        active: true,
      },
    });
    const nextUser = invites.find((i) => i.inviteAccepted && i.uid != uid);
    if (nextUser) {
      //pass session rights to next user
      await this.userPleasureSessionRepo.update(
        {
          uid: nextUser.uid,
          pleasureSessionId: session.id,
        },
        {
          hasControl: true,
        },
      );
      const discordUid = await getDiscordUidByKCId(nextUser.uid);
      await this.discordSrv.sendMessage(
        discordUid,
        `The session intiator has left the current session \`#${session.id}}\`. You now have control of the toys.`,
      );
    }
    await this.userPleasureSessionRepo.update(
      {
        uid: uid,
        pleasureSessionId: session.id,
      },
      {
        active: false,
        hasControl: false,
      },
    );
  }
}
