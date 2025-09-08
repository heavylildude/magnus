import { API_URL, OLLAMA_BASE_URL } from "./config.js";
import { log, showThinkingIndicator, hideThinkingIndicator } from "./ui.js";

async function* processStream(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let isThinking = false; // This state persists across the entire stream

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
            if (!line.trim().startsWith("{")) continue;
            try {
                let piece = JSON.parse(line)?.message?.content || "";

                // This loop correctly processes chunks that might contain both text and think blocks
                while (piece.length > 0) {
                    if (isThinking) {
                        const endThink = piece.indexOf("</think>");
                        if (endThink !== -1) {
                            // Found the end tag. The part after it is normal text.
                            piece = piece.substring(endThink + 8); // 8 is length of "</think>"
                            isThinking = false; // Exit thinking mode
                        } else {
                            // Still in a thinking block, discard this whole piece and wait for the next
                            piece = ""; 
                        }
                    } else { // Not currently in thinking mode
                        const startThink = piece.indexOf("<think>");
                        if (startThink !== -1) {
                            // Found a start tag. Yield the text before it.
                            const textToShow = piece.substring(0, startThink);
                            if (textToShow) yield textToShow;
                            
                            // The rest of the piece starts the thinking block
                            piece = piece.substring(startThink + 7); // 7 is length of "<think>"
                            isThinking = true; // Enter thinking mode
                        } else {
                            // No think tags in this piece, yield all of it
                            if (piece) yield piece;
                            piece = "";
                        }
                    }
                }
            } catch {}
        }
    }
}

export async function* streamChat(payload) {
    showThinkingIndicator();
    try {
        const resp = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        hideThinkingIndicator();
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        
        let isFirstChunk = true;
        for await (const piece of processStream(resp)) {
            // Trim leading whitespace on the very first piece of visible text
            if (isFirstChunk && piece) {
                yield piece.trimStart();
                isFirstChunk = false;
            } else {
                yield piece;
            }
        }
    } catch (err) {
        hideThinkingIndicator();
        throw err;
    }
}

export async function getFullLLMResponse(payload) {
    showThinkingIndicator();
    try {
        const finalPayload = { ...payload, stream: false };
        const resp = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finalPayload),
        });
        hideThinkingIndicator();
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        
        const jsonResponse = await resp.json();
        return jsonResponse?.message?.content || "";
    } catch (err) {
        hideThinkingIndicator();
        throw err;
    }
}

export const keepOllamaAlive = async () => {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/`);
        if (!response.ok) {
            log.warn(`[HEARTBEAT] Ping failed with status: ${response.status}`);
        }
    } catch (error) {
        log.error(`[HEARTBEAT] Connection seems dead. Error: ${error.message}`);
    }
};