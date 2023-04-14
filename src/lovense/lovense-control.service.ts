import { Injectable, Logger } from '@nestjs/common';
import { DiscordService } from 'src/discord/discord.service';
import { LovenseFunctionCommand } from './dto/lovense-command.dto';
import { LovenseService } from './lovense.service';
import axios from 'axios';

@Injectable()
export class LovenseControlSservice {
  private readonly logger: Logger = new Logger(LovenseControlSservice.name);

  constructor(
    private readonly lovenseSrv: LovenseService,
    private readonly discordSrv: DiscordService,
  ) {}

  async sendLovenseFunction(
    command: {
      kcId: string;
    } & LovenseFunctionCommand,
  ) {
    const lastHeartbeat = await this.lovenseSrv.getLastHeartbeat(command.kcId);
    if (!lastHeartbeat) throw new Error('No user found');
    const res = await axios.post(
      `https://api.lovense-api.com/api/lan/v2/command`,
      {
        command: 'Function',
        token: process.env.LOVENSE_API_TOKEN,
        uid: command.kcId,
        action: command.action + ':' + (command.intensity || 5),
        timeSec: command.timeSec,
        loopRunningSec: command.loopRunningSec,
        loopPauseSec: command.loopPauseSec,
        stopPrevious: command.stopPrevious ? 1 : 0,
      },
    );
    console.log(res.data);
    return res.data;
  }
}
