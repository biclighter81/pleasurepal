import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { CommandInteraction, ComponentType } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { LovenseService } from 'src/lovense/lovense.service';
import {
  LOVENSE_ACCOUNT_NOT_LINKED,
  NEED_TO_REGISTER_PLEASUREPAL,
} from 'src/lib/reply-messages';
import { SESSION_CREATION_COMPONENTS } from 'src/lib/interaction-helper';
import { LovenseSessionService } from 'src/lovense/lovense-session.service';
import { LOVENSE_HEARTBEAT_INTERVAL } from 'src/lib/utils';
import { LinkCommand } from './link';

@Command({
  name: 'session',
  description: 'Start a pleasurepal session.',
})
@Injectable()
export class SessionCommand {
  constructor(
    private readonly lovenseSrv: LovenseService,
    private readonly sessionSrv: LovenseSessionService,
  ) {}

  @Handler()
  async onSession(
    @InteractionEvent() interaction: CommandInteraction,
  ): Promise<void> {
    const kcUser = await getKCUserByDiscordId(interaction.user.id);
    if (!kcUser) {
      await interaction.reply(NEED_TO_REGISTER_PLEASUREPAL);
      return;
    }
    const credentials = await this.lovenseSrv.getCredentials(kcUser.id);
    if (
      !credentials ||
      !credentials.lastHeartbeat ||
      credentials.lastHeartbeat.getTime() <
        Date.now() - LOVENSE_HEARTBEAT_INTERVAL
    ) {
      await this.lovenseSrv.sendLinkQr(kcUser, interaction);
      return;
    }

    // timeout in ms
    const timeout = 300000;
    const msg = await interaction.reply({
      content: 'Configure your pleasurepal session',
      ephemeral: true,
      components: SESSION_CREATION_COMPONENTS,
    });

    // Collect user select interactions
    let users: string[] = [];
    const userSelector = msg.createMessageComponentCollector({
      componentType: ComponentType.UserSelect,
      time: timeout,
    });
    userSelector.on('collect', async (interaction) => {
      users = interaction.values;
      await interaction.deferUpdate();
    });

    // Collect channel select interactions
    let channel: string;
    const channelSelector = msg.createMessageComponentCollector({
      componentType: ComponentType.ChannelSelect,
      time: timeout,
    });
    channelSelector.on('collect', async (interaction) => {
      channel = interaction.values[0];
      await interaction.deferUpdate();
    });

    // Collect button interactions
    const buttonSelector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: timeout,
    });
    buttonSelector.on('collect', async (interaction) => {
      // Start session button
      if (interaction.customId === 'startSession') {
        if (!users.length && !channel) {
          interaction.followUp({
            content: 'You need to select at least one user or a channel',
            ephemeral: true,
          });
        } else {
          // Get all users from channel and send invites
          if (channel) {
          }
          // Send invites to manually selected users
          if (users.length) {
            await interaction.update({
              content: `Session is being created! Invites will be sent to: ${users
                .map((u) => `<@${u}>`)
                .join(', ')}`,
              components: [],
            });
            //await interaction.deferReply({ ephemeral: true });
            const sessionResult = await this.sessionSrv.sendSessionInvites(
              users,
              interaction.user.id,
              interaction,
            );
            await interaction.editReply({
              content: `Session \`#${
                sessionResult.session.id
              }\` created!\n\nInvites sent to: ${users
                .map((u) => `<@${u}>`)
                .join(', ')}
                `,
              components: [],
            });
            buttonSelector.stop();
          }
        }
      }
      // Cancel button
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
