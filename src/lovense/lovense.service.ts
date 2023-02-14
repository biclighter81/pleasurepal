import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LovenseCredentials as LovenseCredentialsDto } from './dto/lovense-credentials.dto';
import { LovenseCredentials } from './entities/lovense-credentials.entity';
import { LovenseToy } from './entities/lovense-toy.entity';
import axios from 'axios';
import { QRCodeResponse } from 'src/lib/interfaces/lovense';
import { getDiscordUidByKCId } from 'src/lib/keycloak';
import { InjectDiscordClient } from '@discord-nestjs/core';
import { Client, MessageCreateOptions } from 'discord.js';
import { LovenseFunctionCommand } from './dto/lovense-command.dto';

@Injectable()
export class LovenseService {
  private readonly logger: Logger = new Logger(LovenseService.name);

  constructor(
    @InjectRepository(LovenseCredentials)
    private readonly lovenseCredRepo: Repository<LovenseCredentials>,
    @InjectRepository(LovenseToy)
    private readonly lovenseToyRepo: Repository<LovenseToy>,
    @InjectDiscordClient()
    private readonly discordClient: Client,
  ) {}

  async callback(body: LovenseCredentialsDto) {
    const existingCreds = await this.lovenseCredRepo.findOne({
      relations: ['toys'],
      where: { uid: body.uid },
    });
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
      existingCreds.toys.sort().join() !== toys.sort().join()
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

  async deleteCredentials(kcId: string) {
    return this.lovenseCredRepo.delete({ uid: kcId });
  }

  async getLinkQrCode(kcId: string, username: string): Promise<QRCodeResponse> {
    try {
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
    return res.data;
  }

  async sendSessionRequest(discordUid: string, kcId: string) {
    const creds = await this.getCredentials(kcId);
    (await this.discordClient.users.fetch(discordUid)).send({
      content: `You have been invited to a Lovense session!`,

      components: [
        {
          type: 1,
          components: [
            {
              type: 3,
              custom_id: 'lovense_toys',
              label: 'Select a toy',
              placeholder: 'Select a toy',
              options: creds.toys.map((t) => ({
                label: t.nickName || t.name,
                value: t.id,
                description: t.name,
              })),
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 1,
              label: 'Accept invite',
              custom_id: 'lovense_accept',
            },
            {
              type: 2,
              style: 4,
              label: 'Decline invite',
              custom_id: 'lovense_decline',
            },
          ],
        },
      ],
    });
  }
}
