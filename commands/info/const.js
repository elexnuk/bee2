import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("constituency")
    .setDescription("Replies with constituency information requested.")
    .addStringOption(option => option.setName("name")
        .setDescription("The constituency to get information for.")
        .setRequired(true)
        .setAutocomplete(true)
    );

export async function autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const choices = []; // TODO: Load in constituncey names & aliases
    // TODO: RegEx or fuzzy matching
    const filteredChoices = choices.filter(choice => choice.toLowerCase().includes(focusedValue.toLowerCase()));
    
    await interaction.respond(
        filteredChoices.map(choice => ({ name: choice, value: choice }))
    );
}


export async function execute(interaction) {
    await interaction.reply(`Constituency information for ${interaction.options.getString("name")} is not available.`);
}