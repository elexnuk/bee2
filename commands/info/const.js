import { SlashCommandBuilder } from "discord.js";

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatPercentage(top, bottom) {
    return `${((top / bottom) * 100).toFixed(2)}%`;
}

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

    let output = `**${constituency.name}** is a ${constituency.type} Constituency in`;
    if (constituency.region.name) {
        output += ` ${constituency.country.name} (${constituency.region.name}). `;
    } else {
        output += ` ${constituency.country.name}. `;
    }
    output += `The turnout was ${formatNumber(constituency.valid_vote_count)} (${formatPercentage(constituency.valid_vote_count, constituency.population_count)}) from a population of ${formatNumber(constituency.population_count)}. The majority was ${formatNumber(constituency.majority)} (${formatPercentage(constituency.majority, constituency.valid_vote_count)}).`;

    if (constituency.notional_results.length > 0) {
        output += "\n### Party Results (2019 Notionals)";
        for (const result of constituency.notional_results) {
            output += `\n${result.result_position}. ${result.party_abbreviation} - ${formatNumber(result.vote_count)} (${(100 * result.vote_share).toFixed(2)}%)`;
        }
    }

    await interaction.reply(output);
}