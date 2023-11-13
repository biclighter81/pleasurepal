import { CommandInteraction, ComponentType, SlashCommandBuilder } from "discord.js"
import { DiscordService } from "@/api/services/DiscordService";
import { LovenseService } from "@/api/services/LovenseService";
import { ALREADY_LINKED_COMPONENTS, interactionTimeout } from "@/lib/interaction-helper";
import { getKCUserByDiscordId } from "@/lib/keycloak";
import { LOVENSE_ACCOUNT_ALREADY_LINKED, LOVENSE_ACCOUNT_UNLINKED, NEED_TO_REGISTER_PLEASUREPAL } from "@/lib/reply-messages";
import TYPES from "@/lib/symbols";
import { getContainer } from "@/main";

const container = getContainer();
const lovenseSrv = container.get<LovenseService>(TYPES.LovenseService);
const discordSrv = container.get<DiscordService>(TYPES.DiscordService);


const command = new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your Lovense account to your Discord and pleasurepal account.')
const handler = async (interaction: CommandInteraction) => {
    const kcUser = await getKCUserByDiscordId(interaction.user.id);
    if (!kcUser) {
        await interaction.reply(NEED_TO_REGISTER_PLEASUREPAL);
        return;
    }

    const user = await lovenseSrv.getLastHeartbeat(kcUser.id);
    if (user) {
        const msg = await interaction.reply({
            content: LOVENSE_ACCOUNT_ALREADY_LINKED,
            ephemeral: true,
            components: ALREADY_LINKED_COMPONENTS,
        });

        const actionCollector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) => i.customId === 'link' || i.customId === 'unlink',
            time: 60000,
        });

        const cancelCollector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) => i.customId === 'cancel',
            time: 60000,
        });

        // Collect Button interactions
        actionCollector.on('collect', async (i) => {
            i.deferUpdate();
            if (i.customId === 'link') {
                const qr = await lovenseSrv.getLinkQrCode(
                    kcUser.id,
                    kcUser.username,
                );
                await discordSrv.pollLinkStatus(
                    interaction,
                    qr,
                    kcUser.id,
                    true,
                );
                return actionCollector.stop();
            } else if (i.customId === 'unlink') {
                await lovenseSrv.unlinkLovense(kcUser.id);
                await interaction.editReply({
                    content: LOVENSE_ACCOUNT_UNLINKED,
                    components: [],
                    embeds: [],
                });
                actionCollector.stop();
            }
        });

        cancelCollector.on('collect', async (i) => {
            await interaction.editReply({
                content: 'Relinking cancelled',
                components: [],
                embeds: [],
            });
            cancelCollector.stop();
        });

        // Handle timeout after 60 seconds
        cancelCollector.on('end', (_, reason) => {
            if (reason == 'time')
                interactionTimeout(interaction, reason, ':x: Relinking cancelled!');
        });
        return;
    } else {
        const qr = await lovenseSrv.getLinkQrCode(
            kcUser.id,
            kcUser.username,
        );
        discordSrv.pollLinkStatus(interaction, qr, kcUser.id);
        return;
    }
}

export default {
    command,
    handler
}