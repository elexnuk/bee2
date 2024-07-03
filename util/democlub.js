/**
 * @file democlub.js
 * @brief Handles the Democracy Club API requests
 */
import { fetchJson } from "./fetch.js";

const DEMOCLUB_API = "https://candidates.democracyclub.org.uk/api/next/";
const HEADERS = {
    "Authorization": `Token ${process.env.DEMOCLUB_API_KEY}`
};

// export async function getCurrentElections() {
//     const url = DEMOCLUB_API + "elections/?current=true&page_size=200";
//     return await fetchJson(url, "GET", null, HEADERS);
// }

export async function getCurrentElectionBallots() {
    const url = DEMOCLUB_API + "ballots/?current=true&page_size=200";
    
    let data = await fetchJson(url, "GET", null, HEADERS);
    if (!data || !data.results) return [];
    console.log(`Loading ${data.count} ballots...`);

    while (data.next) {
        console.log("requesting next page", data.next);
        let next = await fetchJson(data.next, "GET", null, HEADERS);
        if (!next || !next.results) break;
        data.results.push(...next.results); 
        data.next = next.next;
    }

    if (data.results.length !==  data.count) {
        console.log(`Loaded ${data.results.length} ballots out of ${data.count}`);
    }

    return data.results;
}

// export async function getElectionInformation(election) {
//     const url = DEMOCLUB_API + `elections/${election}/`;
//     return await fetchJson(url, "GET", null, HEADERS);
// }

export async function getBallotInformation(ballot) {
    const url = DEMOCLUB_API + `ballots/${ballot}/`;
    return await fetchJson(url, "GET", null, HEADERS);
}

export async function getBallotResults(ballot) {
    const url = DEMOCLUB_API + `results/${ballot}/`;
    return await fetchJson(url, "GET", null, HEADERS);
}

// export async function getResultsDelta(last_updated, election_date=null, election_id=null, page_size=200) {
//     let url = DEMOCLUB_API + "results/";
//     if (election_date && !election_id) {
//         url += `?election_date=${election_date}&page_size=${page_size}&last_updated=${last_updated}`;
//     } else if (election_id && !election_date) {
//         url += `?election_id=${election_id}&page_size=${page_size}&last_updated=${last_updated}`;
//     } else if (!election_id && !election_date) {
//         url += `?page_size=${page_size}&last_updated=${last_updated}`;
//     } else {
//         url += `?election_id=${election_id}&election_date=${election_date}&page_size=${page_size}&last_updated=${last_updated}`;
//     }

//     return await fetchJson(url, "GET", null, HEADERS);
// }

export async function getResultsDelta(last_updated, page_size=200) {
    const url = DEMOCLUB_API + `results/?page_size=${page_size}&last_updated=${last_updated}`;
    try {
        let data = await fetchJson(url, "GET", null, HEADERS);
        if (!data || !data.results) return [];
        console.log(`Loading ${data.count} updated results...`);

        while (data.next) {
            console.log("requesting next page", data.next);
            let next = await fetchJson(data.next, "GET", null, HEADERS);
            if (!next || !next.results) break;
            data.results.push(...next.results); 
            data.next = next.next;
        }

        if (data.results.length !==  data.count) {
            console.log(`Results Delta: Loaded ${data.results.length} results out of ${data.count}`);
        }

        return data.results;
    } catch (err) {
        console.error(`[ERROR] Fetch ${url} failed: ${err.message}`);
        return [];
    }
}

export async function getBallotsDelta(last_updated, page_size=200) {
    const url = DEMOCLUB_API + `ballots/?page_size=${page_size}&last_updated=${last_updated}&election_id=parl.2024-07-04`;
    try {
        let data = await fetchJson(url, "GET", null, HEADERS);
        if (!data || !data.results) return [];
        console.log(`Loading ${data.count} updated ballots...`);
    
        while (data.next) {
            console.log("requesting next page", data.next);
            let next = await fetchJson(data.next, "GET", null, HEADERS);
            if (!next || !next.results) break;
            data.results.push(...next.results); 
            data.next = next.next;
        }

        if (data.results.length !==  data.count) { 
            console.log(`Ballot Delta: Loaded ${data.results.length} ballots out of ${data.count}`);
        }
    
        return data.results;
    } catch (err) {
        console.error(`[ERROR] Fetch ${url} failed: ${err.message}`);
        return [];
    }
}

export async function getCandidatesElectedDelta(last_updated, page_size=200) {
    const url = DEMOCLUB_API + `candidates_elected/?page_size=${page_size}&last_updated=${last_updated}`;
    try {
        let data = await fetchJson(url, "GET", null, HEADERS);
        if (!data || !data.results) return [];

        console.log(`Loading ${data.count} newly elected candidates...`);

        while(data.next) {
            console.log("requesting next page", data.next);
            let next = await fetchJson(data.next, "GET", null, HEADERS);
            if (!next || !next.results) break;
            data.results.push(...next.results);
            data.next = next.next;
        }

        if (data.results.length !==  data.count) {
            console.log(`Elected Delta: Loaded ${data.results.length} candidates out of ${data.count}`);
        }

        return data.results;
    } catch (err) {
        console.error(`[ERROR] Fetch ${url} failed: ${err.message}`);
        return [];
    }
}
