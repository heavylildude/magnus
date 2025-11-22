# 🏄‍♂️ MAGNUS - The Gnarly AI Code Editor

> *"Why use the front door when the service entrance is open?"*

**MAGNUS** is a badass AI-powered code editor that combines the power of Google Gemini and Ollama with an intelligent diff-based code modification system. Built by surfer bros for developers who want to code fast and break things (then fix 'em even faster).

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![Status](https://img.shields.io/badge/status-WIP-orange)

> ⚠️ **WORK IN PROGRESS** - Expect some bogus shit! This is a gnarly experiment, so things might break. Report bugs and we'll fix 'em! 🤙

> 💡 **PRO TIP**: While Magnus supports Gemini API out of the box, for the **FULL MAGNUS EXPERIENCE** we highly recommend using the custom-trained **[Magnus-Coder](https://ollama.com/heavylildude/magnus-coder)** model on Ollama. It's been fine-tuned to speak fluent surfer bro and generate wicked code! 🏄‍♂️

---

## 🌊 What Makes Magnus Rad?

Magnus ain't your typical code editor. It's a full-blown AI coding assistant that thinks like a hacker and codes like a pro. Here's what makes it wicked:

### 🧠 **Dual AI Engine**

- **Google Gemini 2.5 Flash** integration for lightning-fast AI responses
- **Ollama** support for local LLM models (privacy-first, brah!)
- Automatic fallback between Gemini and Ollama
- Smart context management with configurable memory

### 💾 **Active Memory System**

- SQLite-based conversation persistence
- Configurable context window (default: 6 turns)
- Smart message history (up to 15 messages)
- Attachment tracking across conversations
- Automatic context injection for relevant file references

### 🔍 **Web Search Integration**

- **Brave Search API** support
- **Google Custom Search** support
- 8-second timeout for snappy results
- Integrated search results in AI responses

### 📄 **Document Intelligence**

- **PDF** parsing and extraction
- **DOCX** (Word) document processing
- **XLSX/XLS** (Excel) spreadsheet parsing
- **Plain text** file support
- Smart token estimation for large files
- **DOCUMENT VIEWER WORKS WITHOUT AI**

### ⚡ **Smart Code Injection**

- Unified diff format parsing
- Intelligent patch application
- Context-aware code modifications
- `<magnus-diff>` custom format for precise edits
- Line-accurate change detection

### 🎨 **Rad Code Editor (Inspired by VS Code)**

- Fully rewritten in **gnarly JavaScript style**
- Inspired by VS Code's power, reimagined with surfer bro energy 🤙
- Syntax highlighting ready!
- Multi-cursor editing for maximum productivity
- Custom keyboard shortcuts (Ctrl+D == yes next word selection works)
- Thicc cursor for better visibility (because we care about your eyes, brah)
- Smooth line highlighting and selection
- Cyberpunk Retro vibe.. because.. its.. CYBERPUNK RETRO VIBE!!
- **EDITOR WORKS ON ITS OWN WITHOUT AI**

### 🚀 **Developer Experience**

- Auto-launches in Puppeteer browser window
- Real-time streaming responses
- File system integration
- Attachment management
- Health monitoring endpoints
- CORS-enabled API

---

## 🛠️ Installation

### Prerequisites

- **Node.js** v16.0.0 or higher
- **npm** or **yarn**
- **Ollama** (optional, if not using Gemini)
- **Google Gemini API Key** (optional, if not using Ollama)

### Quick Start

1. **Clone the repo** (or just grab the files, mate):

```bash
git clone https://github.com/yourusername/magnus.git
cd magnus
```

2. **Install dependencies**:

```bash
npm install
```

3. **Configure environment** (see below ⬇️)
4. **Fire it up**:

```bash
npm start
```

Magnus will auto-launch in a browser window at `http://localhost:6969` 🔥

---

## 🔧 Environment Configuration

Create a `.env` file in the root directory with the following configuration:

```env
# ========================================
# MEMORY CONFIGURATION
# ========================================
# Maximum number of messages to store in history
MAX_HISTORY=15

# Number of conversation turns to include in context
CONTEXT_TURNS=6

# ========================================
# WEB SEARCH APIs (Optional)
# ========================================
# Brave Search API Key
# Get yours at: https://brave.com/search/api/
BRAVE_API_KEY=

# Google Custom Search API Key
# Get yours at: https://developers.google.com/custom-search/v1/overview
GOOGLE_API_KEY=

# Google Custom Search Engine ID
# Create one at: https://programmablesearchengine.google.com/
GOOGLE_CX_ID=

# ========================================
# OLLAMA CONFIGURATION (Local LLM)
# ========================================
# Ollama server URL (default: http://localhost:11434)
OLLAMA_URL=http://localhost:11434

# Model name to use with Ollama
# Examples: llama2, codellama, mistral, phi, etc.
# Leave empty if using Gemini
MODEL=

# ========================================
# GEMINI CONFIGURATION (Cloud AI)
# ========================================
# Google Gemini API Key
# Get yours at: https://aistudio.google.com/app/apikey
# If set, Magnus will use Gemini instead of Ollama
GEMINI_API_KEY=
```

### Configuration Notes

#### **Using Gemini (Recommended)**

1. Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Set `GEMINI_API_KEY` in your `.env` file
3. Leave `MODEL` empty
4. Magnus will automatically use Gemini 2.5 Flash

#### **Using Ollama (Local)**

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull a model: `ollama pull llama2`
3. Set `MODEL=llama2` (or your preferred model)
4. Leave `GEMINI_API_KEY` empty
5. Make sure Ollama is running: `ollama serve`

#### **Web Search (Optional)**

- **Brave Search**: Best for general web searches, fast and privacy-focused
- **Google Custom Search**: More accurate but requires setup

You only need ONE search provider configured. If both are set, Magnus will prefer Brave.

#### **Memory Settings**

- `MAX_HISTORY`: Total messages stored in SQLite database
- `CONTEXT_TURNS`: How many recent conversation turns to include in AI context
- Higher values = more context but slower responses

---

## 🎯 Features Breakdown

### 1. **AI Chat Interface**

- Real-time streaming responses
- Markdown rendering
- Code syntax highlighting
- Attachment support
- Context-aware conversations

### 2. **File Management**

- Upload files via drag-and-drop
- Preview PDFs, DOCX directly
- Token count estimation
- Large file warnings (>80% context window)
- File deletion and management

### 3. **Smart Diff Application**

- Parse unified diff format
- Apply patches with context matching
- Reject/Apply individual changes
- "Go To Code" navigation
- "Insert at Cursor" functionality

### 5. **Health Monitoring**

- `/api/health` - System health check
- `/api/ollama-health` - AI backend status
- `/api/memory/status` - Memory system stats
- Real-time connection indicator in UI

---  

## 🚀 Usage Examples

### Starting Magnus

```bash
npm start
```

### Using with Gemini

```bash
# Set your API key
echo "GEMINI_API_KEY=your_api_key_here" >> .env

# Start Magnus
npm start
```

### Using with Ollama

```bash
# Pull a model
ollama pull codellama

# Configure .env
echo "MODEL=codellama" >> .env

# Start Ollama server
ollama serve

# In another terminal, start Magnus
npm start
```

### Uploading Documents

1. Click the attachment icon in the chat
2. Select your PDF, DOCX, or XLSX file
3. Magnus will parse and extract text
4. Ask questions about the document content

### Applying Code Changes

1. Ask Magnus to modify your code
2. Magnus generates a `<magnus-diff>` block
3. Review the changes in the UI
4. Click "Apply" to patch your file
5. Or click "Insert" to add at cursor position

---

## 🔥 Advanced Features

### Custom Diff Format

Magnus uses a custom `<magnus-diff>` format for precise code modifications:

```xml
<magnus-diff filepath="server.js">
--- a/server.js
+++ b/server.js
@@ -50,7 +50,7 @@
 const app = express();
-const PORT = 3000;
+const PORT = 6969;
 
 app.use(cors());
</magnus-diff>
```

### Memory Context Injection

Magnus automatically injects relevant context from previous conversations and attachments:

- Last N conversation turns (configurable)
- Referenced file contents
- Attachment metadata
- Previous code changes

### Token Management

- Automatic token estimation for uploaded files
- Warning when files exceed 80% of context window
- Smart truncation for large documents

---

## 🐛 Troubleshooting

### "Ollama's having a moment"

- Make sure Ollama is running: `ollama serve`
- Check if your model is pulled: `ollama list`
- Verify `OLLAMA_URL` in `.env`

### "Gemini Error: API key not valid"

- Double-check your `GEMINI_API_KEY` in `.env`
- Ensure no extra spaces or quotes
- Verify key is active at [Google AI Studio](https://aistudio.google.com/app/apikey)

### "Web search not configured"

- Set either `BRAVE_API_KEY` or both `GOOGLE_API_KEY` and `GOOGLE_CX_ID`
- Restart Magnus after updating `.env`

### File upload fails

- Check file size (~100MB)
- Ensure file type is supported (PDF, DOCX, XLSX, TXT)
- Check server logs for parsing errors

### Diff application fails

- Ensure file content matches the diff context
- Check line numbers in `@@ -X,Y +A,B @@` header

---

## 🤝 Contributing

Magnus is built by surfer bros for developers. If you wanna contribute:

1. Fork the repo
2. Create a feature branch
3. Make your changes (keep it gnarly!)
4. Test thoroughly
5. Submit a PR

**Code Style**: Use cheeky variable names, sarcastic comments, and surfer slang. It's tradition, brah! 🤙

---

## 📜 License

ISC License - Do whatever the fuck you want with it, mate!

---

## 🙏 Credits

Built with love (and a lotta caffeine) by **heavylildude and magnus**

Powered by:

- [Google Gemini](https://ai.google.dev/)
- [Ollama](https://ollama.ai)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Express.js](https://expressjs.com/)
- [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3)
- [Puppeteer](https://pptr.dev/)

---

## 🌊 Stay Gnarly!

Got questions? Found a bug? Wanna chat about the elegant backdoor solution?

Hit me up or open an issue. Let's make coding rad again! 🏄‍♂️

**Magnus out! 🤙**
