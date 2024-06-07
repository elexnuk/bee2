import { SlashCommandBuilder } from "discord.js";
import { getBallotInformation } from "../../util/democlub.js";
import { findConstituencyNames } from "../../util/fuzzy.js";

const party_emoji = {
    "PP52": "<:Party_Conservative:859875049829695498>", // Con
    "PP53": "<:Party_Labour:859875849590145025>", // Lab
    "joint-party:53-119": "<:Party_Labour:859875849590145025> <:Party_CoOperative:859873900661309440>", // Lab Co-op
    "PP90": "<:Party_LibDem:859874457338118144>", // LD
    "PP63": "<:Party_Green:859878487896227861>", // Grn
    "PP7931": "<:Party_REFUK:869881524152061993> ", // RefUK
    "PP102": "<:Party_SNP:869879723948388362>", // SNP
    "PP77": "<:Party_PlaidCymru:869878398820962385>", // PC
    "PP11382": "<:Party_WPB:1213080342458535977>", // WPGB
    "other": "⚪" // Other/Inds
}

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

function splitTextIntoChunks(text) {
    const chunks = [];
    let currentChunk = "";
    const lines = text.split("\n");

    for (const line of lines) {
        if (currentChunk.length + line.length + 1 <= 2000) {
            currentChunk += line + "\n";
        } else {
            chunks.push(currentChunk);
            currentChunk = line + "\n";
        }
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    return chunks;
}

export async function execute(interaction) {
    
    const name = interaction.options.getString("name");
    const ballot = await interaction.client.data.getBallotForConstituency(name);
    const constituency = await interaction.client.data.getConstituencyByName(name);

    try {
        const info = await getBallotInformation(ballot);
        if (!info || !constituency) {
            await interaction.reply(`Candidates information for ${name} is not available.`);
            return;
        }

        let output = `**${constituency.name}**`;
        if (constituency.region.name) {
            output += ` (${constituency.region.name})`;
        } else {
            output += ` (${constituency.country.name})`;
        }
        if (!info.cancelled) {
            output += `, ${(new Date(info.election.election_date)).toLocaleDateString("en-GB")} ${info.election.name}. `;
        } else {
            output += `. This election has been __***cancelled***__. `
        }
        output += `There are ${info.candidacies.length} candidates standing for election, `;
        output += `[Source](<https://whocanivotefor.co.uk/elections/${ballot}>).`;

        if (info.locked) {
            output += " Candidate Information is locked and confirmed by the [SOPN](<" + info.sopn.source_url + ">).";
        } else if (!info.locked && info.sopn) {
            output += " Candidate Information is not yet confirmed but the [SOPN](<" + info.sopn.source_url + ">) exists.";
        } else if (!info.locked && !info.sopn) {
            output += " Candidate Information is not yet confirmed.";
        }

        output += "\n### Candidates";
        for (const candidate of info.candidacies) {
            let emoji = party_emoji[candidate.party.ec_id];
            if (!emoji) {
                emoji = party_emoji["other"];
            }

            if (candidate.deselected) {
                output += `\n- ${emoji} ~~${candidate.party_name}~~ - [${candidate.person.name}](<https://whocanivotefor.co.uk/person/${candidate.person.id}/>) - ([Deselected](<${candidate.deselected_source}>))`;
            } else {
                output += `\n- ${emoji} ${candidate.party_name} - [${candidate.person.name}](<https://whocanivotefor.co.uk/person/${candidate.person.id}/>)`;
            }
        } 
        if (info.candidacies.length == 0) {
            output += "\n- No candidates found.";
        }

        await interaction.reply(output);
        return;
    } catch (error) {
        console.error(error);
        await interaction.reply(`Candidates information for ${name} is not available due to internal error.`);
        return;
    }
}