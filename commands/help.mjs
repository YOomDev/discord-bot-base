import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows a list of all the bot commands and their descriptions.'),
    async execute(interaction) {
        const fields = [];
        for (const command in interaction.client.commands) { fields.push(interaction.client.utils.createField(command.data.name, command.data.description)); }
        await interaction.reply({ ephemeral: true, embeds: [interaction.client.utils.buildEmbed("Commands", "A list of all the possible commands for this bot:", fields)] });
    },
}