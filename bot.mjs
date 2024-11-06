import fs from 'fs';
const loadJSON = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));

import { logError, logWarning, logInfo, sleep, contains } from "./utils.mjs";

// Bot file
const commandProperties = ["data", "execute"];
const config = loadJSON('./config.json');

export async function start(cmdProperties = []) {
    for (const properties of cmdProperties) { if (!contains(commandProperties, properties)) { commandProperties.push(properties); } }
    client.login(config.token).catch(err => logError(err));
    reload();
}

function reload() { registerCommands(); }

//////////////
// Resolver //
//////////////

let lastRequestId = -1;
const requests = [];

function createRequest() {
    lastRequestId += 1;
    const id = lastRequestId;
    requests.push({ id: id, resolved: false, data: 0 });
    return id;
}

async function getSolvedRequest(id){
    for (let i = 0; i < requests.length; i++) {
        if (requests[i].id !== id) { continue; }
        while (true) {
            await sleep(0.5);
            if (requests[i].resolved) {
                const returnData = requests[i].data;
                requests.splice(i, 1);
                return returnData;
            }
        }
    }
    return 0;
}

function resolveRequest(id, data) {
    for (let i = 0; i < requests.length; i++) {
        if (requests[i].id === id) {
            requests[i].data = data;
            requests[i].resolved = true;
            return;
        }
    }
}

/////////////////
// Discord bot //
/////////////////

// const fs = require('node:fs');
import path from 'node:path';
import { REST, Routes, Client, Collection, Events, GatewayIntentBits, EmbedBuilder, ActivityType } from 'discord.js';

// client
const rest = new REST().setToken(config.token);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

client.once(Events.ClientReady, readyClient => { logInfo(`Discord bot is ready! Logged in as ${readyClient.user.tag}`); });

client.on(Events.MessageCreate, async message => {
    if (message.author.id === client.user.id) { return; }

    // TODO: handle messages
});

// Command handler
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        logWarning(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try { await command.execute(interaction); }
    catch (error) {
        logError(error);
        if (interaction.replied || interaction.deferred) { await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true }); }
        else { await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true }); }
    }
});

// Make logging functions available for all the commands in other folders
client.utils = {};
client.utils.color = "#FFFFFF";
client.utils.color_error = "#FF3333";
client.utils.createField = (name = "no title specified", message = "No message specified", inline = false) => { return { name: name, message: message, inline: inline}; };
client.utils.buildEmbed = (title, message, fields = [], color = client.utils.color) => {
    if (!title || !message) { logError("Tried sending a discord message without specifying the required arguments!"); return; }
    const embed = new EmbedBuilder().setTitle(title).setColor(color).setDescription(message);

    // Fields
    for (const field in fields) { embed.addFields({ name: fields[i].name, value: fields[i][1], inline: fields[i][2] }) }

    return embed;
};
client.utils.resolver = {
    createRequest: createRequest,
    resolveRequest: resolveRequest,
    getSolvedRequest: getSolvedRequest
};

async function registerCommands() {
    logInfo("Started loading commands.");
    client.commands.clear();
    const commands = [];
    const folders = ["./commands", "./discord-bot-base/commands"];
    // for (const folder of config.commandFolders) { folders.push(folder); }
    for (const folder of folders) {
        const commandFiles = fs.readdirSync(folder).filter(file => file.endsWith('.mjs'));
        for (const file of commandFiles) {
            const filePath = "..\\" + path.join(folder, file);
            let command = (await import(new URL(filePath, import.meta.url)).catch(err => logError(err)).then(_ => { return _; })).default;

            // Check if command has all the needed properties
            let failed = false;
            for (let i = 0; i < commandProperties.length; i++) {
                if (!(commandProperties[i] in command)) {
                    logWarning(`${filePath} is missing "${commandProperties[i]}" property.`);
                    failed = true;
                }
            }
            if (failed) { continue; } // Skip

            // Set a new item in the Collection with the key as the command name and the value as the exported module
            logInfo(`Loaded command '${command.data.name}'`);
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
        }
    }
    uploadDiscordCommands(commands).catch(err => logError(err));
}

async function uploadDiscordCommands(commands) {
    try {
        logInfo(`Started refreshing ${client.commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands },
        );

        logInfo(`Successfully reloaded ${data.length} application (/) commands.`);
    }
    catch (error) { logError(error); }
}