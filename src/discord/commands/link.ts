import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { CommandInteraction, ComponentType } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { LovenseService } from 'src/lovense/lovense.service';
import {
  ALREADY_LINKED_COMPONENTS,
  interactionTimeout,
} from 'src/lib/interaction-helper';
import {
  LOVENSE_ACCOUNT_ALREADY_LINKED,
  LOVENSE_ACCOUNT_UNLINKED,
  NEED_TO_REGISTER_PLEASUREPAL,
} from 'src/lib/reply-messages';
import { DiscordService } from '../discord.service';

@Command({
  name: 'link',
  description:
    'Link your Lovense account to your Discord and pleasurepal account.',
})
@Injectable()
export class LinkCommand {
  constructor(
    private readonly lovenseSrv: LovenseService,
    private readonly discordSrv: DiscordService,
  ) {}

  @Handler()
  async onLink(
    @InteractionEvent() interaction: CommandInteraction,
  ): Promise<void> {
    const kcUser = await getKCUserByDiscordId(interaction.user.id);
    if (!kcUser) {
      await interaction.reply(NEED_TO_REGISTER_PLEASUREPAL);
      return;
    }

    const credentials = await this.lovenseSrv.getCredentials(kcUser.id, true);

    if (credentials) {
      const msg = await interaction.reply({
        content: LOVENSE_ACCOUNT_ALREADY_LINKED,
        ephemeral: true,
        components: ALREADY_LINKED_COMPONENTS,
      });

      const actionCollector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (i) => i.customId === 'link' || i.customId === 'unlink',
        time: 60000,
      });

      const cancelCollector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (i) => i.customId === 'cancel',
        time: 60000,
      });

      // Collect Button interactions
      actionCollector.on('collect', async (i) => {
        i.deferUpdate();
        if (i.customId === 'link') {
          const qr = await this.lovenseSrv.getLinkQrCode(
            kcUser.id,
            kcUser.username,
          );
          await this.discordSrv.pollLinkStatus(
            interaction,
            qr,
            kcUser.id,
            true,
          );
          return actionCollector.stop();
        } else if (i.customId === 'unlink') {
          await this.lovenseSrv.unlinkLovense(kcUser.id);
          await interaction.editReply({
            content: LOVENSE_ACCOUNT_UNLINKED,
            components: [],
            embeds: [],
          });
          actionCollector.stop();
        }
      });

      cancelCollector.on('collect', async (i) => {
        await interaction.editReply({
          content: 'Relinking cancelled',
          components: [],
          embeds: [],
        });
        cancelCollector.stop();
      });

      // Handle timeout after 60 seconds
      cancelCollector.on('end', (i, reason) =>
        interactionTimeout(interaction, reason, ':x: Relinking cancelled!'),
      );
      return;
    } else {
      const qr = await this.lovenseSrv.getLinkQrCode(
        kcUser.id,
        kcUser.username,
      );
      return this.discordSrv.pollLinkStatus(interaction, qr, kcUser.id);
    }
  }
}
