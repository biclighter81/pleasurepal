import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LovenseCredentials as LovenseCredentialsDto } from './dto/lovense-credentials.dto';
import { LovenseCredentials } from './entities/lovense-credentials.entity';
import { LovenseToy } from './entities/lovense-toy.entity';
import axios from 'axios';
import { QRCodeResponse } from 'src/lib/interfaces/lovense';
import { getDiscordUidByKCId } from 'src/lib/keycloak';
import { ButtonInteraction, CacheType, ComponentType, User } from 'discord.js';
import { SESSION_INVIATION_COMPONENTS } from 'src/lib/interaction-helper';
import { LovenseCredentials_PleasureSession } from './entities/credentials_plesure_session.join-entity';
import { PleasureSession } from './entities/pleasure-session.entity';
import { LOVENSE_HEARTBEAT_INTERVAL } from 'src/lib/utils';
import { DiscordService } from 'src/discord/discord.service';

@Injectable()
export class LovenseService {
  private readonly logger: Logger = new Logger(LovenseService.name);

  constructor(
    @InjectRepository(LovenseCredentials)
    private readonly lovenseCredRepo: Repository<LovenseCredentials>,
    @InjectRepository(LovenseToy)
    private readonly lovenseToyRepo: Repository<LovenseToy>,
    @InjectRepository(LovenseCredentials_PleasureSession)
    private readonly lovenseCredPleasureSessionRepo: Repository<LovenseCredentials_PleasureSession>,
    public readonly discordSrv: DiscordService,
  ) {}

  async callback(body: LovenseCredentialsDto) {
    const existingCreds = await this.lovenseCredRepo.findOne({
      relations: ['toys'],
      where: { uid: body.uid },
    });
    // ignore webhook on unlinked
    if (existingCreds?.unlinked) return;
    const toys = await this.saveCallbackToys(body.toys);
    const credentials = await this.lovenseCredRepo.save({
      ...body,
      toys: toys,
      lastHeartbeat: new Date(),
    });
    // Send message to user if this is the first time linking or if the toys changed
    if (!existingCreds) await this.sendLinkMessage(credentials.uid, 'new-user');
    if (existingCreds && existingCreds.toys.length !== toys.length) {
      await this.sendLinkMessage(credentials.uid, 'new-toys');
    }
    // Send missed invites to user if this is the first time linking or if new heartbeat was sent
    if (
      existingCreds &&
      (!existingCreds?.lastHeartbeat ||
        existingCreds.lastHeartbeat.getTime() <
          Date.now() - LOVENSE_HEARTBEAT_INTERVAL)
    ) {
      await this.sendMissedInvites(credentials);
    }
    return credentials;
  }

  async saveCallbackToys(toys: LovenseCredentialsDto['toys']) {
    return this.lovenseToyRepo.save(
      Object.keys(toys).map((key) => ({
        id: key,
        nickName: toys[key].nickName,
        name: toys[key].name,
        status: toys[key].status,
      })),
    );
  }

  async getCredentials(kcId: string, withoutUnlinked?: boolean) {
    return this.lovenseCredRepo.findOne({
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
    return this.lovenseCredPleasureSessionRepo.find({
      relations: ['pleasureSession'],
      where: {
        lovenseCredentialsUid: kcId,
        pleasureSession: { active: true },
        inviteAccepted: false,
      },
    });
  }

  async sendMissedInvites(credentials: LovenseCredentials) {
    const invites = await this.getSessionInvites(credentials.uid);
    for (const invite of invites) {
      if (invite.pleasureSession.isDiscord) {
        // Send discord invite
        const discordUid = await getDiscordUidByKCId(credentials.uid);
        if (!discordUid) continue;
        const user = await this.discordSrv.getUser(discordUid);
        const initiatorDiscordUid = await getDiscordUidByKCId(
          invite.pleasureSession.initiatorId,
        );
        const initiator = await this.discordSrv.getUser(initiatorDiscordUid);
        if (!user) continue;
        await this.sendInviteMessage({
          user,
          initiator,
          creds: credentials,
          invitedUsers: [],
          session: invite.pleasureSession,
        });
      }
    }
  }

  async unlinkLovense(kcId: string) {
    await this.lovenseCredPleasureSessionRepo.update(
      {
        lovenseCredentialsUid: kcId,
      },
      { active: false },
    );
    return this.lovenseCredRepo.update({ uid: kcId }, { unlinked: true });
  }

  async getLinkQrCode(kcId: string, username: string): Promise<QRCodeResponse> {
    try {
      //reset unlinked flag if it was set
      await this.lovenseCredRepo.update({ uid: kcId }, { unlinked: false });
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
    user: User;
    initiator: User;
    session: PleasureSession;
    invitedUsers: User[];
    creds: LovenseCredentials;
    initiatorInteraction?: ButtonInteraction<CacheType>;
  }) {
    if (!props.invitedUsers.length) {
      const invites = await this.lovenseCredPleasureSessionRepo.find({
        where: {
          pleasureSessionId: props.session.id,
        },
      });
      props.invitedUsers = await Promise.all(
        invites
          .filter((i) => i.lovenseCredentialsUid != props.session.initiatorId)
          .map(async (i) => {
            const uid = await getDiscordUidByKCId(i.lovenseCredentialsUid);
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
        await this.lovenseCredPleasureSessionRepo.save({
          lovenseCredentialsUid: props.creds.uid,
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
