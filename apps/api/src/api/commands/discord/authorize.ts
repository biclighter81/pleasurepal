import { CacheType, CommandInteraction, ComponentType, SlashCommandBuilder, User } from 'discord.js'
import { AUTHORIZE_SESSION_USER_BUTTON_COMPONENTS, AUTHORIZE_SESSION_USER_SELECT_COMPONENTS } from '../../../lib/interaction-helper';
import { getKCUserByDiscordId } from '../../../lib/keycloak';
import { getContainer } from '../../../main';
import { SessionService } from '../../../api/services/SessionService';
import TYPES from '../../../lib/symbols';
import { DiscordSessionService } from '../../../api/services/DiscordSessionService';
import { PleasureSession } from '../../../lib/entities/pleasure-session.entity';
import { DiscordService } from '../../../api/services/DiscordService';

const container = getContainer();
const sessionSrv = container.get<SessionService>(TYPES.SessionService);
const discordSessionSrv = container.get<DiscordSessionService>(TYPES.DiscordSessionService);
const discordSrv = container.get<DiscordService>(TYPES.DiscordService);

async function handleCancle(i: CommandInteraction<CacheType>) {
    await i.editReply({
        content: ':x: Authorization request canceled.',
        components: [],
    });
    return;
}

async function handleAuthorize(
    uids: string[],
    i: CommandInteraction<CacheType>,
    session: PleasureSession,
) {
    if (!uids.length) {
        i.followUp({
            content: 'You need to select at least one user!',
            ephemeral: true,
        });
    } else {
        const users = await Promise.all(
            uids.map((uid) => discordSrv.getUser(uid)),
        );
        users.forEach(async (u) => await handleNotification(u, session));
        uids.forEach(
            async (uid) => await sessionSrv.authorizeMember(session.id, uid),
        );
        await i.editReply({
            content: ':white_check_mark: Successfully authorized users!',
            components: [],
        });
    }
}

async function handleNotification(u: User, session: PleasureSession) {
    await u.send({
        content: `:unlock: You have been authorized to queue new commands in session \`${session.id}\`!`,
    });
}

const command = new SlashCommandBuilder()
    .setName('authorize')
    .setDescription('Authorize users in the current session to queue new commands.')
const handler = async (interaction: CommandInteraction) => {
    const user = await getKCUserByDiscordId(interaction.user.id);
    if (!user) {
        interaction.reply({
            content: ':x: No pleasurepal account',
        });
        return;
    }
    const session = await sessionSrv.getCurrentSession(user.id);
    if (!session) {
        interaction.reply({
            content: ':x: No active session',
        });
        return;
    }
    if (!session.user.find((u) => u.uid === user.id)?.hasControl) {
        interaction.reply({
            content: ':x: You do not have control over this session.',
        });
        return;
    }
    const duser = await discordSessionSrv.getDiscordUsers(session.id);
    const msg = await interaction.reply({
        content: 'Select a user to authorize.',
        ephemeral: true,
        components: [
            {
                type: ComponentType.ActionRow,
                components: AUTHORIZE_SESSION_USER_SELECT_COMPONENTS(duser),
            },
            AUTHORIZE_SESSION_USER_BUTTON_COMPONENTS,
        ],
    });
    const userCollector = msg.createMessageComponentCollector({
        time: 300000,
        componentType: ComponentType.StringSelect,
    });
    const btnCollector = msg.createMessageComponentCollector({
        time: 300000,
        componentType: ComponentType.Button,
    });
    let users: string[] = [];
    userCollector.on('collect', async (i) => {
        if (i.customId === 'users') {
            await i.deferUpdate();
            users = i.values;
        }
    });
    btnCollector.on('collect', async (i) => {
        if (i.customId === 'cancel') {
            return handleCancle(interaction);
        }
        if (i.customId === 'authorize') {
            return handleAuthorize(users, interaction, session);
        }
    });
    btnCollector.on('end', async (_, reason) => {
        if (reason == 'time')
            await interaction.editReply({
                content: ':x: Authorization request timed out!',
                components: [],
            });
    });
}
export default {
    command,
    handler
}