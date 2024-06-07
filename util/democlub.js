/**
 * @file democlub.js
 * @brief Handles the Democracy Club API requests
 */
import { fetchJson } from "./fetch.js";

const DEMOCLUB_API = "https://candidates.democracyclub.org.uk/api/next/";
const HEADERS = {
    "Authorization": `Token ${process.env.DEMOCLUB_API_KEY}`
};

export async function getCurrentElections() {
    const url = DEMOCLUB_API + "elections/?current=true&page_size=200";
    return await fetchJson(url, "GET", null, HEADERS);
}

export async function getElectionInformation(election) {
    const url = DEMOCLUB_API + `elections/${election}/`;
    return await fetchJson(url, "GET", null, HEADERS);
}

export async function getBallotInformation(ballot) {
    const url = DEMOCLUB_API + `ballots/${ballot}/`;
    return await fetchJson(url, "GET", null, HEADERS);
}

export async function getBallotResults(ballot) {
    const url = DEMOCLUB_API + `results/${ballot}/`;
    return await fetchJson(url, "GET", null, HEADERS);
}

export async function getResultsDelta(last_updated, election_date=null, election_id=null, page_size=200) {
    let url = DEMOCLUB_API + "results/";
    if (election_date && !election_id) {
        url += `?election_date=${election_date}&page_size=${page_size}&last_updated=${last_updated}`;
    } else if (election_id && !election_date) {
        url += `?election_id=${election_id}&page_size=${page_size}&last_updated=${last_updated}`;
    } else if (!election_id && !election_date) {
        url += `?page_size=${page_size}&last_updated=${last_updated}`;
    } else {
        url += `?election_id=${election_id}&election_date=${election_date}&page_size=${page_size}&last_updated=${last_updated}`;
    }

    return await fetchJson(url, "GET", null, HEADERS);
}

