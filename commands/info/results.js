import { SlashCommandBuilder } from "discord.js";
import { getBallotResults, getBallotInformation } from "../../util/democlub.js";

function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatPercentage(top, bottom) {
    return `${((top / bottom) * 100).toFixed(2)}%`;
}

const party_emoji = {
    "PP52": "<:Party_Conservative:859875049829695498>", // Con
    "PP53": "<:Party_Labour:859875849590145025>", // Lab
    "joint-party:53-119": "<:Party_Labour:859875849590145025> <:Party_CoOperative:859873900661309440>", // Lab Co-op
    "PP90": "<:Party_LibDem:859874457338118144>", // LD
    "PP63": "<:Party_Green:859878487896227861>", // Grn
    "PP7931": "<:Party_REFUK:869881524152061993>", // RefUK
    "PP102": "<:Party_SNP:869879723948388362>", // SNP
    "PP77": "<:Party_PlaidCymru:869878398820962385>", // PC
    "PP11382": "<:Party_WPB:1213080342458535977>", // WPGB
    "other": "⚪" // Other/Inds
};

const party_abbr = {
    "PP52": "Con", // Con
    "PP53": "Lab", // Lab
    "joint-party:53-119": "Lab", // Lab Co-op
    "PP90": "LD", // LD
    "PP63": "Green", // Grn
    "PP7931": "Ref", // RefUK
    "PP102": "SNP", // SNP
    "PP77": "PC", // PC
    "PP11382": "WPB", // WPGB
    "ynmp-party:2": "Ind" // Other/Inds
}

export const data = new SlashCommandBuilder()
    .setName("results")
    .setDescription("Responds with results summary for the constituency.")
    // .addStringOption(option => option.setName("name")
    //     .setDescription("The constituency to get information for.")
    //     .setRequired(true)
    //     .setAutocomplete(true)
    // )
    .addSubcommand(subcommand => subcommand.setName("constituency")
        .setDescription("Get results information for the constituency.")
        .addStringOption(option => option.setName("name")
            .setDescription("The constituency to get information for.")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand => subcommand.setName("ballot")
        .setDescription("Get results information for DC Ballot ID.")
        .addStringOption(option => option.setName("id")
            .setDescription("The Democracy Club Ballot ID.")
            .setRequired(true)
        )
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
    
    const name = interaction.options.getString("name");
    const ballot_id = interaction.options.getString("id");

    let ballot, constituency;
    if (name) {
        ballot = await interaction.client.data.getBallotForConstituency(name);
        constituency = await interaction.client.data.getConstituencyByName(name);    
    } else {
        ballot = ballot_id;
    }

    try {
        const ballot_info = await getBallotInformation(ballot);
        const info = await getBallotResults(ballot);
        if (!info) {
            await interaction.reply(`Results information for ${name ? name : ballot} is not currently available.`);
            return;
        }

        let output = "";
        if (constituency && ballot_info) {
            output += `**${constituency.name}**`;
            if (constituency.region.name) {
                output += ` (${constituency.region.name})`;
            } else {
                output += ` (${constituency.country.name})`;
            }
            if (!ballot_info.cancelled) {
                output += `, ${(new Date(ballot_info.election.election_date)).toLocaleDateString("en-GB")} ${ballot_info.election.name}. `;
            } else {
                output += `. This election has been __***cancelled***__. `
            }
            output += `There were ${ballot_info.candidacies.length} candidates standing for election, `;
            output += `[source](<https://whocanivotefor.co.uk/elections/${ballot}>).`;
        } else if (ballot_info) {
            output += ` ${ballot_info.post.label} (${ballot_info.election.name})`;
            if (!ballot_info.cancelled) {
                output += `, ${(new Date(ballot_info.election.election_date)).toLocaleDateString("en-GB")}. `;
            } else {
                output += `. This election has been __***cancelled***__. `
            }
            output += `There were ${ballot_info.candidacies.length} candidates standing for election, `;
            output += `[Source](<https://whocanivotefor.co.uk/elections/${ballot}>).`;
        }

        output += "\n### Results";
        let results = info.candidate_results.sort((a, b) => b.num_ballots - a.num_ballots); 
        let total_ballots = results.reduce((acc, r) => acc + r.num_ballots, 0);

        for (const result of results) {
            let emoji = party_emoji[result.party.ec_id];
            let abbr = party_abbr[result.party.ec_id];
            if (!emoji) {
                emoji = party_emoji["other"];
            }

            if (!abbr) {
                abbr = result.party.name;
            }

            output += `\n1. ${emoji} ${abbr} - ${formatNumber(result.num_ballots)} (${formatPercentage(result.num_ballots, total_ballots)})`;
            if (result.elected) {
                output += " - **Elected**";
            }
        }

        await interaction.reply(output);
    } catch (error) {
        console.error(error);
        await interaction.reply(`Results information for ${name ? name : ballot} is not available.`);
    }
}