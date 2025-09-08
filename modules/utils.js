import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url"; // MOVED FROM CONFIG
import { log } from "./ui.js";

// --- CONSTANTS MOVED FROM CONFIG ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const MEMORY_FILE = path.join(__dirname, "..", "memory.json"); 
export const CACHE_FILE = path.join(__dirname, "..", "cache.json");
export const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif", ".tiff", ".tif"];
export const MAX_CONTENT_LENGTH = 11400;

export const PING_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes
export const RETRY_ATTEMPTS = 3;
export const CACHE_TTL = 10 * 60 * 1000;
// --- END MOVED CONSTANTS ---

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export function getCurrentDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZone: 'Asia/Jakarta', timeZoneName: 'short' };
    return now.toLocaleString('en-US', options);
}

export const callWithRetry = async (fn, retries = RETRY_ATTEMPTS, delay = 1000) => {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            log.warn(`API call failed: ${error.message}. Retrying in ${delay / 1000}s... (${retries} attempts left)`);
            await sleep(delay);
            return callWithRetry(fn, retries - 1, delay * 2);
        } else {
            log.error(`API call failed after all retries: ${error.message}`);
            throw error;
        }
    }
};

export function resolveAndValidateImagePath(filePath) {
    if (!filePath) return null;
    let p = filePath.trim().replace(/^['"]|['"]$/g, "");
    if (p.startsWith("~")) p = path.join(os.homedir(), p.slice(1));
    if (fs.existsSync(p) && IMAGE_EXTENSIONS.includes(path.extname(p).toLowerCase())) return p;
    return null;
}

export function loadFileContent(filePath) {
    if (!filePath) return null;
    let p = filePath.trim().replace(/^['"]|['"]$/g, "");
    if (p.startsWith("~")) p = path.join(os.homedir(), p.slice(1));
    if (fs.existsSync(p)) {
        try {
            return fs.readFileSync(p, "utf8");
        } catch (err) {
            log.error(`Error reading file: ${err.message}`);
            return null;
        }
    }
    log.warn(`File not found: ${p}`);
    return null;
}

export function extractTargetAndPrompt(input, command) {
    const regex = new RegExp(`^/${command}\\s+`);
    const promptStr = input.replace(regex, "").trim();
    if (command === 'search') {
        return { targetStr: promptStr, promptStr: '' };
    }
    let targetStr = "";
    let finalPrompt = "";
    const quotedMatch = promptStr.match(/^"([^"]+)"\s*(.*)$/) || promptStr.match(/^'([^']+)'\s*(.*)$/);
    if (quotedMatch) {
        targetStr = quotedMatch[1];
        finalPrompt = (quotedMatch[2] || "").trim();
    } else {
        const parts = promptStr.trim().split(/\s+/);
        targetStr = parts.shift() || "";
        finalPrompt = parts.join(" ").trim();
    }
    return { targetStr, promptStr: finalPrompt };
}