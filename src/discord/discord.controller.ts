import { Body, Controller, Get, Post } from '@nestjs/common';
import { Public } from 'nest-keycloak-connect';
import { DiscordService } from './discord.service';

@Controller('discord')
export class DiscordController {
  constructor(private readonly discordSrv: DiscordService) {}

  @Post('send-lovense-qr')
  async sendLovenseQr(@Body() body: { uid: string }) {}
}
