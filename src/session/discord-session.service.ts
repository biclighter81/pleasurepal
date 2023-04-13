import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ComponentType, User } from 'discord.js';
import { DiscordService } from 'src/discord/discord.service';
import { getDiscordUidByKCId } from 'src/lib/keycloak';
import { Repository } from 'typeorm';
import { PleasureSession } from './entities/pleasure-session.entity';
import { SESSION_INVITATION_COMPONENTS } from '../lib/interaction-helper';
import { User_PleasureSession } from './entities/user_plesure_session.join-entity';

@Injectable()
export class DiscordSessionService {
  constructor(
    @InjectRepository(PleasureSession)
    private readonly sessionRepo: Repository<PleasureSession>,
    @InjectRepository(User_PleasureSession)
    private readonly userSessionRepo: Repository<User_PleasureSession>,
    private readonly discordSrv: DiscordService,
  ) {}

  async getDiscordUsers(sessionId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });
    let users: User[] = [];
    for (const user of session.user) {
      const duid = await getDiscordUidByKCId(user.uid);
      if (!duid) continue;
      const duser = await this.discordSrv.getUser(duid);
      if (!duser) continue;
      users.push(duser);
    }
    return users;
  }

  async sendInvite(sessionId: string, duid: string, initiatorUid: string) {
    const initiator = await this.discordSrv.getUser(initiatorUid);
    const user = await this.discordSrv.getUser(duid);
    if (!user) return;
    const msg = await user.send({
      content: `You have been invited to a session by <@${initiator.id}>!`,
      components: SESSION_INVITATION_COMPONENTS,
    });
    const buttonCollector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30000,
    });
    buttonCollector.on('collect', async (interaction) => {
      if (interaction.customId === 'accept') {
        await this.handleAcceptInvite(sessionId, duid);
        await interaction.update({
          content: `You have accepted the invitation!`,
          components: [],
        });
      } else if (interaction.customId === 'decline') {
        await this.handleDeclineInvite(sessionId, duid);
        await interaction.update({
          content: `You have declined the invitation!`,
          components: [],
        });
      }
    });
    buttonCollector.on('end', async () => {
      await msg.edit({
        content: `:x: The session invite to session \`${sessionId}\` from <@${initiator.id}> has expired!`,
        components: [],
      });
    });
  }

  async handleAcceptInvite(sessionId: string, duid: string) {
    await this.userSessionRepo.save({
      uid: duid,
      pleasureSessionId: sessionId,
      inviteAccepted: true,
      lastActive: new Date(),
    });
  }

  async handleDeclineInvite(sessionId: string, duid: string) {
    await this.userSessionRepo.save({
      uid: duid,
      pleasureSessionId: sessionId,
      inviteAccepted: false,
      lastActive: new Date(),
    });
  }
}
