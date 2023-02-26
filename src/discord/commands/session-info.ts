import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { CommandInteraction } from 'discord.js';
import { getDiscordUidByKCId } from 'src/lib/keycloak';
import { LovenseSessionService } from 'src/lovense/lovense-session.service';

@Command({ name: 'session-info', description: 'Retrieve session info.' })
export class SessionInfoCommand {
  constructor(private readonly sessionSrv: LovenseSessionService) {}

  @Handler()
  async onInfo(@InteractionEvent() interaction: CommandInteraction) {
    const info = await this.sessionSrv.validateDiscordSessionReq(interaction);
    if (!info) {
      return;
    }
    const sessionMebers = await this.sessionSrv.getSessionDiscordUsers(
      info.session.id,
    );
    const initiatorDiscordUid = await getDiscordUidByKCId(
      info.session.initiatorId,
    );

    const commandQueue = await this.sessionSrv.getCommandQueue(info.session.id);
    const currentCommand = commandQueue
      .reverse()
      .find(
        (c) =>
          c.startedAt &&
          JSON.parse(c.action).timeSec * 1000 + c.startedAt.getTime() >
            Date.now(),
      );
    const nextCommand = commandQueue.reverse().find((c) => !c.startedAt);

    await interaction.reply({
      content: `:id: **CURRENT SESSION:** \`#${info.session.id}\`
      \n:e_mail: **INVITE LINK:** ${
        process.env.API_URL + '/session/invite/' + info.session.inviteToken
      }
      \n**SESSION OWNER:** <@${initiatorDiscordUid}>
      \n**MEMBERS:** <@${sessionMebers.map((m) => m.id).join('><@')}>
      \n**SESSION CREATED:** ${info.session.createdAt.toLocaleString()}
      \n**CURRENT COMMAND:** ${
        !currentCommand
          ? 'No active command! Use `/pleasure` to queue commands!'
          : currentCommand.action
      }
      \n**NEXT COMMAND:** ${
        !nextCommand ? 'No commands queued!' : nextCommand.action
      }`,
      ephemeral: true,
    });
  }
}
