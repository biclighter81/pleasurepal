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
import { Client, CommandInteraction } from 'discord.js';
import { LovenseFunctionCommand } from './dto/lovense-command.dto';
import { LOVENSE_QR_CODE_GENERATION_ERROR } from 'src/lib/reply-messages';
import { buildLovenseQrCodeEmbed } from 'src/lib/interaction-helper';
import { LovenseCredentials_PleasureSession } from './entities/credentials_plesure_session.join-entity';
import { KeycloakUser } from 'src/lib/interfaces/keycloak';

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
    interaction: CommandInteraction,
    hasReplied?: boolean,
  ) {
    let qr: QRCodeResponse;
    try {
      qr = await this.getLinkQrCode(kcUser.id, kcUser.username);
    } catch (e) {
      console.error(e);
      await interaction.followUp(LOVENSE_QR_CODE_GENERATION_ERROR);
      return;
    }
    const embedBuilder = buildLovenseQrCodeEmbed(qr.message);
    if (hasReplied) {
      await interaction.editReply({
        embeds: [embedBuilder.toJSON()],
        components: [],
      });
    } else {
      await interaction.reply({
        embeds: [embedBuilder.toJSON()],
        components: [],
      });
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
}
