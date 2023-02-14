import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { CommandInteraction } from 'discord.js';
import { SlashCommandPipe } from '@discord-nestjs/common';
import { Injectable } from '@nestjs/common';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { LovenseService } from 'src/lovense/lovense.service';
import { QRCodeResponse } from 'src/lib/interfaces/lovense';
import { buildLovenseQrCodeEmbed } from 'src/lib/interaction-helper';
import {
  LOVENSE_ACCOUNT_ALREADY_LINKED,
  LOVENSE_ACCOUNT_NOT_LINKED,
  LOVENSE_QR_CODE_GENERATION_ERROR,
  NEED_TO_REGISTER_PLEASUREPAL,
} from 'src/lib/constants';
import { ToyPreferencesDto } from '../command-dto/toy-preferences.dto';
import { PleasureCommandDto } from '../command-dto/pleasure.dto';

@Command({
  name: 'set-toy-preferences',
  description:
    'Set preferences for your Lovense toys. This will override the default preferences.',
})
@Injectable()
export class SetToyPreferencesCommand {
  constructor(private readonly lovenseSrv: LovenseService) {}

  @Handler()
  async onPreferences(
    @InteractionEvent(SlashCommandPipe) dto: PleasureCommandDto,
    @InteractionEvent() interaction: CommandInteraction,
  ): Promise<void> {
    const kcUser = await getKCUserByDiscordId(interaction.user.id);
    if (!kcUser) {
      await interaction.reply(NEED_TO_REGISTER_PLEASUREPAL);
      return;
    }
    const credentials = await this.lovenseSrv.getCredentials(kcUser.id);
    if (!credentials) {
      interaction.reply(LOVENSE_ACCOUNT_NOT_LINKED);
    }
    console.log(dto);
  }
}
