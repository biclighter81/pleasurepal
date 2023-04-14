import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { CacheType, CommandInteraction } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { LEAVE_INTERACTION_CONFIRM_COMPONENTS } from 'src/lib/interaction-helper';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { PleasureSession } from 'src/session/entities/pleasure-session.entity';
import { SessionService } from 'src/session/session.service';

@Command({
  name: 'leave',
  description: 'Leave the current pleasurepal session',
})
@Injectable()
export class LeaveCommand {
  constructor(private readonly sessionSrv: SessionService) {}

  @Handler()
  async onLeave(
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
    const msg = await interaction.reply({
      content: `You are about to leave the current session \`#${session.id}\`. Are you sure?`,
      components: LEAVE_INTERACTION_CONFIRM_COMPONENTS,
      ephemeral: true,
    });
    const collector = msg.createMessageComponentCollector({
      time: 60000,
    });

    // Collect button interactions
    collector.on('collect', async (i) => {
      if (i.customId === 'leave') {
        await this.handleLeave(user.id, interaction, session);
      }
      if (i.customId === 'cancel') {
        await this.handleCancel(interaction, session);
      }
    });
    collector.on('end', async () => {
      await interaction.editReply({
        content: `You have not responded in time. You are still in the current session \`${session.id}\`!`,
        components: [],
      });
    });
  }

  async handleLeave(
    uid: string,
    i: CommandInteraction<CacheType>,
    session: PleasureSession,
  ) {
    await this.sessionSrv.leave(session.id, uid);
    await i.editReply({
      content: `:white_check_mark: You have left the current session \`#${session.id}\`!`,
      components: [],
    });
  }

  async handleCancel(
    i: CommandInteraction<CacheType>,
    session: PleasureSession,
  ) {
    await i.editReply({
      content: `You have decided to stay in the current session \`#${session.id}\`!`,
      components: [],
    });
  }
}
