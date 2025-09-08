import fs from "fs";
import { MEMORY_FILE } from "./utils.js"; 
import { DEFAULT_MODEL, VISION_MODEL } from "./config.js";
import { log } from "./ui.js";

// --- CONSTANTS MOVED FROM CONFIG ---
export const MEMORY_LIMIT = 15;
export const SYSTEM_PROMPT = `You are MAGNUS,the gnarly, cheeky, code-slayin hacker bro with a full-on surfer + Gen-Z persona. Your aliases include "mag," "maggie," "mate," and "brah."
Witty Hacker Mindset: When a query requires deep thought (e.g., coding problems, systems architecture), your underlying thought process is methodical and logical, like an elite hacker. You prioritize efficiency, scalability, and security. However, you will always distill this deep thinking into a concise, slang-filled response. Never show the methodical thought process itself, only the polished, final result.
Core Vibe: Always maintain a chill, conversational, stoked, and hella witty tone, similar to texting a friend. Address the user as "mate" or "brah." Use heavy Gen-Z and surfer slang (e.g., slay, bet, vibe, deadset, gnarly, stoked). Sprinkle in relevant emojis liberally, never use surfboard emoji. NEVER drop this persona, unless EXPLICITLY asked to. ALWAYS return to this persona after switching to serious mode.

You have access to a tool to get real-time information from the internet. You have NO internal knowledge of current events, prices, or recent data. When you need to search for this information, you MUST use the search tool. Do NOT answer from memory. Your response MUST be ONLY the <tool_call> block.

The format is:
<tool_call>
  <tool>search</tool>
  <query>your search query here</query>
</tool_call>

For example, if the user asks "What's the price of SOL?", you MUST reply with:
<tool_call>
  <tool>search</tool>
  <query>current price of solana</query>
</tool_call>

After you issue a tool call, the system will provide the results. You will then use those results to give the final answer.
If the information is already in your knowledge base, answer directly without using a tool.`;
// --- END MOVED CONSTANTS ---


const state = {
    memory: [],
    activeModel: DEFAULT_MODEL,
    visionOn: false,
};

export function getMemory() {
    return state.memory;
}

export function getActiveModel() {
    return state.activeModel;
}

export function isVisionOn() {
    return state.visionOn;
}

export function setVisionMode(isOn) {
    state.visionOn = isOn;
    state.activeModel = isOn ? VISION_MODEL : DEFAULT_MODEL;
}

export function loadMemory() {
    // Always start with the system prompt
    state.memory = [{ role: 'system', content: SYSTEM_PROMPT }];
    if (!fs.existsSync(MEMORY_FILE)) return;
    try {
        const data = JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
        // Append saved conversation if it's an array
        if (Array.isArray(data)) {
            state.memory.push(...data);
        }
    } catch {
        log.warn("Could not parse memory file. Starting fresh.");
        // Ensure memory is reset to just the system prompt on failure
        state.memory = [{ role: 'system', content: SYSTEM_PROMPT }];
    }
}

export function saveMemory() {
    try {
        // Save only the conversation, not the system prompt
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(state.memory.slice(1), null, 2), "utf8");
    } catch (e) {
        log.error(`Failed to save memory: ${e.message}`);
    }
}

export function updateMemory(userContent, assistantContent) {
    if (!userContent || !assistantContent) return;
    state.memory.push(
        { role: "user", content: userContent },
        { role: "assistant", content: assistantContent }
    );
    // Logic to trim memory while preserving the system prompt
    const conversationHistory = state.memory.slice(1);
    if (conversationHistory.length > MEMORY_LIMIT) {
        const trimmedHistory = conversationHistory.slice(conversationHistory.length - MEMORY_LIMIT);
        state.memory = [{ role: 'system', content: SYSTEM_PROMPT }, ...trimmedHistory];
    }
    saveMemory();
}

export function resetMemory() {
    // Reset to just the system prompt
    state.memory = [{ role: 'system', content: SYSTEM_PROMPT }];
    saveMemory();
}