import { inject, injectable } from "inversify";
import { LovenseHeartbeat } from "../../lib/entities/lovense-heartbeat.entity";
import { LovenseToy } from "../../lib/entities/lovense-toy.entity";
import { User_PleasureSession } from "../../lib/entities/user_plesure_session.entity";
import TYPES from "../../lib/symbols";
import { Repository } from "typeorm";
import { DiscordService } from "./DiscordService";
import { QRCodeResponse } from "../../lib/interfaces/lovense";
import axios from "axios";

@injectable()
export class LovenseService {
    constructor(
        @inject(TYPES.LovenseHeartbeatRepository) private lovenseHeartbeatRepo: Repository<LovenseHeartbeat>,
        @inject(TYPES.LovenseToyRepository) private lovenseToyRepo: Repository<LovenseToy>,
        @inject(TYPES.UserSessionRepository) private userPleasureSessionRepo: Repository<User_PleasureSession>,
        @inject(TYPES.DiscordService) private discordService: DiscordService,
    ) {}

    async callback(body: /*LovenseCallback*/ any) {
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
    
      async saveCallbackToys(toys: /*LovenseCallback['toys']*/ any) {
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
          throw e;
        }
      }
}