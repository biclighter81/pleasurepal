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
  ButtonStyle,
  CacheType,
  Client,
  ComponentType,
  InteractionResponse,
  MessageCreateOptions,
} from 'discord.js';
import { LovenseFunctionCommand } from './dto/lovense-command.dto';
import { LovenseCredentials_DiscordSession } from './entities/credentials_discord_session.join-entity';
import { LovenseDiscordSession } from './entities/lovense-discord-session.entity';
import { LOVENSE_QR_CODE_GENERATION_ERROR } from 'src/lib/constants';
import { buildLovenseQrCodeEmbed } from 'src/lib/interaction-helper';

@Injectable()
export class LovenseService {
  private readonly logger: Logger = new Logger(LovenseService.name);

  constructor(
    @InjectRepository(LovenseCredentials)
    private readonly lovenseCredRepo: Repository<LovenseCredentials>,
    @InjectRepository(LovenseToy)
    private readonly lovenseToyRepo: Repository<LovenseToy>,
    @InjectRepository(LovenseDiscordSession)
    private readonly lovenseDiscordSessionRepo: Repository<LovenseDiscordSession>,
    @InjectRepository(LovenseCredentials_DiscordSession)
    private readonly lovenseCredDiscordSessionRepo: Repository<LovenseCredentials_DiscordSession>,
    @InjectDiscordClient()
    private readonly discordClient: Client,
  ) {}

  async callback(body: LovenseCredentialsDto) {
    const existingCreds = await this.lovenseCredRepo.findOne({
      relations: ['toys'],
      where: { uid: body.uid },
    });
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
    });
    // Send success message to user if this is the first time linking or if the toys changed
    if (
      !existingCreds ||
      existingCreds.toys
        .sort()
        .map((t) => t.nickName || t.name)
        .join() !==
        toys
          .sort()
          .map((t) => t.nickName || t.name)
          .join()
    ) {
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
    return credentials;
  }

  async getCredentials(kcId: string) {
    return this.lovenseCredRepo.findOne({
      relations: ['toys'],
      where: { uid: kcId },
    });
  }

  async unlinkLovense(kcId: string) {
    await this.lovenseCredDiscordSessionRepo.update(
      {
        lovenseCredentialsUid: kcId,
      },
      { active: false },
    );
    return this.lovenseCredRepo.update(
      { uid: kcId },
      { unlinked: true, toys: [] },
    );
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

  async getCurrentSession(
    kcId: string,
  ): Promise<LovenseDiscordSession | undefined> {
    const session = await this.lovenseDiscordSessionRepo.findOne({
      where: {
        active: true,
        credentials: {
          lovenseCredentialsUid: kcId,
        },
      },
      relations: ['credentials'],
    });
    return session;
  }

  async sendSessionCommand(sessionId: string, command: LovenseFunctionCommand) {
    // Get session with all users which have accepted the invite
    const session = await this.lovenseDiscordSessionRepo.findOne({
      where: {
        id: sessionId,
        active: true,
        credentials: {
          lovenseDiscordSessionId: sessionId,
          inviteAccepted: true,
        },
      },
      relations: ['credentials'],
    });
    if (!session) throw new Error('No session found');
    const allPromises = session.credentials.map((p) =>
      this.sendLovenseFunction({
        kcId: p.lovenseCredentialsUid,
        ...command,
      }),
    );
    return await Promise.all(allPromises);
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
          };
        }),
      },
      {},
    );
    return session;
  }

  async sendSessionInvites(
    uids: string[],
    initiatorUid: string,
    initiatorInteraction: ButtonInteraction<CacheType>,
  ) {
    const initiator = await this.discordClient.users.fetch(initiatorUid);
    // Fetch KC users from discord ids
    const invitedUsers = await Promise.all(
      uids
        .filter((uid) => uid != initiator.id)
        .map(async (uid) => {
          const user = await this.discordClient.users.fetch(uid);
          return user;
        }),
    );
    // Create session
    const session = await this.createSession(uids, initiatorUid);
    // Send invites
    for (const user of invitedUsers) {
      const kcUser = await getKCUserByDiscordId(user.id);
      // Handle users that have not linked their discord accounts
      if (!kcUser) {
        await user.send(
          `You have been invited to a pleasurepal session by \`@${initiator.username}\`, but you have not linked your discord account with your pleasurepal account or worse: You maybe don't even have a pleasurepal account! Please register under https://pleasurepal.de/ and link your discord account under https://pleasurepal.de/profile.`,
        );
        continue;
      }
      const creds = await this.lovenseCredRepo.findOne({
        where: { uid: kcUser.id },
      });
      if (!creds) {
        await user.send(
          `You have been invited to a pleasurepal session by \`@${initiator.username}\`, but you have not linked your lovense account with your pleasurepal account! Please link your lovense account under https://pleasurepal.de/profile.`,
        );
        continue;
      }
      const msg = await user.send({
        content: `\`@${
          initiator.username
        }\` has invited you to Lovense session \`#${
          session.id
        }\`!\nThese are the invited users: \`@${invitedUsers
          .map((u) => u.username)
          .join('`, `@')}\``,
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                customId: 'joinSession',
                label: 'Join Session',
                style: ButtonStyle.Primary,
              },
              {
                type: ComponentType.Button,
                customId: 'declineSession',
                label: 'Decline',
                style: ButtonStyle.Danger,
              },
            ],
          },
        ],
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
            lovenseCredentialsUid: creds.uid,
            lovenseDiscordSessionId: session.id,
            inviteAccepted: true,
            lastActive: new Date(),
          });

          initiatorInteraction.followUp({
            content: `\`@${user.username}\` has joined the session!`,
          });
          i.reply({
            content: `You have joined the session \`${session.id}\`!\nYou can leave the session by typing \`/leave\`.`,
          });
        }
        if (i.customId == 'declineSession') {
          //User has declined the session
          initiatorInteraction.followUp({
            content: `\`@${user.username}\` has declined the session!`,
          });
          i.reply({
            content: `You have declined the session!`,
          });
        }
      });
      buttonCollector.on('end', async (collected, reason) => {
        if (reason == 'time') {
          msg.edit({
            content: `:x: The session invite to session \`${session.id}\` from <@${initiator.id}> has expired!`,
          });
        }
      });
    }
    return session;
  }
}
