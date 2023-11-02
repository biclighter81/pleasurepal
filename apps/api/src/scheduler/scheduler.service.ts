import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DeviceService } from 'src/device/device.service';
import { DiscordService } from 'src/discord/discord.service';
import { getDiscordUidByKCId } from 'src/lib/keycloak';
import { LovenseFunctionCommand } from 'src/lovense/dto/lovense-command.dto';
import { LovenseControlService } from 'src/lovense/lovense-control.service';
import { ActionQueue } from 'src/session/entities/action-queue.entity';
import { PleasureSession } from 'src/session/entities/pleasure-session.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SchedulerService {
  private readonly logger: Logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(ActionQueue)
    private readonly actionQueueRepo: Repository<ActionQueue>,
    @InjectRepository(PleasureSession)
    private readonly pleasureSessionRepo: Repository<PleasureSession>,
    private readonly lovenseControlSrv: LovenseControlService,
    private readonly discordSrv: DiscordService,
  ) {}

  async getNextActions(): Promise<ActionQueue[]> {
    return this.actionQueueRepo.query(
      'select sub.* from (select *, row_number() over (partition by "sessionId") from action_queue laq where laq."startedAt" is null order by "sessionId", "index") "sub" where "sub".row_number = 1',
    );
  }

  async getAction(
    sessionId: string,
    idx: number,
  ): Promise<ActionQueue | undefined> {
    return this.actionQueueRepo.findOne({
      where: {
        sessionId: sessionId,
        index: idx,
      },
    });
  }

  async setActionStarted(sessionId: string, idx: number) {
    await this.actionQueueRepo.update(
      { sessionId: sessionId, index: idx },
      { startedAt: new Date() },
    );
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async pollQueue() {
    // Get the first action for each session
    const actions = await this.getNextActions();
    for (const action of actions) {
      const prev = await this.getAction(action.sessionId, action.index - 1);
      const prevActionBody = prev ? JSON.parse(prev?.action || {}) : null;
      if (
        !prev ||
        prevActionBody.timeSec * 1000 + prev.startedAt.getTime() <=
          new Date().getTime()
      ) {
        // Previous action is done
        await this.setActionStarted(action.sessionId, action.index);
        //send action to lovense for all users in session
        const session = await this.pleasureSessionRepo.findOne({
          where: { id: action.sessionId },
          relations: ['user'],
        });
        if (session) {
          const allPromises = session.user.map((p) =>
            this.lovenseControlSrv.sendLovenseFunction({
              kcId: p.uid,
              ...(JSON.parse(action.action) as LovenseFunctionCommand),
            }),
          );
          return await Promise.all(allPromises);
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async invalidateExpiredSessions() {
    //invalidate sessions that have not been used in 30 minutes
    const inactiveSessions = (await this.actionQueueRepo.query(`
    select * from (
        select
        ps.*,
        row_number() over(partition by ps.id) num
      from
        pleasure_session ps
      left outer join action_queue laq on
        ps.id = laq."sessionId"
        where
        ps.active = true
        and ((laq."sessionId" is null
          and ps."createdAt" + interval '1 hour' < now() - interval '30 minutes')
        or (laq."startedAt" is not null
          and laq."startedAt"  + interval '1 hour' < now() - interval '30 minutes'))
          ) sub where sub.num = 1
    `)) as PleasureSession[];
    if (inactiveSessions.length) {
      console.log(`Invalidating ${inactiveSessions.length} sessions!`);
    }
    for (const session of inactiveSessions) {
      await this.pleasureSessionRepo.update(session.id, {
        active: false,
      });
      //send message to users in session
      const sessionUsers = await this.pleasureSessionRepo.findOne({
        where: { id: session.id },
        relations: ['user'],
      });
      if (sessionUsers) {
        const allPromises = sessionUsers.user.map((p) => {
          return new Promise<void>(async (resolve, reject) => {
            const discordUid = await getDiscordUidByKCId(p.uid);
            this.discordSrv.sendMessage(
              discordUid,
              `:x: Your session \`${session.id}\` has expired after 30 minutes without use!`,
            ),
              resolve();
          });
        });
        return await Promise.all(allPromises);
      }
    }
  }
}
