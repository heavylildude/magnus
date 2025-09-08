import fs from "fs";
import axios from "axios";
import { load } from "cheerio";
// UPDATED IMPORTS: Get keys from config, others from utils
import { BRAVE_API_KEY, GOOGLE_API_KEY, GOOGLE_CX_ID } from "./config.js";
import { CACHE_TTL, CACHE_FILE } from "./utils.js";
import { log } from "./ui.js";

// The cache is still a Map in memory for speed, but now we'll sync it with a file.
let searchCache = new Map();

// --- CACHE MANAGEMENT FUNCTIONS ---

function saveCache() {
    try {
        // Converts the Map to an array of [key, value] pairs and stringifies it
        const data = JSON.stringify(Array.from(searchCache.entries()));
        fs.writeFileSync(CACHE_FILE, data);
    } catch (err) {
        log.error(`Failed to save cache: ${err.message}`);
    }
}

function loadCache() {
    if (!fs.existsSync(CACHE_FILE)) return;
    try {
        const data = fs.readFileSync(CACHE_FILE);
        const entries = JSON.parse(data);
        const now = Date.now();
        // Prune expired entries as we load the cache
        const freshEntries = entries.filter(([key, value]) => (now - value.timestamp < CACHE_TTL));
        searchCache = new Map(freshEntries);
        log.gray(`[ CACHE ] Loaded ${searchCache.size} fresh entries from cache.json`);
    } catch (err) {
        log.error(`Failed to load or parse cache: ${err.message}`);
        searchCache = new Map(); // Start fresh if the file is corrupt
    }
}

// --- SEARCH HELPER FUNCTIONS ---

// Helper for scraping (our primary method)
async function tryScraping(query) {
    log.gray(`[ SEARCH ] Attempting to scrape for "${query}"...`);
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://search.brave.com/search?q=${encodedQuery}`;
    const { data } = await axios.get(searchUrl, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36" } });
    const $ = load(data);
    const results = [];
    $('div.snippet[data-type="web"]').each((i, el) => {
        if (i >= 3) return;
        const linkElement = $(el).find('a.heading-serpresult');
        const url = linkElement.attr('href');
        const title = $(el).find('div.title').text().trim();
        const snippet = $(el).find('div.snippet-description').text().trim();
        if (title && url) {
            results.push({ title, url, snippet });
        }
    });
    return { results, noResults: results.length === 0 };
}

// Helper for Brave API (Fallback 1)
async function tryBraveApi(query) {
    if (!BRAVE_API_KEY || BRAVE_API_KEY === "YOUR_BRAVE_API_KEY_HERE") throw new Error("Brave API key not configured.");
    log.gray(`[ SEARCH ] Trying Brave API for "${query}"...`);
    const { data } = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        headers: { 'X-Subscription-Token': BRAVE_API_KEY, 'Accept': 'application/json' },
        params: { q: query }
    });
    if (!data.web || !data.web.results) return { results: [], noResults: true };
    const results = data.web.results.slice(0, 3).map(item => ({
        title: item.title, url: item.url, snippet: item.description
    }));
    return { results, noResults: results.length === 0 };
}

// Helper for Google API (Fallback 2)
async function tryGoogleApi(query) {
    if (!GOOGLE_API_KEY || GOOGLE_API_KEY === "YOUR_GOOGLE_API_KEY_HERE" || !GOOGLE_CX_ID) throw new Error("Google API key not configured.");
    log.gray(`[ SEARCH ] Trying Google API for "${query}"...`);
    const { data } = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: { key: GOOGLE_API_KEY, cx: GOOGLE_CX_ID, q: query }
    });
    if (!data.items) return { results: [], noResults: true };
    const results = data.items.map(item => ({
        title: item.title, url: item.link, snippet: item.snippet
    }));
    return { results, noResults: results.length === 0 };
}

// --- MAIN EXPORTED FUNCTIONS ---

// The main orchestrator for the search waterfall
export async function performSearch(query) {
    const cacheKey = query.trim().toLowerCase();
    const cached = searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        log.gray(`[ CACHE HIT ] Serving stored results for "${query}"`);
        return cached.data;
    }

    try {
        const result = await tryScraping(query);
        searchCache.set(cacheKey, { timestamp: Date.now(), data: result });
        saveCache();
        return result;
    } catch (scrapeError) {
        if (scrapeError.response?.status === 429) {
            log.warn("[ 429 ] Scraper rate-limited. Activating Fallback 1: Brave API.");
            try {
                const result = await tryBraveApi(query);
                searchCache.set(cacheKey, { timestamp: Date.now(), data: result });
                saveCache();
                return result;
            } catch (braveError) {
                log.warn(`[ FAIL ] Brave API failed: ${braveError.message}. Activating Fallback 2: Google API.`);
                try {
                    const result = await tryGoogleApi(query);
                    searchCache.set(cacheKey, { timestamp: Date.now(), data: result });
                    saveCache();
                    return result;
                } catch (googleError) {
                    log.error(`[ FAIL ] All search methods failed: ${googleError.message}`);
                    throw googleError;
                }
            }
        } else {
            log.error(`[ FAIL ] Scraping failed for a non-rate-limit reason: ${scrapeError.message}`);
            throw scrapeError;
        }
    }
}

// This function is used by the /web command for direct URL scraping
export async function scrapeUrl(url) {
    try {
        const { data } = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36" } });
        const $ = load(data);
        $('script, style, noscript, svg, footer, header, nav').remove();
        let content = $('body').text().replace(/\s\s+/g, ' ').trim();
        return { content };
    } catch (error) {
        throw new Error(`Failed to scrape the URL: ${error.message}`);
    }
}

// --- INITIALIZE CACHE ON STARTUP ---
loadCache();