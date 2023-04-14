import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { CommandInteraction } from 'discord.js';
import { SlashCommandPipe } from '@discord-nestjs/common';
import { Injectable } from '@nestjs/common';
import {} from 'src/lib/reply-messages';
import { PleasureCommandParams } from '../parameters/pleasure.param';
import { SessionService } from 'src/session/session.service';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { DeviceService } from 'src/device/device.service';

@Command({
  name: 'pleasure',
  description: 'Pleasure yourself or others with simple commands.',
})
@Injectable()
export class PleasureCommand {
  constructor(
    private readonly sessionSrv: SessionService,
    private readonly deviceSrv: DeviceService,
  ) {}

  @Handler()
  async onLink(
    @InteractionEvent(SlashCommandPipe) params: PleasureCommandParams,
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
    //check rights
    if (!session.user.find((u) => u.uid === user.id)?.hasControl) {
      await interaction.reply({
        content: ':lock: You do not have control over the current session!',
        ephemeral: true,
      });
      return;
    }
    //TODO: implement new device command logic
    for (const user of session.user) {
      await this.deviceSrv.vibrate(user.uid, params.duration, params.intensity);
    }
    await interaction.reply({
      content: `You have sent the command \`\` to the session!`,
      ephemeral: true,
    });
  }
}
