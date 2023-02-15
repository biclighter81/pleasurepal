import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { ButtonStyle, CommandInteraction, ComponentType } from 'discord.js';
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
    const msg = await interaction.reply({
      content: 'Configure your pleasurepal session',
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
      time: 60000,
      componentType: ComponentType.UserSelect,
    });
    userSelector.on('collect', async (interaction) => {
      users = interaction.values;
      interaction.update({});
    });
    let channel: string;
    const channelSelector = msg.createMessageComponentCollector({
      time: 60000,
      componentType: ComponentType.ChannelSelect,
    });
    channelSelector.on('collect', async (interaction) => {
      channel = interaction.values[0];
      interaction.update({});
    });
    const buttonSelector = msg.createMessageComponentCollector({
      time: 60000,
      componentType: ComponentType.Button,
    });
    buttonSelector.on('collect', async (interaction) => {
      if (interaction.customId === 'startSession') {
        if (!users.length && !channel) {
          interaction.reply({
            content: 'You need to select at least one user or a channel',
            ephemeral: true,
          });
        } else {
          if (channel) {
          }
          if (users.length) {
            await this.lovenseSrv.sendSessionInvites(
              users,
              interaction.user.id,
              interaction,
            );
          }
          interaction.update({});
        }
      }
      if (interaction.customId === 'cancelSession') {
        interaction.reply({
          content: 'Session creation cancelled',
          ephemeral: true,
        });
        interaction.update({
          content: 'Session creation cancelled',
        });
        return;
      }
    });
  }
}
