import { inject, injectable } from "inversify";
import { DeferredDiscordInvite } from "../../lib/entities/deferred-discord-invite.entity";
import { PleasureSession } from "../../lib/entities/pleasure-session.entity";
import { User_PleasureSession } from "../../lib/entities/user_plesure_session.entity";
import TYPES from "../../lib/symbols";
import { Repository } from "typeorm";
import { DiscordService } from "./DiscordService";
import { SessionService } from "./SessionService";
import { ButtonStyle, ComponentType, Message, User } from "discord.js";
import { SESSION_INVITATION_COMPONENTS } from "../../lib/interaction-helper";
import { getDiscordUidByKCId } from "../../lib/keycloak";

@injectable()
export class DiscordSessionService {
    public constructor(
        @inject(TYPES.PleasureSessionRepository) private sessionRepo: Repository<PleasureSession>,
        @inject(TYPES.UserSessionRepository) private userSessionRepo: Repository<User_PleasureSession>,
        @inject(TYPES.DeferredDiscordInviteRepository) private deferredInviteRepo: Repository<DeferredDiscordInvite>,
        @inject(TYPES.DiscordService) private discordSrv: DiscordService,
        @inject(TYPES.SessionService) private sessionSrv: SessionService,
    ) {}

    async getDiscordUsers(sessionId: string) {
        const session = await this.sessionRepo.findOne({
          where: { id: sessionId },
          relations: ['user'],
        });
        let users: { user: User; kcId: string }[] = [];
        for (const user of session.user) {
          const duid = await getDiscordUidByKCId(user.uid);
          if (!duid) continue;
          const duser = await this.discordSrv.getUser(duid);
          if (!duser) continue;
          users.push({ user: duser, kcId: user.uid });
        }
        return users;
      }
    
      async sendInvite(sessionId: string, uid: string, initiatorUid: string) {
        const initduid = await getDiscordUidByKCId(initiatorUid);
        const initiator = await this.discordSrv.getUser(initduid);
        const duid = await getDiscordUidByKCId(uid);
        const user = await this.discordSrv.getUser(duid);
        if (!user) return;
        const msg = await user.send({
          content: `You have been invited to a session by <@${initduid}>!`,
          components: SESSION_INVITATION_COMPONENTS,
        });
        const buttonCollector = msg.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 300000,
        });
        await this.pollInviteStatus(sessionId, uid, msg);
        buttonCollector.on('collect', async (interaction) => {
          if (interaction.customId === 'joinSession') {
            await this.handleAcceptInvite(sessionId, uid);
            await interaction.update({
              content: `:white_check_mark: You have accepted the invitation for session \`${sessionId}\`!`,
              components: [],
            });
          } else if (interaction.customId === 'declineSession') {
            await this.handleDeclineInvite(sessionId, uid);
            await interaction.update({
              content: `:x: You have declined the invitation!`,
              components: [],
            });
          }
          await this.sessionSrv.inviteAnswered(sessionId, uid);
        });
        buttonCollector.on('end', async (_, reason) => {
          if (reason == 'time')
            await msg.edit({
              content: `:x: The session invite to session \`${sessionId}\` from <@${initiator.id}> has expired!`,
              components: [],
            });
        });
      }
    
      async pollInviteStatus(sessionId: string, uid: string, msg: Message<false>) {
        //poll status because user may accept in pleasurepal frontend
        let iterations = 0;
        const interval = setInterval(async () => {
          iterations++;
          if (iterations > 300) {
            clearInterval(interval);
            return;
          }
          const session = await this.sessionRepo.findOne({
            where: { id: sessionId },
            relations: ['user'],
          });
          const user = session.user.find((u) => u.uid == uid);
          if (user && user.inviteAccepted) {
            await msg.edit({
              content: `:white_check_mark: You have accepted the invitation for session \`${sessionId}\`!`,
              components: [],
            });
            clearInterval(interval);
          } else if (user && user.inviteAccepted == false) {
            await msg.edit({
              content: `:x: You have declined the invitation!`,
              components: [],
            });
            clearInterval(interval);
          }
        }, 1000);
      }
    
      async handleAcceptInvite(sessionId: string, uid: string) {
        await this.userSessionRepo.save({
          uid: uid,
          pleasureSessionId: sessionId,
          inviteAccepted: true,
          active: true,
          lastActive: new Date(),
        });
      }
    
      async handleDeclineInvite(sessionId: string, uid: string) {
        await this.userSessionRepo.save({
          uid: uid,
          pleasureSessionId: sessionId,
          inviteAccepted: false,
          active: false,
          lastActive: new Date(),
        });
      }
    
      async handleDeferredInvite(sessionId: string, duid: string) {
        await this.deferredInviteRepo.save({
          duid,
          sessionId,
        });
        const user = await this.discordSrv.getUser(duid);
        await user.send({
          content: `You have been invited to a the pleasurepal session \`${sessionId}\` but you don't have a pleasurepal account! \n Please create one to join the session!`,
          components: [
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.Button,
                  label: 'Create Account',
                  style: ButtonStyle.Link,
                  url: 'https://pleasurepal.de',
                },
              ],
            },
          ],
        });
      }
}