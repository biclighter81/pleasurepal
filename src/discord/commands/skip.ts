import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { ButtonStyle, CommandInteraction, ComponentType } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { LovenseService } from 'src/lovense/lovense.service';
import {
  LOVENSE_ACCOUNT_NOT_LINKED,
  NEED_TO_REGISTER_PLEASUREPAL,
} from 'src/lib/reply-messages';
import { LovenseSessionService } from 'src/lovense/lovense-session.service';
import { LOVENSE_HEARTBEAT_INTERVAL } from 'src/lib/utils';
import { DiscordService } from '../discord.service';
import { LovenseControlSservice } from 'src/lovense/lovense-control.service';

@Command({
  name: 'skip',
  description: 'Skip an action in the current pleasurepal session',
})
@Injectable()
export class SkipCommand {
  constructor(
    private readonly lovenseSrv: LovenseService,
    private readonly sessionSrv: LovenseSessionService,
    private readonly lovenseControlSrv: LovenseControlSservice,
    private readonly discordSrv: DiscordService,
  ) {}

  @Handler()
  async onSkip(
    @InteractionEvent() interaction: CommandInteraction,
  ): Promise<void> {
    const info = await this.sessionSrv.validateDiscordSessionReq(interaction);
    if (!info) {
      return;
    }
    await this.lovenseControlSrv.sendLovenseFunction({
      kcId: info.kcUser.id,
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
