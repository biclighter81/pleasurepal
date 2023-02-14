import { InjectDiscordClient, On, Once } from '@discord-nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { ChatInputCommandInteraction, Client, Message } from 'discord.js';

@Injectable()
export class DiscordService {
  private readonly logger: Logger = new Logger(DiscordService.name);

  constructor(
    @InjectDiscordClient()
    private readonly client: Client,
  ) {}

  @Once('ready')
  onReady() {
    this.logger.log(`Bot ${this.client.user.tag} was started!`);
  }

  async sendMessageToUser(userId: string, message: string) {
    const user = await this.client.users.fetch(userId);
    await user.send(message);
  }
}
