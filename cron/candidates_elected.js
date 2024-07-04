import { getBallotInformation, getCandidatesElectedDelta } from "../util/democlub.js";
import { state } from "../util/state.js";

export const name = "candidates_elected";
export const schedule = "*/1 * * * *"; // every 5 minutes

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
    console.log(update_date.toLocaleTimeString() + " Running cron job: candidates_elected");

    const last_updated = await state.get("candidates_elected_last_updated");
    const delta = await getCandidatesElectedDelta(last_updated, 200);

    if (delta.length === 0) {
        console.log(update_date.toLocaleTimeString() + " No candidates elected found in delta");
        return;
    }

    console.log(`Found ${delta.length} newly elected candidates. Setting last_updated to ${update_date.toISOString()}`);
    await state.set("candidates_elected_last_updated", update_date.toISOString());

    let elected_candidates = [];
    let published_results = await state.get("published_results") || [];

    for (let elected_member of delta) {
        let election_info = {
            person_name: elected_member.person.name,
            person_id: elected_member.person.id,
            party_name: elected_member.party_name,
            party_id: elected_member.party.ec_id,
            deselected: { deselected: false }, // Optional if we have the deselection information as well
            election_info: {}, // Optional if we have the election information as well
            // results_info: {} // Optional if the result has been recorded as well
        }

        if (published_results.includes(elected_member.person.id)) {
            console.log("Skipping already published candidate", elected_member.person.name, elected_member.party_name);
            continue;
        } else {
            published_results.push(elected_member.person.id);
        }

        console.log("Newly elected candidate", elected_member.person.name, elected_member.party_name);

        if (elected_member.deselected) {
            election_info.deselected = {
                deselected: elected_member.deselected,
                deselected_source: elected_member.deselected_source
            };
        }

        try {
            let ballot_info = await getBallotInformation(elected_member.ballot.ballot_paper_id); 
            election_info.election_info = {
                name: ballot_info.election.name,
                post: ballot_info.post.label,
                code: ballot_info.post.id,
                date: ballot_info.election.election_date
            };
        } catch (err) {
            console.error(`Error fetching ballot information for ${elected_member.ballot.ballot_paper_id}: ${err.message}`);
        }

        elected_candidates.push(election_info);
    }

    let output = "";
    for (let candidate of elected_candidates) {

        let emoji = party_emoji[candidate.party_id];
        if (!emoji) {
            emoji = party_emoji["other"];
        }

        if (candidate.election_info) {
            let post = "";
            if (candidate.election_info.name === "UK Parliamentary general election") {
                post = "MP";
            } else {
                post = "Councillor";
            }
            output += `## ${emoji} ${candidate.election_info.post}: ${candidate.party_name} Elected, DemocracyClub Data\n`;
            output += `- Candidate: [${candidate.person_name}](<https://whocanivotefor.co.uk/person/${candidate.person_id}>) is the new ${post}.\n`;
            if (candidate.deselected.deselected) {
                output += `- Deselected: [source](<${candidate.deselected.deselected_source}>).\n`;
            }
            output += `- Election ${candidate.election_info.post}: ${candidate.election_info.name}, ${candidate.election_info.date}\n`;
        } else {
            output += `## ${emoji} ${candidate.party_name} Elected, DemocracyClub Data\n`;
            output += `- Candidate: [${candidate.person_name}](<https://whocanivotefor.co.uk/person/${candidate.person_id}>).\n`;
            if (candidate.deselected.deselected) {
                output += `- Deselected: [source](<${candidate.deselected.deselected_source}>).\n`;
            }
        }
    }

    const chunks = splitTextIntoChunks(output);
    for (const chunk of chunks) {
        try {
            await sendToNotificationChannels({ content: chunk });
        } catch (e) {
            console.error(e);
            break;
        }
    }

    await state.set("published_results", published_results);
    console.log((new Date()).toLocaleTimeString() + " Finished candidates elected delta from " + update_date.toLocaleTimeString());
}