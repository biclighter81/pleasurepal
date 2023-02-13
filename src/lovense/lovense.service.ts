import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LovenseCredentials as LovenseCredentialsDto } from './dto/lovense-credentials.dto';
import { LovenseCredentials } from './entities/lovense-credentials.entity';
import { LovenseToy } from './entities/lovense-toy.entity';
import axios from 'axios';
import { QRCodeResponse } from 'src/lib/interfaces/lovense';
import { DiscordService } from 'src/discord/discord.service';
import { getDiscordUidByKCId } from 'src/lib/keycloak';

@Injectable()
export class LovenseService {
  private readonly logger: Logger = new Logger(LovenseService.name);

  constructor(
    @InjectRepository(LovenseCredentials)
    private readonly lovenseCredRepo: Repository<LovenseCredentials>,
    @InjectRepository(LovenseToy)
    private readonly lovenseToyRepo: Repository<LovenseToy>,
    private readonly discordSrv: DiscordService,
  ) {}

  async callback(body: LovenseCredentialsDto) {
    console.log('heartbeat', JSON.stringify(body));
    const existingCreds = await this.lovenseCredRepo.findOne({
      relations: ['toys'],
      where: { uid: body.uid },
    });
    const toys = await this.lovenseToyRepo.save(
      Object.keys(body.toys).map((key) => ({
        id: key,
        nickName: body.toys[key].nickName,
        name: body.toys[key].name,
        status: body.toys[key].status,
      })),
    );
    const credentials = await this.lovenseCredRepo.save({
      ...body,
      toys: toys,
    });
    // Send success message to user if this is the first time linking or if the toys changed
    if (
      !existingCreds ||
      existingCreds.toys.sort().join() !== toys.sort().join()
    ) {
      const discordUid = await getDiscordUidByKCId(body.uid);
      if (!discordUid) return credentials;
      await this.discordSrv.sendMessageToUser(
        discordUid,
        `Your Lovense toy(s): ${toys
          .map((t) => t.nickName || t.name)
          .join(',')} are now linked to your account!`,
      );
    }
    return credentials;
  }

  async getCredentials(kcId: string) {
    return this.lovenseCredRepo.findOne({
      relations: ['toys'],
      where: { uid: kcId },
    });
  }

  async getLinkQrCode(kcId: string, username: string): Promise<QRCodeResponse> {
    try {
      const res = await axios.post<QRCodeResponse>(
        `https://api.lovense-api.com/api/lan/getQrCode`,
        {
          uid: kcId,
          username: username,
          token: process.env.LOVENSE_API_TOKEN,
        },
      );
      return res.data;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
}
