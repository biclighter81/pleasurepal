import { CommandInteraction, SlashCommandBuilder } from "discord.js"
import { DiscordSessionService } from "@/api/services/DiscordSessionService";
import { SessionService } from "@/api/services/SessionService";
import { getKCUserByDiscordId } from "@/lib/keycloak";
import TYPES from "@/lib/symbols";
import { getContainer } from "@/main";

const conatiner = getContainer()
const sessionSrv = conatiner.get<SessionService>(TYPES.SessionService);
const discordSessionSrv = conatiner.get<DiscordSessionService>(TYPES.DiscordSessionService);

const command = new SlashCommandBuilder()
    .setName('session-info')
    .setDescription('Retrieve session info.')
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
    const duser = await discordSessionSrv.getDiscordUsers(session.id);
    const initUser = duser.find((u) => u.kcId == session.initiatorId);

    await interaction.reply({
        content: `:id: **CURRENT SESSION:** \`#${session.id}\`
      \n:e_mail: **INVITE LINK:** ${process.env.API_URL + '/session/invite/' + session.inviteToken
            }
      \n**SESSION OWNER:** <@${initUser.user.id}>
      \n**MEMBERS:** <@${duser.map((m) => m.user.id).join('><@')}>
      \n**SESSION CREATED:** ${session.createdAt.toLocaleString()}`,
        ephemeral: true,
    });
}

export default {
    command,
    handler
}