import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LovenseCredentials as LovenseCredentialsDto } from './dto/lovense-credentials.dto';
import { LovenseCredentials } from './entities/lovense-credentials.entity';
import { LovenseToy } from './entities/lovense-toy.entity';
import axios from 'axios';
import { QRCodeResponse } from 'src/lib/interfaces/lovense';
import { getDiscordUidByKCId, getKCUserByDiscordId } from 'src/lib/keycloak';
import { InjectDiscordClient } from '@discord-nestjs/core';
import {
  ButtonInteraction,
  CacheType,
  Client,
  CommandInteraction,
  ComponentType,
  Message,
  User,
} from 'discord.js';
import { LovenseFunctionCommand } from './dto/lovense-command.dto';
import { LOVENSE_QR_CODE_GENERATION_ERROR } from 'src/lib/reply-messages';
import {
  buildLovenseQrCodeEmbed,
  SESSION_INVIATION_COMPONENTS,
} from 'src/lib/interaction-helper';
import { LovenseCredentials_PleasureSession } from './entities/credentials_plesure_session.join-entity';
import { KeycloakUser } from 'src/lib/interfaces/keycloak';
import { PleasureSession } from './entities/pleasure-session.entity';
import { LOVENSE_HEARTBEAT_INTERVAL } from 'src/lib/utils';

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
    @InjectDiscordClient()
    public readonly discordClient: Client,
  ) {}

  async callback(body: LovenseCredentialsDto) {
    const existingCreds = await this.lovenseCredRepo.findOne({
      relations: ['toys'],
      where: { uid: body.uid },
    });
    // ignore webhook on unlinked
    if (existingCreds?.unlinked) return;
    const toys = await this.lovenseToyRepo.save(
      Object.keys(body.toys).map((key) => ({
        id: key,
        nickName: body.toys[key].nickName,
        name: body.toys[key].name,
        status: body.toys[key].status,
      })),
    );
    const credentials = await this.lovenseCredRepo.save({
      ...body,
      toys: toys,
      lastHeartbeat: new Date(),
    });
    // Send success message to user if this is the first time linking or if the toys changed
    if (!existingCreds || existingCreds.toys.length !== toys.length) {
      const discordUid = await getDiscordUidByKCId(body.uid);
      if (!discordUid) return credentials;
      if (!credentials.toys.length) {
        await this.sendDiscordMessageToUser(
          discordUid,
          `Your Lovense toys have been unlinked from your account!`,
        );
        return credentials;
      }
      await this.sendDiscordMessageToUser(
        discordUid,
        `Your Lovense toy(s): ${toys
          .map((t) => t.nickName || t.name)
          .join(',')} are now linked to your account!`,
      );
    }
    // Send missed invites to user if this is the first time linking
    if (
      existingCreds &&
      (!existingCreds?.lastHeartbeat ||
        existingCreds.lastHeartbeat.getTime() <
          Date.now() - LOVENSE_HEARTBEAT_INTERVAL)
    ) {
      const sessionInvites = await this.lovenseCredPleasureSessionRepo.find({
        relations: ['pleasureSession'],
        where: {
          lovenseCredentialsUid: body.uid,
          pleasureSession: { active: true },
          inviteAccepted: false,
        },
      });
      for (const invite of sessionInvites) {
        if (invite.pleasureSession.isDiscord) {
          // Send discord invite
          const discordUid = await getDiscordUidByKCId(body.uid);
          if (!discordUid) continue;
          const user = await this.discordClient.users.fetch(discordUid);
          const initiatorDiscordUid = await getDiscordUidByKCId(
            invite.pleasureSession.initiatorId,
          );
          const initiator = await this.discordClient.users.fetch(
            initiatorDiscordUid,
          );
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
    return credentials;
  }

  async getCredentials(kcId: string, withoutUnlinked?: boolean) {
    return this.lovenseCredRepo.findOne({
      relations: ['toys'],
      where: { uid: kcId, unlinked: withoutUnlinked ? false : undefined },
    });
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

  async sendLinkQr(
    kcUser: KeycloakUser,
    interaction: CommandInteraction | User,
    hasReplied?: boolean,
  ) {
    let qr: QRCodeResponse;
    try {
      qr = await this.getLinkQrCode(kcUser.id, kcUser.username);
    } catch (e) {
      console.error(e);
      if (interaction instanceof CommandInteraction) {
        await interaction.followUp(LOVENSE_QR_CODE_GENERATION_ERROR);
      } else {
        await interaction.send(LOVENSE_QR_CODE_GENERATION_ERROR);
      }
      return;
    }
    const embedBuilder = buildLovenseQrCodeEmbed(qr.message);
    let message: Message;
    if (hasReplied && interaction instanceof CommandInteraction) {
      await interaction.editReply({
        embeds: [embedBuilder.toJSON()],
        components: [],
      });
    } else if (interaction instanceof CommandInteraction) {
      await interaction.reply({
        ephemeral: true,
        embeds: [embedBuilder.toJSON()],
        components: [],
      });
    } else {
      message = await interaction.send({
        embeds: [embedBuilder.toJSON()],
      });
    }
    //check if user has linked their toys every 3 seconds
    let tries = 0;
    const interval = setInterval(async () => {
      tries++;
      //stop after 5 minutes
      if (tries > 100) {
        clearInterval(interval);
        return;
      }
      const creds = await this.lovenseCredRepo.findOne({
        where: { uid: kcUser.id, unlinked: false },
      });
      if (creds.lastHeartbeat.getTime() > Date.now() - 10000) {
        if (message) {
          message.delete();
        }
        if (interaction instanceof CommandInteraction) {
          await interaction.editReply({
            content:
              ':white_check_mark: We have noticed that you have opened the Lovense Remote app and successfully linked your account!',
            embeds: [],
            components: [],
          });
        }
        clearInterval(interval);
        return;
      }
    }, 3000);
  }

  //called by frontend after identifying with discord
  async sendLovenseQRCode(discordUId: string) {
    const user = await this.discordClient.users.fetch(discordUId);
    const kcUser = await getKCUserByDiscordId(discordUId);
    if (!kcUser) {
      throw new Error('Discord user not found in Keycloak');
    }
    let qr: QRCodeResponse;
    try {
      qr = await this.getLinkQrCode(kcUser.id, kcUser.username);
    } catch (e) {
      await user.send(LOVENSE_QR_CODE_GENERATION_ERROR);
      return;
    }
    const embedBuilder = buildLovenseQrCodeEmbed(
      qr.message,
      'Pleasurepal identification successful! Now link your Lovense toys to your account!',
    );
    await user.send({
      embeds: [embedBuilder.toJSON()],
    });
  }

  async sendDiscordMessageToUser(discordUid: string, message: string) {
    const user = await this.discordClient.users.fetch(discordUid);
    await user.send(message);
  }

  async getDiscordUser(discordUid: string) {
    return await this.discordClient.users.fetch(discordUid);
  }

  async sendLovenseFunction(
    command: {
      kcId: string;
    } & LovenseFunctionCommand,
  ) {
    const creds = await this.getCredentials(command.kcId);
    if (!creds) throw new Error('No credentials found');
    const res = await axios.post(
      `https://api.lovense-api.com/api/lan/v2/command`,
      {
        command: 'Function',
        token: process.env.LOVENSE_API_TOKEN,
        uid: command.kcId,
        action: command.action + ':' + (command.intensity || 5),
        timeSec: command.timeSec,
        loopRunningSec: command.loopRunningSec,
        loopPauseSec: command.loopPauseSec,
        stopPrevious: command.stopPrevious ? 1 : 0,
      },
    );
    console.log(res.data);
    return res.data;
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
            const user = await this.discordClient.users.fetch(uid);
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
