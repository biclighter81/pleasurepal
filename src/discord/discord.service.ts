import { InjectDiscordClient } from '@discord-nestjs/core';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client, CommandInteraction, Message, User } from 'discord.js';
import { buildLovenseQrCodeEmbed } from 'src/lib/interaction-helper';
import { QRCodeResponse } from 'src/lib/interfaces/lovense';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { LOVENSE_HEARTBEAT_INTERVAL } from 'src/lib/utils';
import { LovenseCredentials } from 'src/lovense/entities/lovense-credentials.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DiscordService {
  constructor(
    @InjectDiscordClient()
    private readonly discordClient: Client,
    @InjectRepository(LovenseCredentials)
    private readonly lovenseCredRepo: Repository<LovenseCredentials>,
  ) {}

  async sendMessage(discordUid: string, message: string) {
    const user = await this.discordClient.users.fetch(discordUid);
    await user.send(message);
  }

  async getUser(uid: string) {
    return this.discordClient.users.fetch(uid);
  }

  //called by frontend after identifying with discord
  async sendLovenseQRCode(discordUId: string, qr: QRCodeResponse) {
    const user = await this.discordClient.users.fetch(discordUId);
    const kcUser = await getKCUserByDiscordId(discordUId);
    if (!kcUser) {
      throw new Error('Discord user not found in Keycloak');
    }
    const embedBuilder = buildLovenseQrCodeEmbed(
      qr.message,
      'Pleasurepal identification successful! Now link your Lovense toys to your account!',
    );
    await user.send({
      embeds: [embedBuilder.toJSON()],
    });
  }

  async pollLinkStatus(
    interaction: CommandInteraction | User,
    qr: QRCodeResponse,
    credentials: LovenseCredentials,
    hasReplied?: boolean,
  ) {
    //send qr code
    const message = await this.sendQr(qr, interaction, hasReplied);
    //check if user has linked their toys every 3 seconds
    let tries = 0;
    const interval = setInterval(async () => {
      tries++;
      //stop after 5 minutes
      if (tries > 300) {
        clearInterval(interval);
        return;
      }
      //poll for heartbeat
      credentials = await this.lovenseCredRepo.findOne({
        where: { uid: credentials.uid },
      });
      if (
        credentials.lastHeartbeat?.getTime() >
        Date.now() - LOVENSE_HEARTBEAT_INTERVAL
      ) {
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
    }, 1000);
  }

  async sendQr(
    qr: QRCodeResponse,
    interaction: CommandInteraction | User,
    hasReplied?: boolean,
  ) {
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
    return message;
  }
}
