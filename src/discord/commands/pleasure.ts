import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { CommandInteraction } from 'discord.js';
import { SlashCommandPipe } from '@discord-nestjs/common';
import { Injectable } from '@nestjs/common';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { LovenseService } from 'src/lovense/lovense.service';
import {
  LOVENSE_ACCOUNT_NOT_LINKED,
  NEED_TO_REGISTER_PLEASUREPAL,
} from 'src/lib/reply-messages';
import {
  PleasureActionOptions,
  PleasureCommandParams,
} from '../parameters/pleasure.param';
import { capatializeFirstLetter } from 'src/lib/utils';
import { LovenseSessionService } from 'src/lovense/lovense-session.service';

@Command({
  name: 'pleasure',
  description: 'Pleasure yourself or others with simple commands.',
})
@Injectable()
export class PleasureCommand {
  constructor(
    private readonly lovenseSrv: LovenseService,
    private readonly sessionSrv: LovenseSessionService,
  ) {}

  @Handler()
  async onLink(
    @InteractionEvent(SlashCommandPipe) params: PleasureCommandParams,
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
    const session = await this.sessionSrv.getCurrentSession(kcUser.id);
    if (!session) {
      await interaction.reply('You are not in a session.');
      return;
    }
    const cmd = await this.sessionSrv.sendSessionCommand(
      session.id,
      {
        action: capatializeFirstLetter(PleasureActionOptions[params.action]),
        intensity: params.intensity,
        loopPauseSec: params.looppausesec,
        loopRunningSec: params.looprunningsec,
        timeSec: params.duration,
        stopPrevious: false,
      },
      credentials,
    );
    await interaction.reply(`Command sent: ${JSON.stringify(cmd)}`);
  }
}
