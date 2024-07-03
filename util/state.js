import Keyv from "keyv";
import { getCurrentElectionBallots } from "./democlub.js";

export const state = new Keyv("sqlite://data/db.sqlite");

state.on("error", err => console.error("Keyv connection error:", err));

const contains_ge_ballot_data = await state.get("contains_ge_ballot_data");
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
    console.log("No last_updated in State, Setting to Backfill datetime...");
    await state.set("candidates_last_updated", process.env.LAST_UPDATED_BACKFILL);
    console.log("last_updated Set to Backfill datetime " + process.env.LAST_UPDATED_BACKFILL);
}

const candidates_elected_updated = await state.has("candidates_elected_last_updated");
if (!candidates_elected_updated) {
    console.log("No candidates_elected_last_updated in State, Setting to Backfill datetime...");
    await state.set("candidates_elected_last_updated", process.env.LAST_UPDATED_BACKFILL);
    console.log("candidates_elected_last_updated Set to Backfill datetime " + process.env.LAST_UPDATED_BACKFILL);
}

const results_updated = await state.has("results_last_updated");
if (!results_updated) {
    console.log("No results_last_updated in State, Setting to Backfill datetime...");
    await state.set("results_last_updated", process.env.LAST_UPDATED_BACKFILL);
    console.log("results_last_updated Set to Backfill datetime " + process.env.LAST_UPDATED_BACKFILL);
}