import fs from "fs";
import path from "path";
import axios from "axios";
import { C, log } from "./ui.js";
import { streamChat, getFullLLMResponse } from "./api.js";
import { getMemory, getActiveModel, updateMemory, resetMemory, setVisionMode } from "./state.js";
// UPDATED IMPORT: MAX_CONTENT_LENGTH now comes from utils
import { callWithRetry, extractTargetAndPrompt, resolveAndValidateImagePath, loadFileContent, getCurrentDateTime, MAX_CONTENT_LENGTH } from "./utils.js"; 
import { scrapeUrl, performSearch } from "./services.js";

async function handleStreamedResponse(generator, userContent) {
    let fullResponse = "";
    process.stdout.write(C.White);
    for await (const piece of generator) {
        process.stdout.write(piece);
        fullResponse += piece;
    }
    process.stdout.write(`${C.R}\n`);
    updateMemory(userContent, fullResponse);
}

async function askMagnusDirect(finalPrompt, originalUserInput) {
    log.gray("🤔 Processing the provided content...");
    const payload = { model: getActiveModel(), stream: true, messages: [...getMemory(), { role: "user", content: finalPrompt }] };
    const generator = streamChat(payload);
    await callWithRetry(() => handleStreamedResponse(generator, originalUserInput));
}

async function askMagnusVision(imgPath, prompt) {
    const imageB64 = fs.readFileSync(imgPath).toString("base64");
    setVisionMode(true);
    log.info(`[ ACTION ] Engaging vision`);
    const payload = { model: getActiveModel(), stream: true, messages: [{ role: "user", content: prompt, images: [imageB64] }] };
    const generator = streamChat(payload);
    const userMemoryContent = `Image analysis prompt: "${prompt}" for the provided image.`;
    await callWithRetry(() => handleStreamedResponse(generator, userMemoryContent));
    setVisionMode(false);
    log.info(`[ ACTION ] Disengaging vision\n`);
}

// --- AGENTIC TOOL & LOOP ---

async function executeSearch(query) {
    log.info("[ ACTION ] Engaging websearch");
    try {
        const { results, noResults } = await performSearch(query);
        if (noResults) {
            log.warn("No results found, brah.");
            return "Web search returned no results.";
        }
        for (const result of results.slice(0, 3)) {
            try {
                log.warn(`🏄 Surfing to ${result.url}...`);
                const { content } = await scrapeUrl(result.url);
                const scrapedContent = content.substring(0, MAX_CONTENT_LENGTH);
                log.success(`🤙 Getting the context.`);
                const dateTime = getCurrentDateTime();
                return `Current date is ${dateTime}.\n\nScraped content from "${result.url}" for the query "${query}":\n\n\`\`\`\n${scrapedContent}\n\`\`\``;
            } catch (err) {
                if (axios.isAxiosError(err) && err.response?.status === 403) {
                    log.warn(`Site ${result.url} blocked us (403). Paddling to the next one...`);
                } else {
                    log.warn(`Wipeout on ${result.url}. Trying next result...`);
                }
            }
        }
        log.error("Deadset, couldn't scrape any top results.");
        return "Could not find and scrape any relevant web pages from the top results.";
    } catch (err) {
        log.error(`Major wipeout during search: ${err.message}`);
        return `An error occurred during web search: ${err.message}`;
    }
}

async function runAgenticLoop(initialUserPrompt) {
    let loopMessages = [...getMemory(), { role: "user", content: initialUserPrompt }];
    
    let maxIterations = 1;
    const lowerCasePrompt = initialUserPrompt.toLowerCase();
    const complexKeywords = [
        'summarize', 'summarise', 'in-depth', 'in depth', 
        'deep dive', 'explain in detail', 'analyze', 'compare',
        'contrast', 'research', 'investigate', 'think longer'
    ];

    for (const keyword of complexKeywords) {
        if (lowerCasePrompt.includes(keyword)) {
            maxIterations = 3;
            log.gray(`[ ACTION ] Complex prompt detected. Thinking iterations set to ${maxIterations}.`);
            break;
        }
    }

    for (let i = 0; i < maxIterations; i++) {
        const payload = { model: getActiveModel(), stream: false, messages: loopMessages };
        const llmResponse = await callWithRetry(() => getFullLLMResponse(payload));
        const toolCallMatch = llmResponse.match(/<tool_call>[\s\S]*?<\/tool_call>/);
        if (toolCallMatch) {
            const toolCallStr = toolCallMatch[0];
            loopMessages.push({ role: 'assistant', content: toolCallStr });
            const toolMatch = toolCallStr.match(/<tool>([\s\S]*?)<\/tool>/);
            const queryMatch = toolCallStr.match(/<query>([\s\S]*?)<\/query>/);
            if (toolMatch?.[1] === 'search' && queryMatch?.[1]) {
                log.gray(`[ ACTION ] Magnus wants to search for: "${queryMatch[1]}"`);
                log.gray("🏄 Hitting the web...");
                const searchResult = await executeSearch(queryMatch[1]);
                loopMessages.push({ role: 'user', content: `<tool_result>\n${searchResult}\n</tool_result>` });
                log.gray("🤔 Processing the search results...");
            } else {
                log.warn("[ ACTION ] Magnus tried a funky tool call. Responding directly.");
                break;
            }
        } else {
            break;
        }
    }
    const finalPayload = { model: getActiveModel(), stream: true, messages: loopMessages };
    const generator = streamChat(finalPayload);
    await handleStreamedResponse(generator, initialUserPrompt);
}

// --- COMMANDS & DEFAULT HANDLER ---

export const commandHandlers = {
    quit: async () => { log.gray("👋 Catch ya later, legend!"); process.exit(0); },
    bye: async () => commandHandlers.quit(),
    exit: async () => commandHandlers.quit(),
    reset: async () => { resetMemory(); log.success("🧹 Memory wiped clean."); },
    image: async (input) => {
        const { targetStr, promptStr } = extractTargetAndPrompt(input, 'image');
        const validatedPath = resolveAndValidateImagePath(targetStr);
        if (!validatedPath) {
            log.warn("Usage: /image <path> [prompt] (Path not found or invalid)");
            return;
        }
        await askMagnusVision(validatedPath, promptStr || "Describe this image like a legend.");
    },
    load: async (input) => {
        const { targetStr, promptStr } = extractTargetAndPrompt(input, 'load');
        const content = loadFileContent(targetStr);
        if (content === null) return;
        log.info("[ ACTION ] Engaging RAG");
        const fileName = path.basename(targetStr);
        const finalPrompt = promptStr 
            ? `Based on the content of the file "${fileName}", please answer my question: "${promptStr}". Here is the file content:\n\n\`\`\`\n${content}\n\`\`\``
            : `You have loaded the file named "${fileName}". Here is its content:\n\n\`\`\`\n${content}\n\`\`\`\n\nSummarize this file for me.`;
        await askMagnusDirect(finalPrompt, input);
    },
    web: async (input) => {
        const { targetStr: url, promptStr } = extractTargetAndPrompt(input, 'web');
        if (!url) { log.warn("Usage: /web <url> [prompt] (URL is missing)"); return; }
        try {
            log.warn(`🏄 Surfing to ${url}...`);
            const { content } = await scrapeUrl(url);
            const truncatedContent = content.substring(0, MAX_CONTENT_LENGTH);
            log.success(`🤙 Got the page content ...`);
            const dateTime = getCurrentDateTime();
            const finalPrompt = `Current date is ${dateTime}.\n\n` + (promptStr
                ? `Analyze the content of the URL "${url}" to answer this question: "${promptStr}". Here is the scraped content:\n\n\`\`\`\n${truncatedContent}\n\`\`\``
                : `Summarize this content from the URL "${url}". Here is the scraped content:\n\n\`\`\`\n${truncatedContent}\n\`\`\``);
            await askMagnusDirect(finalPrompt, input);
        } catch (err) {
            log.error(`Gnarly wipeout fetching that URL: ${err.message}`);
        }
    },
    search: async (input) => {
        const { targetStr: query } = extractTargetAndPrompt(input, 'search');
        if (!query) { log.warn("Usage: /search <your query>"); return; }
        const explicitSearchPrompt = `The user explicitly asked to search the web. Perform a web search for: "${query}"`;
        await runAgenticLoop(explicitSearchPrompt);
    },
};

export async function defaultHandler(input) {
    const lowerInput = input.toLowerCase();
    const searchTriggers = ["search online", "look online", "look up online", "google", "do websearch", "do web search"];
    
    for (const trigger of searchTriggers) {
        if (lowerInput.startsWith(trigger)) {
            const query = input.slice(trigger.length).trim();
            if (!query) {
                log.warn(`What should I search for, mate? Give me a query after "${trigger}".`);
                return;
            }
            log.info("[ ACTION ] Web search");
            const searchResult = await executeSearch(query);
            const finalPrompt = `Based on this web search result, please answer my original question: "${input}".\n\nHere is the scraped content:\n\`\`\`\n${searchResult}\n\`\`\``;
            await askMagnusDirect(finalPrompt, input);
            return;
        }
    }

    // --- NEW LOGIC BLOCK FOR TIME-SENSITIVE KEYWORDS ---
    const timeSensitiveKeywords = [
        // --- 1. Explicit Time & Recency ---
        'latest', 
        'current', 
        'up to date', 
        'up-to-date', 
        'today', 
        'recent',
        'as of right now',
        'this week',
        'yesterday',
        'breaking news',

        // --- 2. News & Updates ---
        'news on',
        'update on',
        'what\'s happening in',
        'what\'s going on with',
        'any news about',
        'latest developments',

        // --- 3. Prices, Rates & Financials ---
        'price of',
        'cost of',
        'value of',
        'how much is',
        'how much does',
        'stock price for',
        'interest rate',
        'inflation rate',
        'mortgage rates',
        'exchange rate',
        'gas prices',
        'market is up',
        'market is down',

        // --- 4. Live Events, Scores & Results ---
        'score of',
        'who won',
        'who is winning',
        'halftime score',
        'match result',
        'final score',
        'on tv tonight',
        'showtimes for',
        'election results',

        // --- 5. Real-Time Status & Conditions ---
        'weather in',
        'forecast for',
        'traffic in',
        'is service down',
        'are there outages',
        'flight status',
        'air quality in',
        'is it open',
        'are there delays',

        // --- 6. Current Roles, Rankings & Trends ---
        'who is the ceo of',
        'who is the president of',
        'who is the winner of',
        'ranking of',
        'top 10',
        'number one on',
        'trending on',
        'best selling',
        'most popular',

        // --- 7. Schedules & Future Events ---
        'when is the next',
        'release date for',
        'what time is the',
        'schedule for',
        'who is playing'
    ];
    
    for (const keyword of timeSensitiveKeywords) {
        if (lowerInput.includes(keyword)) {
            log.info(`[ ACTION ] Time-sensitive keyword '${keyword}' detected. Forcing web search.`);
            const searchResult = await executeSearch(input); // The whole prompt is the query
            const finalPrompt = `Based on this web search result, please answer my original question: "${input}".\n\nHere is the scraped content:\n\`\`\`\n${searchResult}\n\`\`\``;
            await askMagnusDirect(finalPrompt, input);
            return;
        }
    }
    // --- END NEW LOGIC BLOCK ---

    const resolvedPath = resolveAndValidateImagePath(input);
    if (resolvedPath) {
        await askMagnusVision(resolvedPath, "Analyze this image.");
        return;
    } 
    
    await runAgenticLoop(input);
}