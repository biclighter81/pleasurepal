import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { ButtonStyle, CommandInteraction, ComponentType } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { LovenseService } from 'src/lovense/lovense.service';
import { QRCodeResponse } from 'src/lib/interfaces/lovense';
import { buildLovenseQrCodeEmbed } from 'src/lib/interaction-helper';
import {
  LOVENSE_ACCOUNT_ALREADY_LINKED,
  LOVENSE_ACCOUNT_UNLINKED,
  LOVENSE_QR_CODE_GENERATION_ERROR,
  NEED_TO_REGISTER_PLEASUREPAL,
} from 'src/lib/constants';

@Command({
  name: 'link',
  description:
    'Link your Lovense account to your Discord and pleasurepal account.',
})
@Injectable()
export class LinkCommand {
  constructor(private readonly lovenseSrv: LovenseService) {}

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

    async function sendQr(lovenseSrv: LovenseService, replied: boolean) {
      let qr: QRCodeResponse;
      try {
        qr = await lovenseSrv.getLinkQrCode(kcUser.id, kcUser.username);
      } catch (e) {
        console.error(e);
        await interaction.followUp(LOVENSE_QR_CODE_GENERATION_ERROR);
        return;
      }
      const embedBuilder = buildLovenseQrCodeEmbed(qr.message);
      if (replied) {
        await interaction.editReply({
          embeds: [embedBuilder.toJSON()],
          components: [],
        });
      } else {
        await interaction.reply({
          embeds: [embedBuilder.toJSON()],
          components: [],
        });
      }
    }

    if (credentials) {
      const msg = await interaction.reply({
        content: LOVENSE_ACCOUNT_ALREADY_LINKED,
        ephemeral: true,
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                style: ButtonStyle.Primary,
                label: 'Try re-linking',
                customId: 'link',
              },
              {
                type: ComponentType.Button,
                style: ButtonStyle.Danger,
                label: 'Unlink account',
                customId: 'unlink',
              },
            ],
          },
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                style: ButtonStyle.Secondary,
                label: 'Cancel',
                customId: 'cancel',
              },
            ],
          },
        ],
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
      actionCollector.on('collect', async (i) => {
        i.deferUpdate();
        if (i.customId === 'link') {
          await sendQr(this.lovenseSrv, true);
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
      cancelCollector.on('end', (i, reason) => {
        if (reason === 'time') {
          interaction.editReply({
            content: ':x: Relinking timed out!',
            components: [],
            embeds: [],
          });
        }
      });
      return;
    } else {
      return sendQr(this.lovenseSrv, false);
    }
  }
}
