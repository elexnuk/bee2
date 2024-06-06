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
    const constituency = await interaction.client.data.getConstituencyByName(interaction.options.getString("name"));
    if (!constituency) {
        await interaction.reply(`Constituency information for ${interaction.options.getString("name")} is not available.`);
        return;
    }

    await interaction.reply(`Constituency information for ${interaction.options.getString("name")} is as follows: \`\`\`${JSON.stringify(constituency, null, 2)}\`\`\``);
}