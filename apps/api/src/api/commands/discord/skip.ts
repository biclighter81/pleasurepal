import { CommandInteraction, SlashCommandBuilder } from "discord.js"
import { SessionService } from "@/api/services/SessionService";
import { getKCUserByDiscordId } from "@/lib/keycloak";
import TYPES from "@/lib/symbols";
import { getContainer } from "@/main";

const container = getContainer();
const sessionSrv = container.get<SessionService>(TYPES.SessionService);
//const lovenseControlSrv = container.get<LovenseControlService>(TYPES.LovenseControlService);

const command = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip an action in the current pleasurepal session')
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
    //TODO: implement new device logic
    /*await lovenseControlSrv.sendLovenseFunction({
      kcId: user.id,
      action: 'Vibrate',
      intensity: 1,
      loopPauseSec: 0,
      loopRunningSec: 0,
      timeSec: 1,
      stopPrevious: true,
    });*/
    await interaction.reply({
        content: `You have skipped the current action! Following actions in the session will be executed as normal.\nTo fully leave the session, use the \`/leave\` command.`,
        ephemeral: true,
    });
}

export default {
    command,
    handler
}