import Keyv from "keyv";
import { getCurrentElectionBallots } from "./democlub.js";

export const state = new Keyv("sqlite://data/db.sqlite");

state.on("error", err => console.error("Keyv connection error:", err));

const contains_ge_ballot_data = await state.has("contains_ge_ballot_data");
if (!contains_ge_ballot_data) {
    console.log("No Ballot Data in State, Fetching...");
    await state.set("contains_ge_ballot_data", false);

    let ballot_data = {};
    const ballots = await getCurrentElectionBallots();

    for (let ballot of ballots) {
        ballot_data[ballot.ballot_paper_id] = ballot;
    }

    await state.set("ballot_data", ballot_data);
    await state.set("contains_ge_ballot_data", true);
    console.log("Ballot Data Fetched and Stored in State.");
}

const updated = await state.has("candidates_last_updated");
if (!updated) {
    console.log("No last_updated in State, Setting to Now...");
    await state.set("candidates_last_updated", (new Date()).toISOString());
    console.log("last_updated Set to Now.");
}