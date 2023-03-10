import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
} from '@nestjs/common';
import { Public } from 'nest-keycloak-connect';
import { DiscordService } from 'src/discord/discord.service';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { LovenseCredentials } from './dto/lovense-credentials.dto';
import { LovenseService } from './lovense.service';

@Controller('lovense')
export class LovenseController {
  constructor(
    private readonly lovenseSrv: LovenseService,
    private readonly discordSrv: DiscordService,
  ) {}

  @Post('callback')
  @Public(true)
  async callback(@Body() body: LovenseCredentials) {
    return this.lovenseSrv.callback(body);
  }

  @Post('qr/discord/:uid')
  async sendLovenseQr(@Param('uid') uid: string) {
    const kcUser = await getKCUserByDiscordId(uid);
    if (!kcUser) {
      throw new HttpException(
        'Discord user is not linked to pleasurepal!',
        404,
      );
    }
    const qr = await this.lovenseSrv.getLinkQrCode(kcUser.id, kcUser.username);
    return this.discordSrv.sendLovenseQRCode(uid, qr);
  }
}
