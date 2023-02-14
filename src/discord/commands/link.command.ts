import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { CommandInteraction } from 'discord.js';
import { SlashCommandPipe } from '@discord-nestjs/common';
import { Injectable } from '@nestjs/common';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { LovenseService } from 'src/lovense/lovense.service';
import { LinkCommandDto } from '../command-dto/link-command.dto';
import { QRCodeResponse } from 'src/lib/interfaces/lovense';
import { buildLovenseQrCodeEmbed } from 'src/lib/interaction-helper';
import {
  LOVENSE_ACCOUNT_ALREADY_LINKED,
  LOVENSE_QR_CODE_GENERATION_ERROR,
  NEED_TO_REGISTER_PLEASUREPAL,
} from 'src/lib/constants';

@Command({
  name: 'link',
  description:
    'Link your Lovense account to your Discord and pleasurepal account.',
})
@Injectable()
export class LinkCommand {
  constructor(private readonly lovenseSrv: LovenseService) {}

  @Handler()
  async onLink(
    @InteractionEvent(SlashCommandPipe) dto: LinkCommandDto,
    @InteractionEvent() interaction: CommandInteraction,
  ): Promise<void> {
    const kcUser = await getKCUserByDiscordId(interaction.user.id);
    if (!kcUser) {
      await interaction.reply(NEED_TO_REGISTER_PLEASUREPAL);
      return;
    }
    const credentials = await this.lovenseSrv.getCredentials(kcUser.id);
    if (credentials && !dto.force) {
      await interaction.reply(LOVENSE_ACCOUNT_ALREADY_LINKED);
      return;
    }

    let qr: QRCodeResponse;
    try {
      qr = await this.lovenseSrv.getLinkQrCode(kcUser.id, kcUser.username);
    } catch (e) {
      await interaction.reply(LOVENSE_QR_CODE_GENERATION_ERROR);
      return;
    }
    const embedBuilder = buildLovenseQrCodeEmbed(qr.message);
    await interaction.reply({
      embeds: [embedBuilder.toJSON()],
    });
  }
}
