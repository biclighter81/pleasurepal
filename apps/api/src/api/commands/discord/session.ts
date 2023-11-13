import { ButtonInteraction, CacheType, CommandInteraction, ComponentType, SlashCommandBuilder } from "discord.js"
import { DiscordSessionService } from "@/api/services/DiscordSessionService";
import { SessionService } from "@/api/services/SessionService";
import { PleasureSession } from "@/lib/entities/pleasure-session.entity";
import { SESSION_CREATION_COMPONENTS } from "@/lib/interaction-helper";
import { KeycloakUser } from "@/lib/interfaces/keycloak";
import { getKCUserByDiscordId } from "@/lib/keycloak";
import TYPES from "@/lib/symbols";
import { getContainer } from "@/main";

const container = getContainer();
const sessionSrv = container.get<SessionService>(TYPES.SessionService);
const discordSessionSrv = container.get<DiscordSessionService>(TYPES.DiscordSessionService);

const command = new SlashCommandBuilder()
    .setName('session')
    .setDescription('Start a pleasurepal session.')
const handler = async (interaction: CommandInteraction) => {
    const user = await getKCUserByDiscordId(interaction.user.id);
    if (!user) {
        interaction.reply({
            content: ':x: No pleasurepal account',
        });
        return;
    }
    const session = await sessionSrv.getCurrentSession(user.id);
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
            await handleStartSession(interaction, i, uids, channel, user.id);
        }
        if (i.customId === 'cancelSession') {
            await handleCancelSession(interaction);
        }
    });
    buttonSelector.on('end', async (_, reason) => {
        if (reason == 'time')
            interaction.editReply({
                content: ':x: Session creation timed out!',
            });
    });
}

async function handleStartSession(
    i: CommandInteraction<CacheType>,
    cmdI: ButtonInteraction<CacheType>,
    uids: string[],
    cid: string,
    initUid: string,
) {
    const noPleasurepalUids: string[] = [];
    let pleasurepalUsers: (KeycloakUser & { duid: string })[] = [];
    await Promise.all(
        uids.map(async (uid) => {
            const user = await getKCUserByDiscordId(uid);
            if (user) {
                pleasurepalUsers.push({ ...user, duid: uid });
            } else {
                noPleasurepalUids.push(uid);
            }
        }),
    );
    const users = {
        discord: uids,
        pleasurepal: pleasurepalUsers,
    };
    if (!users.discord.length && !cid) {
        cmdI.reply({
            content: 'You need to select at least one user or a channel!',
            ephemeral: true,
        });
    } else {
        const session = await sessionSrv.create(
            initUid,
            users.pleasurepal.map((u) => u.id),
        );
        //no pleasurepal account invites
        await Promise.all(
            noPleasurepalUids.map((uid) =>
                handleInviteNoPleasurepal(uid, session),
            ),
        );
        //pleasurepal account invites
        await Promise.all(
            users.pleasurepal.map((u) => handleInvite(u.id, initUid, session)),
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

async function handleCancelSession(i: CommandInteraction<CacheType>) {
    i.editReply({
        content: ':x: Session creation cancelled!',
        components: [],
    });
    return;
}

async function handleInviteNoPleasurepal(duid: string, session: PleasureSession) {
    console.log(`Invite no pleasurepal user ${duid} to session ${session.id}`);
    //TODO: implement logic to send signup / discord link request
    await discordSessionSrv.handleDeferredInvite(session.id, duid);
}

async function handleInvite(uid: string, inituid: string, session: PleasureSession) {
    console.log(`Invite pleasurepal user ${uid} to session ${session.id}`);
    await discordSessionSrv.sendInvite(session.id, uid, inituid);
    await sessionSrv.sendInvite(session.id, uid, inituid);
}

export default {
    command,
    handler
}