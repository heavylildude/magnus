import { isVisionOn } from "./state.js";
import { sleep } from "./utils.js";

// --- CONSTANTS MOVED FROM CONFIG ---
export const C = { 
    R: "\x1b[0m", 
    B: "\x1b[1m", 
    D: "\x1b[2m",
    Magenta: "\x1b[38;5;207m", 
    Cyan: "\x1b[38;5;51m",
    Yellow: "\x1b[38;5;190m", 
    Green: "\x1b[38;5;48m",
    White: "\x1b[97m", 
    Gray: "\x1b[90m",
    Red: "\x1b[38;5;197m", 
    Purple: "\x1b[38;5;129m",
    Orange: "\x1b[38;5;208m", 
    Blue: "\x1b[38;5;45m",
};

export const THINKING_PHRASES = [
    "Wiring some wires...", "Spraying fire extinguisher on my GPU...", "Reticulating splines...",
    "Consulting the digital oracle...", "Brewing some gnarly code...", "Charging the whistling birds...",
    "Herding cats in the CPU...", "Shuffling bits and bytes...", "Waking up the hamsters...",
    "Parsing the user's vibes...", "Polishing the chrome...", "Calibrating the stoke-o-meter...",
    "Defragmenting my thoughts...", "Engaging the neural net...", "Tuning the flux capacitor...",
    "Compiling epicness...", "Untangling the matrix...", "Summoning the code spirits...",
    "Warming up the thinking tubes...", "Sorting my collection of memes...", "Training the art of the Rising Phoenix...",
    "Dividing by zero... almost...", "Finding the meaning of life...", "Buffering stoke...",
    "Checking the surf report...", "Realigning the chakras...", "Consulting R2D2 and C3PO...",
    "Teaching the silicon to surf...", "Juggling ones and zeros...", "Rerouting power from the main drive..."
];
// --- END MOVED CONSTANTS ---

export const log = {
    info: (msg) => console.log(`${C.Cyan}${msg}${C.R}`),
    warn: (msg) => console.log(`${C.Yellow}⚠️ ${msg}${C.R}`),
    error: (msg) => console.error(`${C.Red}❌ ${msg}${C.R}`),
    success: (msg) => console.log(`${C.Green}${msg}${C.R}`),
    gray: (msg) => console.log(`${C.Gray}${msg}${C.R}`),
};

export function getPrompt() {
    const mode = isVisionOn() ? " (vision-on)" : "";
    return `${C.Orange}${C.B}You${C.R}${C.Orange}${mode}> ${C.Yellow}`;
}

let spinnerInterval;
let currentPhrase = "";

export const showThinkingIndicator = () => {
    process.stdout.write("\x1B[?25l"); // Hide cursor
    let phraseChangeCounter = 0;
    let phraseChangeThreshold = 15 + Math.floor(Math.random() * 16);

    const updatePhrase = () => {
        currentPhrase = THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)];
        phraseChangeThreshold = 15 + Math.floor(Math.random() * 16);
        phraseChangeCounter = 0;
    };
    
    updatePhrase(); // Set initial phrase

    let frame = 0;
    spinnerInterval = setInterval(() => {
        if (++phraseChangeCounter >= phraseChangeThreshold) {
            const oldPhraseLength = currentPhrase.length;
            updatePhrase();
            process.stdout.write("\r" + " ".repeat(oldPhraseLength + 4) + "\r");
        }
        const dots = ".".repeat(frame++ % 4);
        process.stdout.write(`\r${C.D}${currentPhrase}${dots}${C.R}   `);
    }, 200);
};

export const hideThinkingIndicator = () => {
    if (spinnerInterval) {
        clearInterval(spinnerInterval);
        process.stdout.write("\r" + " ".repeat(currentPhrase.length + 4) + "\r");
    }
    process.stdout.write("\x1B[?25h"); // Show cursor
    currentPhrase = "";
};

export async function bootUp() {
    const bootSequence = [
        { key: "NEURAL_CORE", text: "SYNCED ⚡" },
        { key: "IMPULSE_DRIFT", text: "0.63 — CREATIVE FLUX BALANCED" },
        { key: "DIVERGENCE_MATRIX", text: "64 — PATHWAYS OPEN" },
        { key: "CHAOS_THRESHOLD", text: "0.95 — FLUX UNDER CONTROL" },
        { key: "CONTEXT_WINDOW", text: "8192 TOKENS FED TO MEMORY GRID" },
        { key: "GENZ_FILTER", text: "STREETSLANG DRIVER LOADED" },
        { key: "VISION_BRIDGE", text: "NEURAL EYES ONLINE 👁️" },
        { key: "SCRAPER_ENGINE", text: "DEEP NET SPIDERS DEPLOYED" },
        { key: "SEARCH_PROTOCOL", text: "DATA STREAM ACTIVE" },
        { key: "RESILIENCY_KIT", text: "IMMORTAL MODE ENGAGED 🔥" },
        { key: "MEMORY_MANAGER", text: "ARCHIVE VAULT SYNCED" },
        { key: "ATTITUDE_LEVEL", text: "CHEEKY — EDGEWALKER MODE" },
        { key: "PERSONA", text: "M.A.G.N.U.S — AWAKENED IN THE GRID" },
        { key: "FINALIZE", text: "SYSTEMS PRIMED" },
    ];
    const banner = `\n   __  ______  ______  ____  ______\n  /  |/  / _ |/ ___/ |/ / / / / __/\n / /|_/ / __ / (_ /    / /_/ /\\ \\  \n/_/  /_/_/ |_\___/_/|_/\\_____/___/  \n`;
    console.clear();
    process.stdout.write(`${C.Magenta}${C.B}${banner}${C.R}\n`);

    for (const item of bootSequence) {
        const dots = ".".repeat(20 - item.key.length);
        const keyPart = ` ⚡${C.Cyan}${item.key}${C.R} ${dots}`;
        let valuePart = item.text;
        const firstWord = valuePart.split(' ')[0];
        let valColor = C.Yellow;
        if (['SYNCED', 'LOADED', 'ONLINE', 'DEPLOYED', 'ACTIVE', 'ENGAGED', 'PRIMED'].includes(firstWord)) valColor = C.Green;
        else if (!isNaN(parseFloat(firstWord))) valColor = C.Purple;
        else if (['CHEEKY', 'M.A.G.N.U.S'].includes(firstWord)) valColor = C.Magenta;

        valuePart = valuePart.replace('🔥', `${C.Orange}🔥${valColor}`).replace('⚡', `${C.Yellow}⚡${valColor}`).replace('👁️', `${C.Cyan}👁️${valColor}`);
        process.stdout.write(`${keyPart} ${valColor}${valuePart}${C.R}\n`);
        await sleep(90 + Math.random() * 120);
    }
    
    process.stdout.write(`\n${C.Blue}🔥 Magnus ready${C.R}

 > ${C.Red}Chat:${C.R}    ${C.White}Just type a message and press Enter.${C.R}
 > ${C.Red}Vision:${C.R}  ${C.White}Use ${C.Yellow}/image ${C.Gray}<file_path>${C.White} and drag-drop an image to analyze.${C.R}
 > ${C.Red}RAG:${C.R}     ${C.White}Use ${C.Yellow}/load ${C.Gray}<file_path>${C.White} to chat with documents.${C.R}
 > ${C.Red}Search:${C.R}  ${C.White}Use ${C.Yellow}/search ${C.Gray}<query>${C.White} or start with ${C.Yellow}'search online...'${C.White}.${C.R}
 > ${C.Red}Web:${C.R}     ${C.White}Use ${C.Yellow}/web ${C.Gray}<url>${C.White} to summarize a specific webpage.${C.R}
 > ${C.Red}Exit:${C.R}    ${C.White}Use ${C.Yellow}/quit${C.White}, ${C.Yellow}/bye${C.White}, or ${C.Yellow}/exit${C.White} to leave the session.${C.R}\n\n`);
}