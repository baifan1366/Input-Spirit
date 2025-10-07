# Input Spirit - Technology Stack Documentation

## Core Technologies

### 1. Electron (Desktop Framework)
**Purpose**: Cross-platform desktop application framework
- **Main Process**: Application lifecycle, system integration
- **Renderer Process**: UI layer (React + Tailwind)
- **Key APIs**:
  - `app` - Application event lifecycle control
  - `BrowserWindow` - Window management and overlay UI
  - IPC (Inter-Process Communication)

**Critical Electron APIs for Input Spirit**:
```javascript
const { app, BrowserWindow } = require('electron')

// Application lifecycle events
app.on('ready', () => {})
app.on('window-all-closed', () => {})
app.on('activate', () => {})

// Window management for overlay
const overlay = new BrowserWindow({
  transparent: true,
  frame: false,
  alwaysOnTop: true
})
```

### 2. Chrome Web AI APIs (Google Built-in AI)

#### 💭 Prompt API (PRIMARY)
- **Multimodal support**: Text, Image, Audio input
- **Use cases**: 
  - Structured prompt generation
  - Context-aware AI responses
  - Dynamic content generation
- **Implementation**: Available in both Web and Chrome Extensions

#### 🔤 Proofreader API
- Grammar and spelling correction
- Real-time text polishing

#### 📄 Summarizer API
- Text condensation
- Key points extraction

#### 🌐 Translator API
- Multi-language support
- Auto-detection and translation

#### ✏️ Writer API
- Original content generation
- Article/email composition

#### 🖊️ Rewriter API
- Content improvement
- Tone/style adjustment

**Benefits**:
- **Offline-first**: Works without internet (Gemini Nano)
- **Privacy**: All processing on-device
- **Zero cost**: No API quotas or server fees
- **Low latency**: Local model execution

### 3. Global Input Monitoring
**Library**: iohook (or similar)
- Cross-platform keyboard/mouse event monitoring
- Non-invasive background listening
- Trigger detection (e.g., "ai:", "prompt:", "translate:")

### 4. MCP (Model Context Protocol)
**Purpose**: Cross-tool context sharing
- Expose Input Spirit context to:
  - Claude Desktop
  - Cursor
  - VSCode
  - Other MCP-compatible tools
- **Use cases**:
  - Share last user input
  - Share AI responses
  - Enable workflow continuity across tools

### 5. Plugin System Architecture
**Design**: Extensible, sandboxed plugin execution

#### Plugin API TypeScript Interface:
```typescript
export interface PluginContext<TIn = unknown> {
  input: string;
  data?: TIn;
  ai: { 
    generate: (text: string, opts?: { 
      model?: string; 
      temperature?: number 
    }) => Promise<string> 
  };
  workflow: { 
    next: (data?: unknown) => void; 
    abort: (reason?: string) => void 
  };
  mcp: { share: (data: unknown) => void };
  logger: { 
    info: (msg: string) => void; 
    warn: (msg: string) => void; 
    error: (e: unknown, meta?: Record<string, unknown>) => void 
  };
  signal: AbortSignal;
  metadata?: { 
    locale?: string; 
    app?: string; 
    url?: string | null 
  };
}

export interface Plugin<TIn = unknown, TOut = unknown> {
  name: string;
  description?: string;
  trigger: RegExp | ((input: string) => boolean);
  timeoutMs?: number;
  run: (ctx: PluginContext<TIn>) => Promise<TOut>;
  onAbort?: (reason?: string) => void;
}
```

### 6. Workflow Engine
**Purpose**: Chain multiple plugins in sequence
- JSON-based workflow definitions
- Error handling (stop/continue)
- Context passing between steps

Example workflow:
```json
{
  "name": "write-and-polish",
  "steps": [
    { "use": "prompt-enhancer" },
    { "use": "grammar-checker" },
    { "use": "article-writer", "with": { "tone": "friendly" } }
  ],
  "onError": "stop"
}
```

### 7. Frontend Stack
- **Framework**: React
- **Styling**: Tailwind CSS
- **UI Components**: Modern component library (consider shadcn/ui)
- **Icons**: Lucide icons
- **Features**:
  - Floating overlay UI
  - Toast notifications
  - Plugin management panel
  - Workflow visual editor

### 8. Configuration System
**Format**: JSON configuration file
```json
{
  "triggerPrefixes": ["ai:", "prompt:", "translate:", "fix:"],
  "hotkeys": { 
    "toggleOverlay": "Ctrl+Shift+Space", 
    "insert": "Ctrl+Enter" 
  },
  "privacy": { 
    "offlineOnly": false, 
    "cloudSync": false, 
    "redact": ["password", "api_key"] 
  },
  "ai": { 
    "provider": "web-ai", 
    "model": "gemini-nano" 
  },
  "workflowDefault": "write-and-polish",
  "plugins": [],
  "mcp": { 
    "enabled": true, 
    "expose": ["last-input", "last-response"] 
  }
}
```

## System Requirements
- **Node.js**: 18+
- **OS**: Windows 10+ / macOS 12+
- **Package Manager**: pnpm (recommended) or npm
- **Optional**: Internet (for online models)

## Development Tools
- TypeScript for type safety
- ESLint + Prettier for code quality
- Electron Builder for packaging
- Hot reload for development

## Optional Integrations
- **Supabase**: Plugin marketplace, config sync
- **Firebase AI Logic**: Hybrid AI strategy (mobile reach)
- **Gemini Developer API**: Fallback for unsupported devices

## Privacy & Security
- **Offline-first design**: Default to local processing
- **Sensitive data filtering**: Configurable redaction patterns
- **No telemetry**: User data stays on device
- **Open source**: Transparent, auditable code
