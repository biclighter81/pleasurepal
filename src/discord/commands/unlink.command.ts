import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import { CommandInteraction } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { LovenseService } from 'src/lovense/lovense.service';
import {
  LOVENSE_ACCOUNT_ALREADY_UNLINKED,
  NEED_TO_REGISTER_PLEASUREPAL,
} from 'src/lib/constants';

@Command({
  name: 'unlink',
  description:
    'Unlink your Lovense account from your Discord and pleasurepal account.',
})
@Injectable()
export class UnlinkCommand {
  constructor(private readonly lovenseSrv: LovenseService) {}

  @Handler()
  async onUnlink(
    @InteractionEvent() interaction: CommandInteraction,
  ): Promise<void> {
    const kcUser = await getKCUserByDiscordId(interaction.user.id);
    if (!kcUser) {
      await interaction.reply(NEED_TO_REGISTER_PLEASUREPAL);
      return;
    }
    const credentials = await this.lovenseSrv.getCredentials(kcUser.id);
    if (!credentials) {
      await interaction.reply(LOVENSE_ACCOUNT_ALREADY_UNLINKED);
      return;
    }
    await this.lovenseSrv.deleteCredentials(kcUser.id);
    await interaction.reply(LOVENSE_ACCOUNT_ALREADY_UNLINKED);
  }
}
