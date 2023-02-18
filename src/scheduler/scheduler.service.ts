import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LovenseFunctionCommand } from 'src/lovense/dto/lovense-command.dto';
import { LovenseActionQueue } from 'src/lovense/entities/lovense-action-queue.entity';
import { LovenseDiscordSession } from 'src/lovense/entities/lovense-discord-session.entity';
import { LovenseService } from 'src/lovense/lovense.service';
import { Repository } from 'typeorm';

@Injectable()
export class SchedulerService {
  private readonly logger: Logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(LovenseActionQueue)
    private readonly actionQueueRepo: Repository<LovenseActionQueue>,
    @InjectRepository(LovenseDiscordSession)
    private readonly lovenseDiscordSessionRepo: Repository<LovenseDiscordSession>,
    private readonly lovenseSrv: LovenseService,
  ) {}

  @Cron('*/5 * * * * *')
  async pollQueue() {
    // Get the first action for each session
    const queue = (await this.actionQueueRepo.query(
      'select sub.* from (select *, row_number() over (partition by "sessionId") from lovense_action_queue laq where laq."startedAt" is null order by "sessionId", "index") "sub" where "sub".row_number = 1',
    )) as LovenseActionQueue[];
    for (const action of queue) {
      const prev = await this.actionQueueRepo.findOne({
        where: { sessionId: action.sessionId, index: action.index - 1 },
      });
      const prevAction = prev ? JSON.parse(prev?.action || {}) : null;
      if (
        !prev ||
        prevAction.timeSec * 1000 + prev.startedAt.getTime() <=
          new Date().getTime()
      ) {
        // Previous action is done
        await this.actionQueueRepo.update(
          { sessionId: action.sessionId, index: action.index },
          { startedAt: new Date() },
        );
        //send action to lovense for all users in session
        const session = await this.lovenseDiscordSessionRepo.findOne({
          where: { id: action.sessionId },
          relations: ['credentials'],
        });
        if (session) {
          const allPromises = session.credentials.map((p) =>
            this.lovenseSrv.sendLovenseFunction({
              kcId: p.lovenseCredentialsUid,
              ...(JSON.parse(action.action) as LovenseFunctionCommand),
            }),
          );
          return await Promise.all(allPromises);
        }
      }
      const session = await this.lovenseDiscordSessionRepo.findOne({
        where: { id: action.sessionId },
      });
      if (session) {
      }
    }
  }
}
