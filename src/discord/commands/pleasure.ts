import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { CommandInteraction } from 'discord.js';
import { SlashCommandPipe } from '@discord-nestjs/common';
import { Injectable } from '@nestjs/common';
import { LovenseService } from 'src/lovense/lovense.service';
import {} from 'src/lib/reply-messages';
import {
  PleasureActionOptions,
  PleasureCommandParams,
} from '../parameters/pleasure.param';
import { capatializeFirstLetter } from 'src/lib/utils';
import { LovenseSessionService } from 'src/lovense/lovense-session.service';
import { DiscordService } from '../discord.service';

@Command({
  name: 'pleasure',
  description: 'Pleasure yourself or others with simple commands.',
})
@Injectable()
export class PleasureCommand {
  constructor(
    private readonly lovenseSrv: LovenseService,
    private readonly sessionSrv: LovenseSessionService,
    private readonly discordSrv: DiscordService,
  ) {}

  @Handler()
  async onLink(
    @InteractionEvent(SlashCommandPipe) params: PleasureCommandParams,
    @InteractionEvent() interaction: CommandInteraction,
  ): Promise<void> {
    const info = await this.sessionSrv.validateDiscordSessionReq(interaction);
    if (!info) {
      return;
    }
    //check for session rights
    if (
      !info.session.credentials.find((c) => c.uid === info.credentials.uid)
        ?.hasControl
    ) {
      await interaction.reply({
        content: ':lock: You do not have control over the current session!',
        ephemeral: true,
      });
      return;
    }
    const cmd = await this.sessionSrv.sendSessionCommand(
      info.session.id,
      {
        action: capatializeFirstLetter(PleasureActionOptions[params.action]),
        intensity: params.intensity,
        loopPauseSec: params.looppausesec,
        loopRunningSec: params.looprunningsec,
        timeSec: params.duration,
        stopPrevious: false,
      },
      info.credentials,
    );
    await interaction.reply({
      content: `You have sent the command \`${JSON.stringify(
        cmd,
      )}\` to the session!`,
      ephemeral: true,
    });
  }
}
