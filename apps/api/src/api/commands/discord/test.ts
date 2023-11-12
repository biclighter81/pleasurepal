import { CommandInteraction, SlashCommandBuilder } from 'discord.js'

const command = new SlashCommandBuilder()
    .setName('test')
    .setDescription('Apa.')

const handler = async (interaction: CommandInteraction) => {
    await interaction.reply(`Hello, ${interaction.user}!`);
}
export default {
    command,
    handler
}