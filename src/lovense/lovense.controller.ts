import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from 'nest-keycloak-connect';
import { LovenseCredentials } from './dto/lovense-credentials.dto';
import { LovenseService } from './lovense.service';

@Controller('lovense')
export class LovenseController {
  constructor(private readonly lovenseSrv: LovenseService) {}

  @Post('callback')
  @Public(true)
  async callback(@Body() body: LovenseCredentials) {
    return this.lovenseSrv.callback(body);
  }

  @Get('callback')
  @Public(true)
  async callbackGet() {
    return 'OK!';
  }

  @Post('qr/discord/:uid')
  async sendLovenseQr(@Param('uid') uid: string) {
    return this.lovenseSrv.sendLovenseQRCode(uid);
  }
}
