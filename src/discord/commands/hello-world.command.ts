import { Command, Handler } from '@discord-nestjs/core';
import { CommandInteraction } from 'discord.js';
import { Injectable } from '@nestjs/common';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { LovenseService } from 'src/lovense/lovense.service';
import { QRCodeResponse } from 'src/lib/interfaces/lovense';

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
      await interaction.reply(
        'You are not registered or your Discord account is not linked yet! Please register under https://pleasurepal.de - [http://localhost:3000] and link your discord account!',
      );
      return;
    }
    const credentials = await this.lovenseSrv.getCredentials(kcUser.id);
    if (!credentials) {
      let qr: QRCodeResponse;
      try {
        qr = await this.lovenseSrv.getLinkQrCode(kcUser.id, kcUser.username);
      } catch (e) {
        await interaction.reply(
          'An error occured while trying to get the Lovense link QR Code! Please try again later!',
        );
        return;
      }
      //lovense account is not linked yet
      interaction.reply(
        'Your Lovense account is not linked yet! Please link your Lovense account with the lovense Connect or Remote App, using this qr code: ' +
          qr.message,
      );
    }
    await interaction.reply(JSON.stringify(kcUser));
  }
}
