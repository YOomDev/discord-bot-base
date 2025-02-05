import { SlashCommandBuilder, MessageFlags } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows a list of all the bot commands and their descriptions.'),
    async execute(interaction) {
        const fields = [];
        interaction.client.commands.forEach(command => { fields.push(interaction.client.utils.createField(command.data.name, command.data.description, true)); });
        await interaction.reply({ flags: MessageFlags.Ephemeral, embeds: [interaction.client.utils.buildEmbed("Commands", "A list of all the possible commands for this bot:", fields)] });
    },
}