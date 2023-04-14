import { Command, Handler, InteractionEvent } from '@discord-nestjs/core';
import {
  ButtonInteraction,
  CacheType,
  CommandInteraction,
  ComponentType,
} from 'discord.js';
import { Injectable } from '@nestjs/common';
import { getKCUserByDiscordId } from 'src/lib/keycloak';
import { SESSION_CREATION_COMPONENTS } from 'src/lib/interaction-helper';
import { SessionService } from 'src/session/session.service';
import { PleasureSession } from 'src/session/entities/pleasure-session.entity';

@Command({
  name: 'session',
  description: 'Start a pleasurepal session.',
})
@Injectable()
export class SessionCommand {
  constructor(private readonly sessionSrv: SessionService) {}

  @Handler()
  async onSession(
    @InteractionEvent() interaction: CommandInteraction,
  ): Promise<void> {
    const user = await getKCUserByDiscordId(interaction.user.id);
    if (!user) {
      interaction.reply({
        content: ':x: No pleasurepal account',
      });
      return;
    }
    const session = await this.sessionSrv.getCurrentSession(user.id);
    if (session) {
      interaction.reply({
        content:
          ':x: You are already in a session! To leave the session, use the `/leave` command.',
      });
      return;
    }

    const msg = await interaction.reply({
      content: 'Configure your pleasurepal session',
      ephemeral: true,
      components: SESSION_CREATION_COMPONENTS,
    });

    let uids: string[] = [];
    const userSelector = msg.createMessageComponentCollector({
      componentType: ComponentType.UserSelect,
      time: 300000,
    });
    userSelector.on('collect', async (i) => {
      uids = i.values;
      //TODO: implement logic to check if user has pleasurepal account and linked discord account
      await i.deferUpdate();
    });

    let channel: string;
    const channelSelector = msg.createMessageComponentCollector({
      componentType: ComponentType.ChannelSelect,
      time: 300000,
    });
    channelSelector.on('collect', async (i) => {
      channel = i.values[0];
      await i.deferUpdate();
    });

    const buttonSelector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000,
    });
    buttonSelector.on('collect', async (i) => {
      if (i.customId === 'startSession') {
        await this.handleStartSession(interaction, i, uids, channel, user.id);
      }
      if (i.customId === 'cancelSession') {
        await this.handleCancelSession(interaction);
      }
    });
    buttonSelector.on('end', async () => {
      interaction.editReply({
        content: ':x: Session creation timed out!',
      });
    });
  }

  async handleStartSession(
    i: CommandInteraction<CacheType>,
    cmdI: ButtonInteraction<CacheType>,
    uids: string[],
    cid: string,
    initUid: string,
  ) {
    const noPleasurepalUids: string[] = [];
    let pleasurepalUsers = await Promise.all(
      uids.map(async (u) => {
        const user = await getKCUserByDiscordId(u);
        if (!user) {
          noPleasurepalUids.push(u);
        }
        return user;
      }),
    );
    pleasurepalUsers = pleasurepalUsers.filter((u) => u);
    const users = {
      discord: uids,
      pleasurepal: pleasurepalUsers.map((u) => u.id),
    };
    if (!users.discord.length && !cid) {
      cmdI.reply({
        content: 'You need to select at least one user or a channel!',
        ephemeral: true,
      });
    } else {
      const session = await this.sessionSrv.create(initUid, users.pleasurepal);
      //no pleasurepal account invites
      await Promise.all(
        noPleasurepalUids.map((uid) =>
          this.handleInviteNoPleasurepal(uid, session),
        ),
      );
      //pleasurepal account invites
      await Promise.all(
        users.pleasurepal.map((uid) => this.handleInvite(uid, session)),
      );
      if (cid) {
        //TODO: implement channel invite handling
      }
      if (users.discord.length) {
        await i.editReply({
          content: `:white_check_mark: Session \`${session.id}\` has been created!`,
          components: [],
        });
      }
    }
  }

  async handleCancelSession(i: CommandInteraction<CacheType>) {
    i.editReply({
      content: ':x: Session creation cancelled!',
      components: [],
    });
    return;
  }

  async handleInviteNoPleasurepal(duid: string, session: PleasureSession) {
    console.log(`Invite no pleasurepal user ${duid} to session ${session.id}`);
  }

  async handleInvite(uid: string, session: PleasureSession) {
    console.log(`Invite pleasurepal user ${uid} to session ${session.id}`);
  }
}
