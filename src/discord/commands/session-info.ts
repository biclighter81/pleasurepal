import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { CommandInteraction } from 'discord.js';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { DiscordSessionService } from 'src/session/discord-session.service';
import { SessionService } from 'src/session/session.service';

@Command({ name: 'session-info', description: 'Retrieve session info.' })
export class SessionInfoCommand {
  constructor(
    private readonly sessionSrv: SessionService,
    private readonly discordSessionSrv: DiscordSessionService,
  ) {}

  @Handler()
  async onInfo(@InteractionEvent() interaction: CommandInteraction) {
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
    const initUser = duser.find((u) => u.kcId == session.initiatorId);

    await interaction.reply({
      content: `:id: **CURRENT SESSION:** \`#${session.id}\`
      \n:e_mail: **INVITE LINK:** ${
        process.env.API_URL + '/session/invite/' + session.inviteToken
      }
      \n**SESSION OWNER:** <@${initUser.user.id}>
      \n**MEMBERS:** <@${duser.map((m) => m.user.id).join('><@')}>
      \n**SESSION CREATED:** ${session.createdAt.toLocaleString()}`,
      ephemeral: true,
    });
  }
}
