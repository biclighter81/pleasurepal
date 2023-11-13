import { CacheType, CommandInteraction, SlashCommandBuilder } from "discord.js"
import { LEAVE_INTERACTION_CONFIRM_COMPONENTS } from "@/lib/interaction-helper";
import { getKCUserByDiscordId } from "@/lib/keycloak";
import { getContainer } from "@/main";
import { SessionService } from "@/api/services/SessionService";
import TYPES from "@/lib/symbols";
import { PleasureSession } from "@/lib/entities/pleasure-session.entity";

const container = getContainer();
const sessionSrv = container.get<SessionService>(TYPES.SessionService);

async function handleLeave(
    uid: string,
    i: CommandInteraction<CacheType>,
    session: PleasureSession,
) {
    await sessionSrv.leave(session.id, uid);
    await i.editReply({
        content: `:white_check_mark: You have left the current session \`#${session.id}\`!`,
        components: [],
    });
}

async function handleCancel(
    i: CommandInteraction<CacheType>,
    session: PleasureSession,
) {
    await i.editReply({
        content: `You have decided to stay in the current session \`#${session.id}\`!`,
        components: [],
    });
}

const command = new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave the current pleasurepal session')
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
    const msg = await interaction.reply({
        content: `You are about to leave the current session \`#${session.id}\`. Are you sure?`,
        components: LEAVE_INTERACTION_CONFIRM_COMPONENTS,
        ephemeral: true,
    });
    const collector = msg.createMessageComponentCollector({
        time: 60000,
    });

    // Collect button interactions
    collector.on('collect', async (i) => {
        if (i.customId === 'leave') {
            await handleLeave(user.id, interaction, session);
        }
        if (i.customId === 'cancel') {
            await handleCancel(interaction, session);
        }
    });
    collector.on('end', async (_, reason) => {
        if (reason == 'time')
            await interaction.editReply({
                content: `You have not responded in time. You are still in the current session \`${session.id}\`!`,
                components: [],
            });
    });
}

export default {
    command,
    handler
}