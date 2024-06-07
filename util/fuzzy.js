/**
 * @file fuzzy.js  
 * @brief Handles fuzzy searching for constituency names/ballot IDs
 */
import Fuse from "fuse.js";
import { getConstituencyNames } from "./data.js";

const constituencyFuse = new Fuse(await getConstituencyNames(), { includeScore: true, threshold: 0.4 });

export async function updateConstituencyList(constituencies) {
    constituencyFuse.setCollection(constituencies);
}

// Names should just be a list of strings corresponding to constituency name
export async function findConstituencyNames(search) {
    return constituencyFuse.search(search);
}