import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { Injectable } from '@nestjs/common';
import { ButtonStyle, CommandInteraction, ComponentType } from 'discord.js';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { NEED_TO_REGISTER_PLEASUREPAL } from 'src/lib/reply-messages';
import { LOVENSE_HEARTBEAT_INTERVAL } from 'src/lib/utils';
import { LovenseSessionService } from 'src/lovense/lovense-session.service';
import { LovenseService } from 'src/lovense/lovense.service';

@Command({
  name: 'authorize',
  description: 'Authorize users in the current session to queue new commands.',
})
@Injectable()
export class AuthorizeCommand {
  constructor(
    private readonly lovenseSrv: LovenseService,
    private readonly sessionSrv: LovenseSessionService,
  ) {}

  @Handler()
  async onAuthorize(
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
    const session = await this.sessionSrv.getCurrentSession(kcUser.id);
    if (!session) {
      await interaction.reply({
        content: 'You are currently not in a pleasurepal session!',
        ephemeral: true,
      });
      return;
    }
    const sessionDiscordUsers = await this.sessionSrv.getSessionDiscordUsers(
      session.id,
    );
    const msg = await interaction.reply({
      content: 'Select a user to authorize.',
      ephemeral: true,
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.StringSelect,
              options: [
                ...sessionDiscordUsers.map((cred) => ({
                  label: cred.username,
                  value: cred.kcId,
                })),
              ],
              customId: 'users',
              placeholder: 'Select users to authorize',
              minValues: 1,
              maxValues: sessionDiscordUsers.length,
            },
          ],
        },
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              customId: 'authorize',
              label: 'Authorize',
              style: ButtonStyle.Primary,
            },
            {
              type: ComponentType.Button,
              customId: 'cancel',
              label: 'Cancel',
              style: ButtonStyle.Danger,
            },
          ],
        },
      ],
    });
    let users: string[] = [];
    const userCollector = msg.createMessageComponentCollector({
      time: 300000,
      componentType: ComponentType.StringSelect,
    });
    const btnCollector = msg.createMessageComponentCollector({
      time: 300000,
      componentType: ComponentType.Button,
    });
    userCollector.on('collect', async (i) => {
      if (i.customId === 'users') {
        await i.deferUpdate();
        users = i.values;
      }
    });
    btnCollector.on('collect', async (i) => {
      if (i.customId === 'cancel') {
        await interaction.editReply({
          content: ':x: Authorization request canceled.',
          components: [],
        });
        return;
      }
      if (!users.length) {
        interaction.followUp({
          content: 'You need to select at least one user or a channel',
          ephemeral: true,
        });
      } else {
        for (const uid of users) {
          const user = sessionDiscordUsers.find((u) => u.kcId === uid);
          await this.sessionSrv.authorizeUser(session.id, user.kcId);
          await this.lovenseSrv.sendDiscordMessageToUser(
            user.id,
            ':unlock: You have been authorized to queue new commands in the current session!',
          );
        }
        await interaction.editReply({
          content: ':white_check_mark: Successfully authorized users!',
          components: [],
        });
      }
    });
    btnCollector.on('end', async (i, reason) => {
      if (reason === 'time') {
        await interaction.editReply({
          content: ':x: Authorization request timed out!',
          components: [],
        });
      }
    });
  }
}
