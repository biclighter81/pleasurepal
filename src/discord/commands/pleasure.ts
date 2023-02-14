import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { CommandInteraction, ComponentType } from 'discord.js';
import { SlashCommandPipe } from '@discord-nestjs/common';
import { Injectable } from '@nestjs/common';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { LovenseService } from 'src/lovense/lovense.service';
import { QRCodeResponse } from 'src/lib/interfaces/lovense';
import { buildLovenseQrCodeEmbed } from 'src/lib/interaction-helper';
import {
  LOVENSE_ACCOUNT_ALREADY_LINKED,
  LOVENSE_ACCOUNT_NOT_LINKED,
  LOVENSE_QR_CODE_GENERATION_ERROR,
  NEED_TO_REGISTER_PLEASUREPAL,
} from 'src/lib/constants';
import {
  PleasureActionOptions,
  PleasureCommandDto,
} from '../command-dto/pleasure.dto';
import { capatializeFirstLetter } from 'src/lib/utils';

@Command({
  name: 'pleasure',
  description: 'Pleasure yourself or others with simple commands.',
})
@Injectable()
export class PleasureCommand {
  constructor(private readonly lovenseSrv: LovenseService) {}

  @Handler()
  async onLink(
    @InteractionEvent(SlashCommandPipe) dto: PleasureCommandDto,
    @InteractionEvent() interaction: CommandInteraction,
  ): Promise<void> {
    const kcUser = await getKCUserByDiscordId(interaction.user.id);
    if (!kcUser) {
      await interaction.reply(NEED_TO_REGISTER_PLEASUREPAL);
      return;
    }
    const credentials = await this.lovenseSrv.getCredentials(kcUser.id);
    if (!credentials) {
      await interaction.reply(LOVENSE_ACCOUNT_NOT_LINKED);
      return;
    }
    // Get users from command
    let users = [dto.user, dto.user2, dto.user3, dto.user4, dto.user5];
    users = users.filter((user) => user);
    if (users.length && dto.channelsession) {
      await interaction.reply(
        `You can't manually add users to a channel session! Please remove the users or set the channel session to false, to start a manual session.`,
      );
      return;
    }
    if (!users.length && !dto.channelsession) {
      await interaction.reply(
        `You need to add users or set the channel session to true, to start a session.`,
      );
      return;
    }
    for (const uid of users) {
      const user = await getKCUserByDiscordId(uid);
      if (!user) {
        const discordUser = await this.lovenseSrv.getDiscordUser(uid);
        await discordUser.send({
          isInteraction: true,
          content: NEED_TO_REGISTER_PLEASUREPAL,
        });
      }
      // Send Toy Selection
      if (uid === interaction.user.id) {
        const creds = await this.lovenseSrv.getCredentials(kcUser.id);
        interaction
          .reply({
            content: `You have started a session! Now select a toy to use.`,
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 3,
                    custom_id: 'lovense_toys',
                    label: 'Select a toy',
                    placeholder: 'Select a toy',
                    options: creds?.toys.map((toy) => {
                      return {
                        label: toy.nickName || toy.name,
                        value: toy.id,
                      };
                    }),
                  },
                ],
              },
            ],
          })
          .then((msg) => {
            const collector = msg.createMessageComponentCollector();
            collector.on('collect', async (i) => {
              if (
                i.customId === 'lovense_toys' &&
                i.componentType === ComponentType.StringSelect
              ) {
                await i.reply({
                  content: `You have selected the toy ${i.values[0]}! The session will start shortly.`,
                  ephemeral: true,
                });
                const cmdRes = await this.lovenseSrv.sendLovenseFunction({
                  kcId: user.id,
                  action: capatializeFirstLetter(
                    PleasureActionOptions[dto.action],
                  ),
                  intensity: dto.intensity,
                  loopPauseSec: dto.looppausesec,
                  loopRunningSec: dto.looprunningsec,
                  timeSec: dto.duration,
                  stopPrevious: false,
                });
                console.log(cmdRes);
                if (cmdRes.code !== 200) {
                  await i.editReply(
                    `There was an error sending the command to the toy: ${cmdRes.message}\n Please try again later.`,
                  );
                }
              }
            });
          });
      }

      // Send Toy Selection and Session Request
      //await this.lovenseSrv.sendSessionRequest(uid, user.id);
    }
  }
}
