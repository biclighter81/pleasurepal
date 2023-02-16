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
  name: 'session',
  description: 'Start a pleasurepal session.',
})
@Injectable()
export class SessionCommand {
  constructor(private readonly lovenseSrv: LovenseService) {}

  @Handler()
  async onLink(
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
    const timeout = 300000;
    const msg = await interaction.reply({
      content: 'Configure your pleasurepal session',
      ephemeral: true,
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.UserSelect,
              customId: 'users',
              placeholder: 'Select users to invite to your session',
              minValues: 0,
              maxValues: 5,
            },
          ],
        },
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.ChannelSelect,
              customId: 'channelSession',
              placeholder:
                'Select a channel if you want to start a channel session',
            },
          ],
        },
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              customId: 'startSession',
              label: 'Start session',
              style: ButtonStyle.Primary,
            },
            {
              type: ComponentType.Button,
              customId: 'cancelSession',
              label: 'Cancel',
              style: ButtonStyle.Danger,
            },
          ],
        },
      ],
    });
    let users: string[] = [];
    const userSelector = msg.createMessageComponentCollector({
      componentType: ComponentType.UserSelect,
      time: timeout,
    });
    userSelector.on('collect', async (interaction) => {
      users = interaction.values;
      interaction.deferUpdate();
    });
    let channel: string;
    const channelSelector = msg.createMessageComponentCollector({
      componentType: ComponentType.ChannelSelect,
      time: timeout,
    });
    channelSelector.on('collect', async (interaction) => {
      channel = interaction.values[0];
      interaction.deferUpdate();
    });
    const buttonSelector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: timeout,
    });
    buttonSelector.on('collect', async (interaction) => {
      if (interaction.customId === 'startSession') {
        if (!users.length && !channel) {
          interaction.followUp({
            content: 'You need to select at least one user or a channel',
            ephemeral: true,
          });
        } else {
          if (channel) {
          }
          if (users.length) {
            const sessionResult = await this.lovenseSrv.sendSessionInvites(
              users,
              interaction.user.id,
              interaction,
            );
            interaction.update({
              content: `Session \`#${
                sessionResult.session.id
              }\` created!\n\nInvites sent to: ${users
                .map((u) => `<@${u}>`)
                .join(', ')}
              \n
              These invited users didn't finish there pleasurepal account setup yet and may reply later: ${sessionResult.incompletedAccounts
                .map((u) => `<@${u.id}>`)
                .join(', ')}
                `,
              components: [],
            });
            buttonSelector.stop();
          }
        }
      }
      if (interaction.customId === 'cancelSession') {
        interaction.update({
          content: 'Session creation cancelled!',
          components: [],
        });
        buttonSelector.stop();
        return;
      }
    });
    //Handle timeout
    buttonSelector.on('end', async (i, reason) => {
      if (reason === 'time') {
        interaction.editReply({
          content: ':x: Session creation timed out!',
          components: [],
        });
      }
    });
  }
}
