# ⚡ M.A.G.N.U.S. ⚡

### An Agentic Orchestration Layer for Any Language Model

-----

Yo. What if your local AI wasn't just a model, but a full-stack, web-aware agent? This CLI isn't just a terminal app; it's a **client-side agentic layer**. It's the command center that wraps around your LLMs, giving them a skill set they never had—turning a standard instruction-following model into a legit web-surfing, file-reading, image-analyzing powerhouse.

This is the scientific approach to augmenting LLMs: instead of everything happening in the model, we build an intelligent **orchestrator** around it. This orchestrator intercepts prompts, triggers external tools like web scrapers, and then injects the fresh data back into the context, creating a powerful, dynamic loop.

## 🔬 The Scientific Approach: Client-Side Tool Augmentation

The secret sauce isn't just a sick model; it's how the CLI acts as its brain's frontal lobe. Here's the breakdown of our approach to tool-calling, which is so effective it even works for LLMs without native tool-calling abilities.

### 1. Heuristic-Based Web Search (The "No-Tools-Needed" Hack)

This is the core of our innovation for base models. The CLI itself is smart enough to know when the user needs fresh, real-time data.

* **How it Works**: The `defaultHandler` in `modules/commands.js` contains a gnarly list of **time-sensitive keywords** (e.g., `price of`, `latest`, `weather in`, `who won`). When your prompt hits one of these triggers, the CLI doesn't even ask the LLM. It knows the vibe, immediately fires up the `executeSearch` function, scrapes the web for the answer, and then feeds the scraped content to the LLM with the original question.
* **The Result**: You get real-time, accurate answers from **any instruction-following LLM**. The model doesn't need to know *how* to call a tool; the CLI acts as its spotter, fetching the data it needs to avoid a hallucination wipeout. This is a deadset way to give web access to models that were never trained for it. 🤯

### 2. Fine-Tuned Agentic Loop (For Models That Can Vibe)

For more advanced models, we can do even better. The default model, `heavylildude/magnus-supernova`, has been specifically fine-tuned to understand a simulated tool-calling syntax.

* **How it Works**: The `SYSTEM_PROMPT` in `modules/state.js` teaches the model to respond with an XML block like `<tool_call><tool>search</tool><query>...</query></tool_call>` when it realizes its internal knowledge is stale. The `runAgenticLoop` in `modules/commands.js` is designed to catch this specific output.
* **The Loop**:
    1.  The LLM outputs the `<tool_call>` block.
    2.  The CLI intercepts this, preventing it from being shown to you.
    3.  It executes the requested search.
    4.  It feeds the search results back to the model in a new turn, wrapped in `<tool_result>` tags.
    5.  The model then uses this new context to form its final, data-rich answer.
* **The Result**: A true agentic workflow where the LLM can proactively request information, leading to more complex, multi-step problem-solving.

### 3. Native Model Capabilities (Vision & RAG)

While our web search hack is model-agnostic, some features deadset require a capable model.

* **Image Analysis (`/image`)**: This requires a vision-language model (VLM) that can process image data.
* **Retrieval-Augmented Generation (`/load`)**: This requires an LLM with a large context window and the ability to perform high-level reasoning on large chunks of provided text.

This is why **`heavylildude/magnus-supernova`** is the recommended model. It's a multi-modal powerhouse fine-tuned with both the vision capabilities and the tool-calling syntax needed to shred all features out-of-the-box.

## 🔥 Features That Rip

* **🤖 Universal Web Search**: Grants real-time web access to LLMs **with or without** native tool-calling abilities through our client-side heuristic triggers.
* **🌀 Advanced Agentic Loop**: A full request-execute-respond tool loop for fine-tuned models like `magnus-supernova`.
* **👁️ Multi-Model Routing**: Seamlessly use one all-powerful model or configure two separate models (e.g., text and vision) and watch the CLI auto-switch between them.
* **📂 Local File RAG**: Use `/load` to inject the content of any local file into the context window. Chat with your code, get doc summaries, or analyze logs.
* **🧠 Persistent Memory**: Magnus remembers the vibe of the session, maintaining a unified context even when switching models.
* **✨ A Vibe-Forward UI**: Custom synthwave boot-up, dynamic thinking indicators, and a sick neon color palette make your terminal feel like a command deck.

## 🚀 Get Shredding (Installation)

Getting set up is a no-brainer. Just follow the current.

1.  **Prerequisites**:
    * **Node.js v18+** installed.
    * A running instance of **Ollama**.
    * **Get Your Model(s)**:
        * **Simple Setup (Recommended)**: For a plug-and-play experience, pull the all-in-one [`magnus-supernova`](https://ollama.com/heavylildude/magnus-supernova) model. It has all the text, vision, and tool-use capabilities needed for every feature.
            ```bash
            ollama pull heavylildude/magnus-supernova
            ```
        * **Custom Quiver (Advanced)**: This script is a true multi-model router. You can configure `DEFAULT_MODEL` and `VISION_MODEL` in `modules/config.js` to point to two *different* LLMs (e.g., a fast text model and a powerful vision model). `magnus.js` will autoswitch between them smartly, maintaining a unified memory, context, and cache for both.
    * **OPTIONAL**: Install a Nerd Font like `Delugia Code` for the best emoji/symbol rendering.

2.  **Clone the Repo**:
    ```bash
    git clone <your-repo-url>
    cd magnus
    ```

3.  **Install Dependencies**:
    This project is lean. You just need `axios` and `cheerio`.
    ```bash
    npm install axios cheerio
    ```

4.  **Drop In!**:
    Run the main script to start your session.
    ```bash
    node magnus.js
    ```

    **✨ Bonus Pro-Tip:** Install it globally to run from anywhere.
    ```bash
    npm install -g
    ```
    Now you can just type `magnus` in any terminal to get started, mate!
    *(Linux/Mac users: make sure `magnus.js` is executable with `chmod +x magnus.js`)*

## 🏄‍♂️ Riding the CLI (Usage)

Mastering the CLI is easy. Here are the core moves:

| Command                  | Action                                                                                         |
| :----------------------- | :--------------------------------------------------------------------------------------------- |
| /image <path> [prompt] | Analyze a local image. Requires a vision-capable model.                                        |
| /load <path> [prompt]  | Load a local file's content into the chat for RAG.                                             |
| /web <url> [prompt]    | Scrape a specific webpage and get a summary or ask questions about it.                           |
| /search <query>        | Force a web search, scrape the top result, and answer based on it.                               |
| search online...       | Use natural language to trigger the /search command.                                         |
| [time-sensitive query] | Just ask! "What's the weather..." or "Price of SOL..." triggers the web search automatically.    |
| /reset                 | Wipes the current session memory for a clean slate.                                            |
| /quit, /bye, /exit | Peace out and end the session.                                                                 |
|  \`\`\`                   | Type three backticks to start and end multiline code input.                                    |

## 🗺️ The Blueprint (Project Structure)

Here's the breakdown of the codebase, straight up: