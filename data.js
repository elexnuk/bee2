/**
 * @file data.js
 * @brief Will load in constituency data from the JSON & CSV files. May also include methods
 * to query DemocracyClub API for candidates & results + BBC data for anything else
 */

import data from "./data/parl19names.json" with { type: "json" };
import * as fs from "fs";
import * as path from "path";
import * as csv from "fast-csv";
const __dirname = import.meta.dirname;

const constituencies = {};
const names = [];

// Load in the constituency names
for (const [ballot, name] of Object.entries(data)) {
    constituencies[ballot] = { name };
    names.push(name);
}

// Loads results from the file
fs.createReadStream(path.resolve(__dirname, "data/parl19notional.csv"))
    .pipe(csv.parse({ headers: true }))
    .on("error", error => console.error(error))
    .on("data", async row => {
        const { const_name, const_code, party_name, party_abbreviation, vote_count, vote_share, result_position } = row;
        const ballot = await getBallotForConstituency(const_name);
        const constituency = constituencies[ballot];

        if (!constituency) {
            console.error(`Could not find constituency ${const_name}`);
            return;
        }
        
        constituency.const_code = const_code;

        if (!constituency.notional_results) {  
            constituency.notional_results = [];
        }

        constituency.notional_results.push({
            party_name,
            party_abbreviation,
            vote_count,
            vote_share,
            result_position
        });
    })
    .on("end", rowCount => {
        console.log(`Constituncy Notional Results: Parsed ${rowCount} rows.`);
    });

fs.createReadStream(path.resolve(__dirname, "data/parl19const.csv"))
    .pipe(csv.parse({ headers: true }))
    .on("error", error => console.error(error))
    .on("data", async row => {
        const { name,constituency_code,type,country_name,country_code,region_name,region_code,polling_on,valid_vote_count,majority,population_count
        } = row;
        const ballot = await getBallotForConstituency(name);
        const constituency = constituencies[ballot];
        if (!constituency) {
            console.error(`Could not find constituency ${name}`);
            return;
        }

        constituency.constituency_code = constituency_code;
        constituency.type = type;
        constituency.country = { name: country_name, code: country_code };
        constituency.region = { name: region_name, code: region_code };
        constituency.polling_on = polling_on;
        constituency.valid_vote_count = valid_vote_count;
        constituency.majority = majority;
        constituency.population_count = population_count;
    })
    .on("end", rowCount => {
        console.log(`Constituency Summaries: Parsed ${rowCount} rows.`);
    });

export function getConstituencyCount() {
    return Object.keys(constituencies).length;
}

export function getResultCount() {
    return Object.values(constituencies).reduce((acc, c) => acc + c.notional_results.length, 0);
}

// Fetch data
export async function getConstituencyData() {
    return constituencies;
}

export async function getConstituencyByName(name) {
    return Object.entries(constituencies).find(([b, c]) => c.name === name)[1];
}

export async function getBallotForConstituency(name) {
    return Object.entries(constituencies).find(([b, c]) => c.name === name)[0];
}

export async function getConstituencyByBallot(ballot) {
    return constituencies[ballot];
}

export async function getConstituencyNames() {
    return names;
}