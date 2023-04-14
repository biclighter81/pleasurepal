import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LovenseCallback } from './dto/lovense-user.dto';
import { LovenseToy } from './entities/lovense-toy.entity';
import axios from 'axios';
import { QRCodeResponse } from 'src/lib/interfaces/lovense';
import { DiscordService } from 'src/discord/discord.service';
import { LovenseHeartbeat } from './entities/lovense-heartbeat.entity';
import { User_PleasureSession } from 'src/session/entities/user_plesure_session.join-entity';

@Injectable()
export class LovenseService {
  private readonly logger: Logger = new Logger(LovenseService.name);

  constructor(
    @InjectRepository(LovenseHeartbeat)
    private readonly lovenseHeartbeatRepo: Repository<LovenseHeartbeat>,
    @InjectRepository(LovenseToy)
    private readonly lovenseToyRepo: Repository<LovenseToy>,
    @InjectRepository(User_PleasureSession)
    private readonly userPleasureSessionRepo: Repository<User_PleasureSession>,
    public readonly discordSrv: DiscordService,
  ) {}

  async callback(body: LovenseCallback) {
    const existingUser = await this.lovenseHeartbeatRepo.findOne({
      relations: ['toys'],
      where: { uid: body.uid },
    });
    // ignore webhook on unlinked
    if (existingUser?.unlinked) return;
    const toys = await this.saveCallbackToys(body.toys);
    const user = await this.lovenseHeartbeatRepo.save({
      uid: body.uid,
      toys: toys,
      lastHeartbeat: new Date(),
    });
    return user;
  }

  async getLastHeartbeat(kcId: string) {
    return this.lovenseHeartbeatRepo.findOne({
      relations: ['toys'],
      where: { uid: kcId },
    });
  }

  async saveCallbackToys(toys: LovenseCallback['toys']) {
    return this.lovenseToyRepo.save(
      Object.keys(toys).map((key) => ({
        id: key,
        nickName: toys[key].nickName,
        name: toys[key].name,
        status: toys[key].status,
      })),
    );
  }

  async unlinkLovense(kcId: string) {
    await this.userPleasureSessionRepo.update(
      {
        uid: kcId,
      },
      { active: false },
    );
    return this.lovenseHeartbeatRepo.update({ uid: kcId }, { unlinked: true });
  }

  async getLinkQrCode(kcId: string, username: string): Promise<QRCodeResponse> {
    try {
      //reset unlinked flag if it was set
      await this.lovenseHeartbeatRepo.update(
        { uid: kcId },
        { unlinked: false },
      );
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
