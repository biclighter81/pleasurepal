import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { CommandInteraction } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { LovenseControlService } from 'src/lovense/lovense-control.service';
import { SessionService } from 'src/session/session.service';
import { getKCUserByDiscordId } from 'src/lib/keycloak';

@Command({
  name: 'skip',
  description: 'Skip an action in the current pleasurepal session',
})
@Injectable()
export class SkipCommand {
  constructor(
    private readonly sessionSrv: SessionService,
    private readonly lovenseControlSrv: LovenseControlService,
  ) {}

  @Handler()
  async onSkip(
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
    //TODO: implement new device logic
    await this.lovenseControlSrv.sendLovenseFunction({
      kcId: user.id,
      action: 'Vibrate',
      intensity: 1,
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
