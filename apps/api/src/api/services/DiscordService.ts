import { CommandInteraction, User as DiscordUser, Message } from "discord.js";
import { inject, injectable } from "inversify";
import { LovenseHeartbeat } from "@/lib/entities/lovense-heartbeat.entity";
import { buildLovenseQrCodeEmbed } from "@/lib/interaction-helper";
import { QRCodeResponse } from "@/lib/interfaces/lovense";
import { getKCUserByDiscordId } from "@/lib/keycloak";
import TYPES from "@/lib/symbols";
import { LOVENSE_HEARTBEAT_INTERVAL } from "@/lib/utils";
import { Repository } from "typeorm";
import { Discord } from "../services/Discord";

@injectable()
export class DiscordService {
  public constructor(
    @inject(TYPES.LovenseHeartbeatRepository) private lovenseHeartbeatRepo: Repository<LovenseHeartbeat>,
    @inject(TYPES.Discord) private discord: Discord,
  ) { }


  async sendMessage(discordUid: string, message: string) {
    const client = this.discord.getClient();
    const user = await client.users.fetch(discordUid);
    await user.send(message);
  }

  async getUser(uid: string) {
    const client = this.discord.getClient();
    return client.users.fetch(uid);
  }

  //called by frontend after identifying with discord
  async sendLovenseQRCode(discordUId: string, qr: QRCodeResponse) {
    const client = this.discord.getClient();
    const user = await client.users.fetch(discordUId);
    const kcUser = await getKCUserByDiscordId(discordUId);
    if (!kcUser) {
      throw new Error('Discord user not found in Keycloak');
    }
    const embedBuilder = buildLovenseQrCodeEmbed(
      qr.message,
      'Pleasurepal identification successful! Now link your Lovense toys to your account!',
    );
    await user.send({
      embeds: [embedBuilder.toJSON()],
    });
  }

  async pollLinkStatus(
    interaction: CommandInteraction | DiscordUser,
    qr: QRCodeResponse,
    uid: string,
    hasReplied?: boolean,
  ): Promise<boolean> {
    //todo: custom message if invited f.e.
    //send qr code
    const message = await this.sendQr(qr, interaction, hasReplied);
    //check if user has linked their toys every 3 seconds
    let tries = 0;
    return new Promise<boolean>((resolve) => {
      const interval = setInterval(async () => {
        tries++;
        //stop after 5 minutes
        if (tries > 300) {
          clearInterval(interval);
          resolve(false);
        }
        //poll for heartbeat
        let user = await this.lovenseHeartbeatRepo.findOne({
          where: { uid: uid },
        });
        if (
          user?.lastHeartbeat?.getTime() >
          Date.now() - LOVENSE_HEARTBEAT_INTERVAL
        ) {
          if (message) {
            message.delete();
          }
          if (interaction instanceof CommandInteraction) {
            await interaction.editReply({
              content:
                ':white_check_mark: We have noticed that you have opened the Lovense Remote app and successfully linked your account!',
              embeds: [],
              components: [],
            });
          }
          clearInterval(interval);
          resolve(true);
        }
      }, 1000);
    });
  }

  async sendQr(
    qr: QRCodeResponse,
    interaction: CommandInteraction | DiscordUser,
    hasReplied?: boolean,
  ) {
    const embedBuilder = buildLovenseQrCodeEmbed(qr.message);
    let message: Message;
    if (hasReplied && interaction instanceof CommandInteraction) {
      await interaction.editReply({
        embeds: [embedBuilder.toJSON()],
        components: [],
      });
    } else if (interaction instanceof CommandInteraction) {
      await interaction.reply({
        ephemeral: true,
        embeds: [embedBuilder.toJSON()],
        components: [],
      });
    } else {
      message = await interaction.send({
        embeds: [embedBuilder.toJSON()],
      });
    }
    return message;
  }
}