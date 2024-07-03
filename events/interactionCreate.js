import { Events } from "discord.js";
import { showModal, handleModalResponse } from "../server/sandra.js";
import { handleVoted } from "../server/voted.js";

export const name = Events.InteractionCreate;

export async function execute(interaction) {
    if (interaction.isAutocomplete()) {
		// autocomplete interaction
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.autocomplete(interaction);
        } catch (error) {
            console.error(error);
        }
    }

	if (
		(interaction.isContextMenuCommand() && interaction.commandName == "Speak to Sandra") ||
		(interaction.isChatInputCommand() && interaction.commandName == "sandra")
	) {
		try {
			await showModal(interaction);
		} catch (err) {
			console.error(err);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: "Sandra message not submitted. Reason: There was an error while executing this command.", ephemeral: true });
			} else {
				await interaction.reply({ content: "Sandra message not submitted. Reason: There was an error while executing this command.", ephemeral: true });
			}
		}
		return;
	}

	if (interaction.isModalSubmit() && interaction.customId == "sandra") {
		try {
			await handleModalResponse(interaction);
		} catch (err) {
			console.error(err);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: "There was an error while executing this command.", ephemeral: true });
			} else {
				await interaction.reply({ content: "There was an error while executing this command.", ephemeral: true });
			}
		}
		return;
	}

    if (!interaction.isChatInputCommand()) return;
	// chat input command

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command.', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true });
		}
	}
}