import { CommandInteraction, SlashCommandBuilder } from "discord.js"
import { DeviceService } from "@/api/services/DeviceService";
import { SessionService } from "@/api/services/SessionService";
import { getKCUserByDiscordId } from "@/lib/keycloak";
import TYPES from "@/lib/symbols";
import { getContainer } from "@/main";

const container = getContainer();
const sessionSrv = container.get<SessionService>(TYPES.SessionService);
const deviceSrv = container.get<DeviceService>(TYPES.DeviceService);

const command = new SlashCommandBuilder()
    .setName('pleasure')
    .setDescription('Pleasure yourself or others with simple commands.')
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
    //check rights
    if (!session.user.find((u) => u.uid === user.id)?.hasControl) {
        await interaction.reply({
            content: ':lock: You do not have control over the current session!',
            ephemeral: true,
        });
        return;
    }
    //TODO: implement new device command logic
    for (const user of session.user) {
        //await deviceSrv.vibrate(user.uid, params.duration, params.intensity);
    }
    await interaction.reply({
        content: `You have sent the command \`\` to the session!`,
        ephemeral: true,
    });
}
export default {
    command,
    handler
}