import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { CommandInteraction } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { LovenseService } from 'src/lovense/lovense.service';
import {
  LOVENSE_ACCOUNT_NOT_LINKED,
  NEED_TO_REGISTER_PLEASUREPAL,
} from 'src/lib/reply-messages';
import {
  interactionTimeout,
  LEAVE_INTERACTION_CONFIRM_COMPONENTS,
} from 'src/lib/interaction-helper';
import { LovenseSessionService } from 'src/lovense/lovense-session.service';

@Command({
  name: 'leave',
  description: 'Leave the current pleasurepal session',
})
@Injectable()
export class LeaveCommand {
  constructor(
    private readonly lovenseSrv: LovenseService,
    private readonly sessionSrv: LovenseSessionService,
  ) {}

  @Handler()
  async onLeave(
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
      await interaction.reply({
        content: 'You are currently not in a pleasurepal session!',
        ephemeral: true,
      });
      return;
    }

    const msg = await interaction.reply({
      content: `You are about to leave the current session \`#${session.id}\`. Are you sure?`,
      components: LEAVE_INTERACTION_CONFIRM_COMPONENTS,
      ephemeral: true,
    });
    const collector = msg.createMessageComponentCollector({
      time: 60000,
    });

    // Collect button interactions
    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'leave') {
        await this.sessionSrv.leaveSession(kcUser.id, session);
        await interaction.update({
          content: `You have left the current session \`#${session.id}\`!`,
          components: [],
        });
        collector.stop();
      } else if (interaction.customId === 'cancel') {
        await interaction.update({
          content: `You have decided to stay in the current session \`#${session.id}\`!`,
          components: [],
        });
        collector.stop();
      }
    });

    // Handle timeout after 60 seconds
    collector.on('end', async (collected, reason) =>
      interactionTimeout(
        interaction,
        reason,
        `You have not responded in time. You are still in the current session \`#${session.id}\`!`,
      ),
    );
  }
}
