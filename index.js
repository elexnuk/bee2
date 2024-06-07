import fs from "fs";
import path from "path";
import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import * as data from "./util/data.js";
import "dotenv/config";

const __dirname = import.meta.dirname;
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
client.data = data;

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

client.login(process.env.DISCORD_TOKEN);