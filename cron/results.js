import { getResultsDelta, getBallotInformation } from "../util/democlub.js";
import { state } from "../util/state.js";

export const name = "results";
export const schedule = "0 0 31 2 *"; 

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
};

function formatNumber(number) {
    if (number === null) { return null; }

    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatPercentage(top, bottom) {
    return `${((top / bottom) * 100).toFixed(2)}%`;
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

export async function task(sendToNotificationChannels) {
    let update_date = new Date();
    console.log(update_date.toLocaleTimeString() + " Running cron job: results");

    const last_updated = await state.get("results_last_updated");
    const delta = await getResultsDelta(last_updated, 200);

    if (delta.length === 0) {
        console.log(update_date.toLocaleTimeString() + " No results found in delta");
        return;
    }

    console.log(`Found ${delta.length} updated results. Setting last_updated to ${update_date.toISOString()}`);
    await state.set("results_last_updated", update_date.toISOString());

    for (let result of delta) {
        try {
            const ballot_info = await getBallotInformation(result.ballot.ballot_paper_id);
    
            let output = `## ${ballot_info.post.label}: Results, ${ballot_info.election.name}, DemocracyClub Data`;
            output += `\n${ballot_info.election.election_date}`;
            if (result.num_turnout_reported !== null) {
                output += ` - Turnout: ${formatNumber(result.num_turnout_reported)}`;
            } else {
                output += " - Turnout *Raw Figure Not Reported*";
            }

            if (result.turnout_percentage !== null) {
                output += ` (${result.turnout_percentage}%)`;
            }

            if (result.total_electorate !== null) {
                output += ` - Electorate: ${formatNumber(result.total_electorate )}`;
            }

            if (result.num_spoilt_ballots !== null) {
                output += ` - Spoilt Ballots: ${formatNumber(result.num_spoilt_ballots)}`;
            }

            let candidate_results = result.candidate_results.sort((a, b) => b.num_ballots - a.num_ballots); 
            let total_ballots = candidate_results.reduce((acc, r) => acc + r.num_ballots, 0);
            
            for (const cand_result of candidate_results) {
                let candidacy = ballot_info.candidacies.find(c => c.person.id === cand_result.person.id);
                let emoji = party_emoji[cand_result.party.ec_id];
                let abbr = party_abbr[cand_result.party.ec_id];
                if (!emoji) {
                    emoji = party_emoji["other"];
                }
    
                if (!abbr) {
                    abbr = cand_result.party.name;
                }
    
                output += `\n1. ${emoji} ${abbr} - ${formatNumber(cand_result.num_ballots)} (${formatPercentage(cand_result.num_ballots, total_ballots)})`;
                if (candidacy && candidacy.deselected !== false) {
                    output += " - *Deselected*";
                }
                if (cand_result.elected) {
                    output += " - **Elected**";
                }
            }
    
            await sendToNotificationChannels(output);
        } catch (error) {
            console.log(`Error processing result ${result.id}: ${error.message}`);
        }
    }

    console.log((new Date()).toLocaleTimeString() + " Finished results delta from " + update_date.toLocaleTimeString())
}