/**
 * @file fetch.js
 * @brief Handles network requests
 */
export async function fetchJson(url, method = "GET", body = null, headers = {}) {
    try {
        // Construct the fetch options
        const options = {
            method: method.toUpperCase(),
            headers: headers,
            body: body ? JSON.stringify(body) : null,
        };

        // Fetch the data
        const response = await fetch(url, options);

        // Check if the response is successful
        if (!response.ok) {
            throw new Error(`Response ${response.status} ${response.statusText} is not OK.`);
        }

        // Parse the response data
        const data = await response.json();

        return data;
    } catch (error) {
        throw new Error(`[ERROR] Fetch ${method} ${url} failed: ${error.message}`);
    }
}