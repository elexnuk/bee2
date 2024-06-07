import { SlashCommandBuilder } from "discord.js";
import { findConstituencyNames } from "../../util/fuzzy.js";

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatPercentage(top, bottom) {
    return `${((top / bottom) * 100).toFixed(2)}%`;
}

const party_emoji = {
    "Con": "<:Party_Conservative:859875049829695498>", // Con
    "Lab": "<:Party_Labour:859875849590145025>", // Lab
    "LD": "<:Party_LibDem:859874457338118144>", // LD
    "Green": "<:Party_Green:859878487896227861>", // Grn
    "BRX": "<:Party_REFUK:869881524152061993> ", // RefUK
    "SNP": "<:Party_SNP:869879723948388362>", // SNP
    "PC": "<:Party_PlaidCymru:869878398820962385>", // PC
    "Ind": "⚪" // Other/Inds
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
    const names = await interaction.client.data.getConstituencyNames();

    // const filteredChoices = choices.filter(choice => choice.toLowerCase().includes(focusedValue.toLowerCase()));
    const filteredChoices = await findConstituencyNames(focusedValue);
    if (focusedValue === "") {
        await interaction.respond(names.map(name => ({ name, value: name })).slice(0, 25));
    } else {
        await interaction.respond(
            filteredChoices.map(choice => ({ name: choice.item, value: choice.item })).slice(0, 25)
        );
    }
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
            let emoji = party_emoji[result.party_abbreviation] || party_emoji["Ind"];
            output += `\n${result.result_position}. ${emoji} ${result.party_abbreviation} - ${formatNumber(result.vote_count)} (${(100 * result.vote_share).toFixed(2)}%)`;
        }
    }

    await interaction.reply(output);
}

// TODO:
// - Fuzzy Search
// - Nominations update feed
// - Live feed election results channel
// - Support council by-elections/other elections in commands