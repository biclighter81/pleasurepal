import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { ButtonStyle, CommandInteraction, ComponentType } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { LovenseService } from 'src/lovense/lovense.service';
import {
  LOVENSE_ACCOUNT_NOT_LINKED,
  NEED_TO_REGISTER_PLEASUREPAL,
} from 'src/lib/constants';

@Command({
  name: 'skip',
  description: 'Skip an action in the current pleasurepal session',
})
@Injectable()
export class SkipCommand {
  constructor(private readonly lovenseSrv: LovenseService) {}

  @Handler()
  async onSkip(
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
      await interaction.reply({
        content: 'You are currently not in a pleasurepal session!',
        ephemeral: true,
      });
      return;
    }
    await this.lovenseSrv.sendLovenseFunction({
      kcId: kcUser.id,
      action: 'Vibrate',
      intensity: 0,
      loopPauseSec: 0,
      loopRunningSec: 0,
      timeSec: 1,
      stopPrevious: true,
    });
    await interaction.reply({
      content: `You have skipped the current action! Following actions in the session will be executed as normal.\nTo fully leave the session, use the \`/leave\` command.`,
      ephemeral: true,
    });
  }
}