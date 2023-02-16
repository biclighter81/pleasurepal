import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { CommandInteraction } from 'discord.js';
import { SlashCommandPipe } from '@discord-nestjs/common';
import { Injectable } from '@nestjs/common';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { LovenseService } from 'src/lovense/lovense.service';
import {
  LOVENSE_ACCOUNT_NOT_LINKED,
  NEED_TO_REGISTER_PLEASUREPAL,
} from 'src/lib/constants';
import {
  PleasureActionOptions,
  PleasureCommandDto,
} from '../command-dto/pleasure.dto';
import { capatializeFirstLetter } from 'src/lib/utils';

@Command({
  name: 'pleasure',
  description: 'Pleasure yourself or others with simple commands.',
})
@Injectable()
export class PleasureCommand {
  constructor(private readonly lovenseSrv: LovenseService) {}

  @Handler()
  async onLink(
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
      await interaction.reply(LOVENSE_ACCOUNT_NOT_LINKED);
      return;
    }
    const session = await this.lovenseSrv.getCurrentSession(kcUser.id);
    if (!session) {
      await interaction.reply('You are not in a session.');
      return;
    }
    const cmd = await this.lovenseSrv.sendSessionCommand(session.id, {
      action: capatializeFirstLetter(PleasureActionOptions[dto.action]),
      intensity: dto.intensity,
      loopPauseSec: dto.looppausesec,
      loopRunningSec: dto.looprunningsec,
      timeSec: dto.duration,
      stopPrevious: false,
    });
    await interaction.reply(`Command sent: ${JSON.stringify(cmd)}`);
  }
}
