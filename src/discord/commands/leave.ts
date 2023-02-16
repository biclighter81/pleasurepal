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
  name: 'leave',
  description: 'Leave the current pleasurepal session',
})
@Injectable()
export class LeaveCommand {
  constructor(private readonly lovenseSrv: LovenseService) {}

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
    const session = await this.lovenseSrv.getCurrentSession(kcUser.id);
    if (!session) {
      await interaction.reply({
        content: 'You are currently not in a pleasurepal session!',
        ephemeral: true,
      });
      return;
    }
    const msg = await interaction.reply({
      content: `You are about to leave the current session \`#${session.id}\`. Are you sure?`,
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              style: ButtonStyle.Danger,
              label: 'Leave',
              customId: 'leave',
            },
            {
              type: ComponentType.Button,
              style: ButtonStyle.Secondary,
              label: 'Stay in session',
              customId: 'cancel',
            },
          ],
        },
      ],
      ephemeral: true,
    });
    const collector = msg.createMessageComponentCollector({
      time: 60000,
    });
    collector.on('collect', async (interaction) => {
      if (interaction.customId === 'leave') {
        await this.lovenseSrv.leaveSession(kcUser.id, session);
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
    collector.on('end', async (collected, reason) => {
      if (reason === 'time') {
        await interaction.editReply({
          content: `You have not responded in time. You are still in the current session \`#${session.id}\`!`,
          components: [],
        });
      }
    });
  }
}
