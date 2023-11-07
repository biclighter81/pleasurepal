import { CommandInteraction, SlashCommandBuilder } from 'discord.js'

const command = new SlashCommandBuilder()
    .setName('authorize')
    .setDescription('Authorize users in the current session to queue new commands.')

const handler = async (interaction: CommandInteraction) => {
    await interaction.reply(`Hello, ${interaction.user}!`);
}
export default {
    command,
    handler
}