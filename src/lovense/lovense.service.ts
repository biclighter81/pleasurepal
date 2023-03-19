import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LovenseUser } from './dto/lovense-user.dto';
import { LovenseToy } from './entities/lovense-toy.entity';
import axios from 'axios';
import { QRCodeResponse } from 'src/lib/interfaces/lovense';
import { getDiscordUidByKCId } from 'src/lib/keycloak';
import {
  ButtonInteraction,
  CacheType,
  ComponentType,
  User as DiscordUser,
} from 'discord.js';
import { SESSION_INVIATION_COMPONENTS } from 'src/lib/interaction-helper';
import { PleasureSession } from './entities/pleasure-session.entity';
import { LOVENSE_HEARTBEAT_INTERVAL } from 'src/lib/utils';
import { DiscordService } from 'src/discord/discord.service';
import { User } from 'src/user/entities/user.entity';
import { User_PleasureSession } from './entities/user_plesure_session.join-entity';

@Injectable()
export class LovenseService {
  private readonly logger: Logger = new Logger(LovenseService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(LovenseToy)
    private readonly lovenseToyRepo: Repository<LovenseToy>,
    @InjectRepository(User_PleasureSession)
    private readonly userPleasureSessionRepo: Repository<User_PleasureSession>,
    public readonly discordSrv: DiscordService,
  ) {}

  async callback(body: LovenseUser) {
    const existingUser = await this.userRepo.findOne({
      relations: ['toys'],
      where: { uid: body.uid },
    });
    // ignore webhook on unlinked
    if (existingUser?.unlinked) return;
    const toys = await this.saveCallbackToys(body.toys);
    const user = await this.userRepo.save({
      ...body,
      toys: toys,
      lastHeartbeat: new Date(),
    });
    // Send message to user if this is the first time linking or if the toys changed
    if (!existingUser) await this.sendLinkMessage(user.uid, 'new-user');
    if (existingUser && existingUser.toys.length !== toys.length) {
      await this.sendLinkMessage(user.uid, 'new-toys');
    }
    // Send missed invites to user if this is the first time linking or if new heartbeat was sent
    if (
      existingUser &&
      (!existingUser?.lastHeartbeat ||
        existingUser.lastHeartbeat.getTime() <
          Date.now() - LOVENSE_HEARTBEAT_INTERVAL)
    ) {
      await this.sendMissedInvites(user);
    }
    return user;
  }

  async saveCallbackToys(toys: LovenseUser['toys']) {
    return this.lovenseToyRepo.save(
      Object.keys(toys).map((key) => ({
        id: key,
        nickName: toys[key].nickName,
        name: toys[key].name,
        status: toys[key].status,
      })),
    );
  }

  async getUser(kcId: string, withoutUnlinked?: boolean) {
    return this.userRepo.findOne({
      relations: ['toys'],
      where: { uid: kcId, unlinked: withoutUnlinked ? false : undefined },
    });
  }

  async sendLinkMessage(kcId: string, reason: 'new-user' | 'new-toys') {
    const discordUid = await getDiscordUidByKCId(kcId);
    //send update in pleasure webapp and discord if linked
    switch (reason) {
      case 'new-user':
        if (discordUid) {
          await this.discordSrv.sendMessage(
            discordUid,
            `Your Lovense toys have been linked to your account!`,
          );
        }
        break;
      case 'new-toys':
        if (discordUid) {
          await this.discordSrv.sendMessage(
            discordUid,
            `Your Lovense toys have been updated!`,
          );
        }
        break;
    }
  }

  async getSessionInvites(kcId: string) {
    return this.userPleasureSessionRepo.find({
      relations: ['pleasureSession'],
      where: {
        uid: kcId,
        pleasureSession: { active: true },
        inviteAccepted: false,
      },
    });
  }

  async sendMissedInvites(user: User) {
    const invites = await this.getSessionInvites(user.uid);
    for (const invite of invites) {
      if (invite.pleasureSession.isDiscord) {
        // Send discord invite
        const discordUid = await getDiscordUidByKCId(user.uid);
        if (!discordUid) continue;
        const discordUser = await this.discordSrv.getUser(discordUid);
        const initiatorDiscordUid = await getDiscordUidByKCId(
          invite.pleasureSession.initiatorId,
        );
        const initiator = await this.discordSrv.getUser(initiatorDiscordUid);
        if (!user) continue;
        await this.sendInviteMessage({
          user: discordUser,
          initiator,
          lovenseUser: user,
          invitedUsers: [],
          session: invite.pleasureSession,
        });
      }
    }
  }

  async unlinkLovense(kcId: string) {
    await this.userPleasureSessionRepo.update(
      {
        uid: kcId,
      },
      { active: false },
    );
    return this.userRepo.update({ uid: kcId }, { unlinked: true });
  }

  async getLinkQrCode(kcId: string, username: string): Promise<QRCodeResponse> {
    try {
      //reset unlinked flag if it was set
      await this.userRepo.update({ uid: kcId }, { unlinked: false });
      const res = await axios.post<QRCodeResponse>(
        `https://api.lovense-api.com/api/lan/getQrCode`,
        {
          uid: kcId,
          username: username,
          token: process.env.LOVENSE_API_TOKEN,
        },
      );
      return res.data;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async sendInviteMessage(props: {
    user: DiscordUser;
    initiator: DiscordUser;
    session: PleasureSession;
    invitedUsers: DiscordUser[];
    lovenseUser: User;
    initiatorInteraction?: ButtonInteraction<CacheType>;
  }) {
    if (!props.invitedUsers.length) {
      const invites = await this.userPleasureSessionRepo.find({
        where: {
          pleasureSessionId: props.session.id,
        },
      });
      props.invitedUsers = await Promise.all(
        invites
          .filter((i) => i.uid != props.session.initiatorId)
          .map(async (i) => {
            const uid = await getDiscordUidByKCId(i.uid);
            const user = await this.discordSrv.getUser(uid);
            return user;
          }),
      );
    }
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
        await this.userPleasureSessionRepo.save({
          uid: props.lovenseUser.uid,
          pleasureSessionId: props.session.id,
          inviteAccepted: true,
          lastActive: new Date(),
        });

        if (props.initiatorInteraction) {
          props.initiatorInteraction?.followUp({
            content: `\`@${props.user.username}\` has joined the session!`,
          });
        } else {
          props.initiator.send({
            content: `\`@${props.user.username}\` has joined the session!`,
          });
        }
        i.reply({
          content: `You have joined the session \`${props.session.id}\`!\nYou can leave the session by typing \`/leave\`.`,
        });
      }
      if (i.customId == 'declineSession') {
        //User has declined the session
        if (props.initiatorInteraction) {
          props.initiatorInteraction?.followUp({
            content: `\`@${props.user.username}\` has declined the session!`,
          });
        } else {
          props.initiator.send({
            content: `\`@${props.user.username}\` has declined the session!`,
          });
        }
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
}
