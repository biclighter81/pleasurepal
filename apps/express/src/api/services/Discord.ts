import { Client, Collection, CommandInteraction, Events, REST, Routes, SlashCommandBuilder } from "discord.js";
import { injectable } from "inversify";
import { env } from "../../env";
import fs from 'fs';
import path from 'path';
import debug from "debug";
import AuthorizeCommand from "../commands/discord/authorize";

type CommandHandler = {
    command: SlashCommandBuilder,
    handler: (interaction: CommandInteraction) => Promise<void>
}

@injectable()
export class Discord {
    private client: Client;
    private commands: Collection<string, CommandHandler> = new Collection();
    private log = debug('discord')
    constructor() {
        this.bootstrap()
    }

    async bootstrap() {
        const client = new Client({
            intents: ['Guilds',
                'GuildMessages',
                'GuildMessageReactions',
                'GuildVoiceStates',
                'GuildMembers',
                'GuildPresences',
                'GuildMessageTyping',
                'DirectMessages',
                'DirectMessageReactions',
                'DirectMessageTyping',
                'GuildInvites',
                'GuildVoiceStates',
                'GuildMessageReactions',
                'GuildMessageTyping',],
        });
        await client.login(env.discord.token).then(() => {
            this.log('discord initialized')
        })
        this.client = client;
        await this.registerCommands();
        this.log('discord commands registered')
        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isCommand()) return;

            const { commandName } = interaction;

            if (!this.commands.has(commandName)) return;

            try {
                await this.commands.get(commandName).handler(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        })
    }

    async registerCommands() {
        const commandsPath = path.join(__dirname, '../commands/discord');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(env.isProduction ? '.js' : '.ts'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath) as { default: CommandHandler };
            // Set a new item in the Collection with the key as the command name and the value as the exported module
            if (command['default'] && command['default'].command && command['default'].handler) {
                const name = command['default'].command.name;
                this.log(`Registering command ${name}`)
                this.commands.set(name, command['default']);
            } else {
                this.log(`The command at ${filePath} is missing a required "command" or "handler" property.`)
            }
        }
        await this.client.rest.put(Routes.applicationCommands(env.discord.appId), {
            body: this.commands.map(({ command }) => command.toJSON())
        })
    }

    public getClient() {
        return this.client;
    }
}