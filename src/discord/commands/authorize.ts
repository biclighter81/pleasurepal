import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { Injectable } from '@nestjs/common';
import { CacheType, CommandInteraction, ComponentType, User } from 'discord.js';
import {
  AUTHORIZE_SESSION_USER_BUTTON_COMPONENTS,
  AUTHORIZE_SESSION_USER_SELECT_COMPONENTS,
} from 'src/lib/interaction-helper';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { DiscordSessionService } from 'src/session/discord-session.service';
import { PleasureSession } from 'src/session/entities/pleasure-session.entity';
import { SessionService } from 'src/session/session.service';
import { DiscordService } from '../discord.service';

@Command({
  name: 'authorize',
  description: 'Authorize users in the current session to queue new commands.',
})
@Injectable()
export class AuthorizeCommand {
  constructor(
    private readonly sessionSrv: SessionService,
    private readonly discordSessionSrv: DiscordSessionService,
    private readonly discordSrv: DiscordService,
  ) {}

  @Handler()
  async onAuthorize(
    @InteractionEvent() interaction: CommandInteraction,
  ): Promise<void> {
    const user = await getKCUserByDiscordId(interaction.user.id);
    if (!user) {
      interaction.reply({
        content: ':x: No pleasurepal account',
      });
      return;
    }
    const session = await this.sessionSrv.getCurrentSession(user.id);
    if (!session) {
      interaction.reply({
        content: ':x: No active session',
      });
      return;
    }
    const duser = await this.discordSessionSrv.getDiscordUsers(session.id);
    const msg = await interaction.reply({
      content: 'Select a user to authorize.',
      ephemeral: true,
      components: [
        {
          type: ComponentType.ActionRow,
          components: AUTHORIZE_SESSION_USER_SELECT_COMPONENTS(
            session.user,
            duser.find((u) => u.kcId === user.id),
          ),
        },
        AUTHORIZE_SESSION_USER_BUTTON_COMPONENTS,
      ],
    });
    const userCollector = msg.createMessageComponentCollector({
      time: 300000,
      componentType: ComponentType.StringSelect,
    });
    const btnCollector = msg.createMessageComponentCollector({
      time: 300000,
      componentType: ComponentType.Button,
    });
    let users: string[] = [];
    userCollector.on('collect', async (i) => {
      if (i.customId === 'users') {
        await i.deferUpdate();
        users = i.values;
      }
    });
    btnCollector.on('collect', async (i) => {
      if (i.customId === 'cancel') {
        return this.handleCancle(interaction);
      }
      if (i.customId === 'authorize') {
        return this.handleAuthorize(users, interaction, session);
      }
    });
    btnCollector.on('end', async () => {
      await interaction.editReply({
        content: ':x: Authorization request timed out!',
        components: [],
      });
    });
  }

  async handleCancle(i: CommandInteraction<CacheType>) {
    await i.editReply({
      content: ':x: Authorization request canceled.',
      components: [],
    });
    return;
  }

  async handleAuthorize(
    uids: string[],
    i: CommandInteraction<CacheType>,
    session: PleasureSession,
  ) {
    if (!uids.length) {
      i.followUp({
        content: 'You need to select at least one user!',
        ephemeral: true,
      });
    } else {
      const users = await Promise.all(
        uids.map((uid) => this.discordSrv.getUser(uid)),
      );
      users.forEach(async (u) => await this.handleNotification(u, session));
      await i.editReply({
        content: ':white_check_mark: Successfully authorized users!',
        components: [],
      });
    }
  }

  async handleNotification(u: User, session: PleasureSession) {
    await u.send({
      content: `:unlock: You have been authorized to queue new commands in session \`${session.id}\`!`,
    });
  }
}
