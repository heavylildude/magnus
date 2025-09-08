#!/usr/bin/env node
import readline from "readline";
import { execSync } from "child_process";
import { loadMemory } from "./modules/state.js";
import { bootUp, getPrompt, log } from "./modules/ui.js";
import { commandHandlers, defaultHandler } from "./modules/commands.js";
import { keepOllamaAlive } from "./modules/api.js";
// UPDATED IMPORTS: Get these from their new homes
import { PING_INTERVAL_MS } from "./modules/utils.js"; 
import { OLLAMA_KEEP_ALIVE } from "./modules/config.js";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let multiline = false;
let multiBuf = [];

function handleMultiline(line) {
    if (line.trim() === "```") {
        if (!multiline) {
            multiline = true;
            multiBuf = [];
            log.gray("(multiline ON — type ``` to send)");
            rl.setPrompt('');
        } else {
            multiline = false;
            rl.setPrompt(getPrompt());
            return multiBuf.join("\n");
        }
        return null; // Awaiting more multiline input
    }
    if (multiline) {
        multiBuf.push(line);
        return null; // Awaiting more multiline input
    }
    return line.trim(); // Not in multiline mode, return the line
}

async function processInput(input) {
    if (!input) return;

    try {
        if (input.startsWith('/')) {
            const [command] = input.substring(1).split(/\s+/);
            const handler = commandHandlers[command];
            if (handler) {
                await handler(input);
            } else {
                log.warn(`Unknown command, brah. Try /help?`);
            }
        } else {
            await defaultHandler(input);
        }
    } catch (err) {
        log.error(`Magnus error: An unhandled exception occurred.`);
        console.error(err);
    }
}

async function main() {
    try {
        log.gray(`⚡️ Setting Ollama keep_alive to ${OLLAMA_KEEP_ALIVE}...`);
        execSync(`ollama set system '{"keep_alive": "${OLLAMA_KEEP_ALIVE}"}'`);
    } catch (err) {
        log.warn(`Could not set Ollama keep_alive. Make sure 'ollama' is in your system PATH.`);
        // Optional: log the full error for debugging with log.error(err);
    }

    loadMemory();
    await bootUp();

    log.gray("🚀 Connection heartbeat engaged & memory manager active.\n");
    setInterval(keepOllamaAlive, PING_INTERVAL_MS);
    await keepOllamaAlive();

    rl.setPrompt(getPrompt());
    rl.prompt();

    rl.on("line", async (line) => {
        const processedLine = handleMultiline(line);
        if (processedLine === null) {
            rl.prompt();
            return;
        }
        
        await processInput(processedLine);
        
        if (!multiline) {
             rl.prompt();
        }
    });

    rl.on("close", () => process.exit(0));
}

main().catch(err => console.error(err));