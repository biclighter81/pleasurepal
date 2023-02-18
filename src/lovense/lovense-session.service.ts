import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ButtonInteraction, CacheType, ComponentType, User } from 'discord.js';
import { SESSION_INVIATION_COMPONENTS } from 'src/lib/interaction-helper';
import { getDiscordUidByKCId, getKCUserByDiscordId } from 'src/lib/keycloak';
import { INVITED_NOT_LINKED, INVITED_NO_ACCOUNT } from 'src/lib/reply-messages';
import { Repository } from 'typeorm';
import { LovenseFunctionCommand } from './dto/lovense-command.dto';
import { LovenseCredentials_DiscordSession } from './entities/credentials_discord_session.join-entity';
import { LovenseActionQueue } from './entities/lovense-action-queue.entity';
import { LovenseCredentials } from './entities/lovense-credentials.entity';
import { LovenseDiscordSession } from './entities/lovense-discord-session.entity';
import { LovenseService } from './lovense.service';

@Injectable()
export class LovenseSessionService {
  private readonly logger: Logger = new Logger(LovenseSessionService.name);

  constructor(
    @InjectRepository(LovenseDiscordSession)
    private readonly lovenseDiscordSessionRepo: Repository<LovenseDiscordSession>,
    @InjectRepository(LovenseCredentials)
    private readonly lovenseCredRepo: Repository<LovenseCredentials>,
    @InjectRepository(LovenseActionQueue)
    private readonly actionQueueRepo: Repository<LovenseActionQueue>,
    @InjectRepository(LovenseCredentials_DiscordSession)
    private readonly lovenseCredDiscordSessionRepo: Repository<LovenseCredentials_DiscordSession>,
    private readonly lovenseSrv: LovenseService,
  ) {}

  async getCurrentSession(
    kcId: string,
  ): Promise<LovenseDiscordSession | undefined> {
    const session = await this.lovenseDiscordSessionRepo.findOne({
      where: {
        active: true,
        credentials: {
          lovenseCredentialsUid: kcId,
          active: true,
        },
      },
      relations: ['credentials'],
    });
    return session;
  }

  async createSession(uids: string[], initiatorUid: string) {
    const initiator = await getKCUserByDiscordId(initiatorUid);
    // Disable all previous sessions for this user
    await this.lovenseDiscordSessionRepo.update(
      {
        initiatorId: initiator.id,
      },
      {
        active: false,
      },
    );
    let userCredentials: LovenseCredentials[] = [];
    for (const uid of uids) {
      const kcUser = await getKCUserByDiscordId(uid);
      // Handle users that have not linked their discord accounts
      if (!kcUser) continue;
      const creds = await this.lovenseCredRepo.findOne({
        where: { uid: kcUser.id },
      });
      // Handle users that have not linked their lovense accounts
      if (!creds) continue;
      userCredentials.push(creds);
    }
    const session = await this.lovenseDiscordSessionRepo.save(
      {
        initiatorId: initiator.id,
        credentials: userCredentials.map((c) => {
          return {
            lovenseCredentialsUid: c.uid,
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
    credentials: LovenseCredentials,
  ) {
    // Get session with all users which have accepted the invite
    const session = await this.lovenseDiscordSessionRepo.findOne({
      where: {
        id: sessionId,
        active: true,
        credentials: {
          lovenseDiscordSessionId: sessionId,
          inviteAccepted: true,
          active: true,
        },
      },
      relations: ['credentials'],
    });
    if (!session) throw new Error('No session found');
    // Check if user has control over the session
    const userHasControl = session.credentials.some(
      (c) => c.lovenseCredentialsUid === credentials.uid && c.hasControl,
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
      const allPromises = session.credentials.map((p) =>
        this.lovenseSrv.sendLovenseFunction({
          kcId: p.lovenseCredentialsUid,
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
    const initiator = await this.lovenseSrv.discordClient.users.fetch(
      initiatorUid,
    );
    // Fetch KC users from discord ids
    const invitedUsers = await Promise.all(
      uids
        .filter((uid) => uid != initiator.id)
        .map(async (uid) => {
          const user = await this.lovenseSrv.discordClient.users.fetch(uid);
          return user;
        }),
    );
    // Create session
    const session = await this.createSession(uids, initiatorUid);

    let incompletedAccounts: User[] = [];
    // Send invites
    for (const user of invitedUsers) {
      const kcUser = await getKCUserByDiscordId(user.id);
      // Handle users that have not linked their discord accounts
      if (!kcUser) {
        await user.send(INVITED_NO_ACCOUNT(initiator.username));
        incompletedAccounts.push(user);
        continue;
      }
      const creds = await this.lovenseCredRepo.findOne({
        where: { uid: kcUser.id },
      });
      if (!creds) {
        await user.send(INVITED_NOT_LINKED(initiator.username));
        incompletedAccounts.push(user);
        continue;
      }
      // Send invite message
      await this.sendInviteMessage({
        user,
        initiator,
        session,
        invitedUsers,
        creds,
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

  async sendInviteMessage(props: {
    user: User;
    initiator: User;
    session: LovenseDiscordSession;
    invitedUsers: User[];
    creds: LovenseCredentials;
    initiatorInteraction: ButtonInteraction<CacheType>;
  }) {
    const msg = await props.user.send({
      content: `\`@${
        props.initiator.username
      }\` has invited you to Lovense session \`#${
        props.session.id
      }\`!\nThese are the invited users: \`@${props.invitedUsers
        .map((u) => u.username)
        .join('`, `@')}\``,
      components: SESSION_INVIATION_COMPONENTS,
    });
    const buttonCollector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000,
    });
    buttonCollector.on('collect', async (i) => {
      if (i.customId == 'joinSession') {
        //User has accepted the session
        //Update session to add user
        await this.lovenseCredDiscordSessionRepo.save({
          lovenseCredentialsUid: props.creds.uid,
          lovenseDiscordSessionId: props.session.id,
          inviteAccepted: true,
          lastActive: new Date(),
        });

        props.initiatorInteraction.followUp({
          content: `\`@${props.user.username}\` has joined the session!`,
        });
        i.reply({
          content: `You have joined the session \`${props.session.id}\`!\nYou can leave the session by typing \`/leave\`.`,
        });
      }
      if (i.customId == 'declineSession') {
        //User has declined the session
        props.initiatorInteraction.followUp({
          content: `\`@${props.user.username}\` has declined the session!`,
        });
        i.reply({
          content: `You have declined the session!`,
        });
      }
    });
    buttonCollector.on('end', async (collected, reason) => {
      if (reason == 'time') {
        msg.edit({
          content: `:x: The session invite to session \`${props.session.id}\` from <@${props.initiator.id}> has expired!`,
        });
      }
    });
  }

  async leaveSession(uid: string, session: LovenseDiscordSession) {
    //pass rights to next user
    const nextUser = session.credentials.find((c) => c.inviteAccepted);
    if (nextUser && nextUser.lovenseCredentialsUid != uid) {
      //pass session rights to next user
      await this.lovenseCredDiscordSessionRepo.update(
        {
          lovenseCredentialsUid: nextUser.lovenseCredentialsUid,
          lovenseDiscordSessionId: session.id,
        },
        {
          hasControl: true,
        },
      );
      const discordUid = await getDiscordUidByKCId(
        nextUser.lovenseCredentialsUid,
      );
      await this.lovenseSrv.sendDiscordMessageToUser(
        discordUid,
        `The session intiator has left the current session \`#${session.id}}\`. You now have control of the toys.`,
      );
    }
    await this.lovenseCredDiscordSessionRepo.update(
      {
        lovenseCredentialsUid: uid,
        lovenseDiscordSessionId: session.id,
      },
      {
        active: false,
        hasControl: false,
      },
    );
  }
}
