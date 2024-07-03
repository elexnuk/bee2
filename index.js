import fs from "fs";
import path from "path";
import { schedule as cronSchedule } from "node-cron";
import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import * as data from "./util/data.js";
import { state } from "./util/state.js";
import "dotenv/config";
import { handleVoted, votedCommand } from "./server/voted.js";

const __dirname = import.meta.dirname;
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
client.data = data;

export async function sendToNotificationChannels(message) {
	const channels = await state.get("notification_channels");
	
	if (!channels) {
		return;
	}

	for (const channel of channels) {
		try {
			const channelObj = await client.channels.fetch(channel.channel);
			await channelObj.send(message);
		} catch (error) {
			console.error(`Failed to send message to channel ${channel.channel}: ${error}`);
		}
	}
}

const foldersPath = path.join(__dirname, "commands");
const folders = fs.readdirSync(foldersPath);

for (const folder of folders) {
    const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const { data, execute, autocomplete } = await import("file://" + filePath);
		
        if (data && execute) {
			client.commands.set(data.name, { data, execute, autocomplete });
		} else {
			console.log(`[WARN] The command at ${filePath} is missing required "data" or "execute" property.`);
		}
	}
}

client.commands.set("voted", { execute: handleVoted, autocomplete: () => {}, data: votedCommand });

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const { name, once, execute } = await import("file://" + filePath);
	
	if (!name || !execute) {
		console.log(`[WARN] The event at ${filePath} is missing required "name" or "execute" property.`);
		continue;
	}

	if (once) {
		client.once(name, (...args) => execute(...args));
	} else {
		client.on(name, (...args) => execute(...args));
	}
}

const cronPath = path.join(__dirname, "cron");
const cronFiles = fs.readdirSync(cronPath).filter(file => file.endsWith(".js"));

for (const file of cronFiles) {
	const filePath = path.join(cronPath, file);
	const { name, schedule, task } = await import("file://" + filePath);
	
	if (!name || !schedule || !task) {
		console.log(`[WARN] The cron job at ${filePath} is missing required "name", "schedule", or "task" property.`);
		continue;
	}

	cronSchedule(schedule, async () => task(sendToNotificationChannels));
}

client.login(process.env.DISCORD_TOKEN);