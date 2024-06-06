import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("candidates")
    .setDescription("Responds with candidates summary for the constituency.")
    .addStringOption(option => option.setName("name")
        .setDescription("The constituency to get information for.")
        .setRequired(true)
        .setAutocomplete(true)
    );

export async function autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const choices = await interaction.client.data.getConstituencyNames(); // TODO: Load in constituncey names & aliases
    
    if (!choices) {
        await interaction.respond([{name: "No constituencies found.", value: "error"}]);
        return;
    }

    // TODO: RegEx or fuzzy matching
    const filteredChoices = choices.filter(choice => choice.toLowerCase().includes(focusedValue.toLowerCase()));
    await interaction.respond(
        filteredChoices.map(choice => ({ name: choice, value: choice })).slice(0, 25)
    );
}

export async function execute(interaction) {
    interaction.reply("This command is not yet implemented.", { ephemeral: true });
}