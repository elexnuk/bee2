import { fetchJson } from "./fetch.js";

const BBC_URL = process.env.BBC_DATA_URL;

export async function getConstituencyData() {
    let url = BBC_URL + "/news/election/2024/uk/constituencies";
    return await fetchJson(url, "GET", null, {});
}

export async function getScoreboardData() {
    let url = BBC_URL + "/news/election/2024/uk/results";
    return await fetchJson(url, "GET", null, {});
}

export async function getConstituencyDataByCode(code) {
    let url = BBC_URL + `/news/election/2024/uk/constituencies/${code}`;
    return await fetchJson(url, "GET", null, {});
}