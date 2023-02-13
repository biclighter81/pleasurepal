import { Command, Handler } from '@discord-nestjs/core';
import { CommandInteraction } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { LovenseService } from 'src/lovense/lovense.service';
import {
  LOVENSE_ACCOUNT_NOT_LINKED,
  NEED_TO_REGISTER_PLEASUREPAL,
} from 'src/lib/constants';

@Command({
  name: 'helloworld',
  description: 'Hello World Command',
})
@Injectable()
export class HelloWorldCommand {
  constructor(private readonly lovenseSrv: LovenseService) {}

  @Handler()
  async handle(interaction: CommandInteraction): Promise<void> {
    const kcUser = await getKCUserByDiscordId(interaction.user.id);
    if (!kcUser) {
      await interaction.reply(NEED_TO_REGISTER_PLEASUREPAL);
      return;
    }
    const credentials = await this.lovenseSrv.getCredentials(kcUser.id);
    if (!credentials) {
      interaction.reply(LOVENSE_ACCOUNT_NOT_LINKED);
    }
    await interaction.reply(JSON.stringify(kcUser));
  }
}
