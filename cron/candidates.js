import { getBallotsDelta } from "../util/democlub.js";
import { state } from "../util/state.js";

export const name = "candidates";
export const schedule = "*/2 * * * *"; // every 2 minutes

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
    console.log((new Date()).toLocaleTimeString() + " Running cron job: candidates");

    const last_updated = await state.get("candidates_last_updated");
    const delta = await getBallotsDelta(last_updated, 200);
    let ballot_data = await state.get("ballot_data");

    if (delta.length === 0) {
        console.log("No results found in delta");
        return;
    }

    console.log(`Found ${delta.length} updated ballots. Setting last_updated to ${(new Date()).toISOString()}`);
    await state.set("candidates_last_updated", (new Date()).toISOString());

    console.log(delta);

    const changes = [];

    for (let ballot of delta) {
        // Check against state
        const prev_ballot_data = ballot_data[ballot.id];
        let ballot_change = { 
            id: ballot.id, 
            name: ballot.post.label, 
            sopn_changed: false, 
            candidates_locked_changed: false, 
            cancelled_changed: false, 
            candidacies_changed: false, 
            candidacies_added: [],
            candidacies_removed: [],
            deselections: []
        };
        // Changes to look for and output: SOPN, candidates_locked, cancelled, candidacies length
        // if candidacies change length, need to check who has been added/removed and then output that

        if (ballot.sopn !== null && prev_ballot_data.sopn === null) {
            // SOPN has been updated
            ballot_change.sopn_changed = true;
        }

        if (ballot.candidates_locked !== prev_ballot_data.candidates_locked) {
            // Candidates locked status has been updated
            ballot_change.candidates_locked_changed = true;
        }

        if (ballot.cancelled !== prev_ballot_data.cancelled) {
            // Ballot has been cancelled#
            ballot_change.cancelled_changed = true;
        }

        if (ballot.candidacies.length !== prev_ballot_data.candidacies.length) {
            // Candidates have been added/removed
            for (let candidacy of prev_ballot_data.candidacies) {
                // if we can't find a candidacy in the new ballot data with the same person/party it's been removed
                if (!ballot.candidacies.find(c => c.party.ec_id === candidacy.party.ec_id && c.person.id === candidacy.person.id)) {
                    ballot_change.candidacies_removed.push(candidacy);
                }
            }

            for (let candidacy of ballot.candidacies) {
                // if we can't find a candidacy in the old ballot data with the same person/party it's been added
                if (!prev_ballot_data.candidacies.find(c => c.party.ec_id === candidacy.party.ec_id && c.person.id === candidacy.person.id)) {
                    ballot_change.candidacies_added.push(candidacy);
                }
            }
        }

        // Also check for any deselections by finding a candidacy which is the same but with a different deselection status
        for (let candidacy of ballot.candidacies) {
            if (prev_ballot_data.candidacies.find(c => c.party.ec_id === candidacy.party.ec_id && c.person.id === candidacy.person.id && c.deselected === false && candidacy.deselected === true)) {
                ballot_change.deselections.push(candidacy);
            }
        }

        ballot_data[ballot.id] = ballot;
        changes.push(ballot_change);
    }

    await state.set("ballot_data", ballot_data);
    console.log(`Found ${changes.length} changes`);

    let output = `## Candidates Updates ${(new Date()).toLocaleTimeString()}`;
    for (let change of changes) {
        output += `\n### ${ballot_data[change.id].post.label} - ${ballot_data[change.id].election.name}`;
        if (change.sopn_changed) {
            output += "\n- SOPN updated to <" + ballot_data[change.id].sopn + ">";
        }
        if (change.candidates_locked_changed) {
            output += "\n- Candidate list is now " + (ballot_data[change.id].candidates_locked ? "locked" : "not locked");
        }
        if (change.cancelled_changed) {
            output += "\n- Election is now " + (ballot_data[change.id].cancelled ? "cancelled" : "not cancelled");
        }
        if (change.candidacies_changed) {
            output += "\n- Candidacies Changed:";
            if (change.candidacies_added.length > 0) {
                for (let candidacy of change.candidacies_added) {
                    output += `\n  - Added: [${candidacy.person.name}](<https://whocanivotefor.co.uk/person/${candidacy.person.id}>) (${candidacy.party.name})`;
                }
            }
            if (change.candidacies_removed.length > 0) {
                for (let candidacy of change.candidacies_removed) {
                    output += `\n  - Removed: [${candidacy.person.name}](<https://whocanivotefor.co.uk/person/${candidacy.person.id}>) (${candidacy.party.name})`;
                }
            }
        }
        if (change.deselections.length > 0) {
            for (let candidacy of change.deselections) {
                output += `\n  - Deselected: [${candidacy.person.name}](<https://whocanivotefor.co.uk/person/${candidacy.person.id}>) (${candidacy.party.name})`;
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
    console.log("Finished candidates cron");
}