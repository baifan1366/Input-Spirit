/**
 * Input Spirit - Core Type Definitions
 * Google Chrome Built-in AI Challenge 2025
 */

// ============================================
// Chrome Built-in AI Types
// ============================================

export interface ChromeAISession {
  prompt(input: string): Promise<string>;
  promptStreaming(input: string): Promise<ReadableStream>;
  destroy(): void;
}

export interface PromptAPIOptions {
  temperature?: number;
  topK?: number;
  systemPrompt?: string;
}

export interface ProofreadResult {
  original: string;
  corrected: string;
  corrections: Array<{
    type: 'grammar' | 'spelling' | 'punctuation';
    original: string;
    suggestion: string;
    position: number;
  }>;
}

export interface TranslateOptions {
  sourceLanguage: string;
  targetLanguage: string;
}

export interface ChromeAI {
  // Prompt API (multimodal)
  createTextSession(options?: PromptAPIOptions): Promise<ChromeAISession>;
  
  // Proofreader API
  proofread(text: string): Promise<ProofreadResult>;
  
  // Writer API
  write(prompt: string, options?: PromptAPIOptions): Promise<string>;
  
  // Rewriter API
  rewrite(text: string, tone?: 'formal' | 'casual' | 'professional'): Promise<string>;
  
  // Translator API
  translate(text: string, options: TranslateOptions): Promise<string>;
  
  // Summarizer API
  summarize(text: string, format?: 'paragraph' | 'bullets'): Promise<string>;
}

// ============================================
// Plugin System Types
// ============================================

export interface PluginContext {
  /** User input text */
  input: string;
  
  /** Parsed parameters from trigger */
  params: Record<string, any>;
  
  /** Chrome AI APIs */
  ai: ChromeAI;
  
  /** Abort signal for cancellation */
  abort: AbortSignal;
  
  /** Application context where input was detected */
  appContext?: {
    appName: string;
    windowTitle: string;
  };
}

export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  enabled?: boolean;
}

export interface Plugin {
  /** Plugin metadata */
  metadata: PluginMetadata;
  
  /** Trigger pattern or function */
  trigger: RegExp | ((input: string) => boolean);
  
  /** Main execution function */
  run: (context: PluginContext) => Promise<PluginResult>;
  
  /** Timeout in milliseconds (default: 8000) */
  timeout?: number;
  
  /** Optional initialization function */
  init?: () => Promise<void>;
  
  /** Optional cleanup function */
  destroy?: () => Promise<void>;
}

export interface PluginResult {
  /** Result content */
  content: string;
  
  /** Optional formatted content */
  formatted?: string;
  
  /** Available actions for this result */
  actions?: Array<'insert' | 'copy' | 'regenerate' | 'edit'>;
  
  /** Metadata about the result */
  metadata?: {
    processingTime?: number;
    modelUsed?: string;
    [key: string]: any;
  };
}

// ============================================
// Input Monitor Types
// ============================================

export interface InputEvent {
  /** Input text */
  text: string;
  
  /** Timestamp */
  timestamp: number;
  
  /** Cursor position */
  cursorPosition?: { x: number; y: number };
  
  /** Active window info */
  windowInfo?: {
    title: string;
    processName: string;
  };
}

export interface TriggerMatch {
  /** Matched trigger pattern */
  pattern: string;
  
  /** Plugin name */
  pluginName: string;
  
  /** Extracted parameters */
  params: Record<string, any>;
  
  /** Full input text */
  input: string;
}

// ============================================
// Workflow Types
// ============================================

export interface WorkflowStep {
  /** Step ID */
  id: string;
  
  /** Plugin to execute */
  plugin: string;
  
  /** Input for this step (can reference previous steps) */
  input: string | ((context: WorkflowContext) => string);
  
  /** Condition to execute this step */
  condition?: (context: WorkflowContext) => boolean;
  
  /** Error handling strategy */
  onError?: 'stop' | 'continue' | 'retry';
  
  /** Max retry attempts */
  retries?: number;
}

export interface WorkflowContext {
  /** Initial input */
  initialInput: string;
  
  /** Results from previous steps */
  results: Map<string, PluginResult>;
  
  /** Shared data between steps */
  shared: Record<string, any>;
}

export interface Workflow {
  /** Workflow ID */
  id: string;
  
  /** Workflow name */
  name: string;
  
  /** Workflow description */
  description: string;
  
  /** Trigger pattern */
  trigger: RegExp | string;
  
  /** Workflow steps */
  steps: WorkflowStep[];
  
  /** Timeout for entire workflow */
  timeout?: number;
}

// ============================================
// Configuration Types
// ============================================

export interface AppConfig {
  /** General settings */
  general: {
    autoStart: boolean;
    showTrayIcon: boolean;
    language: string;
    theme: 'light' | 'dark' | 'system';
  };
  
  /** Input monitoring settings */
  inputMonitor: {
    enabled: boolean;
    debounceMs: number;
    excludeApps: string[];
    excludePasswordFields: boolean;
  };
  
  /** AI settings */
  ai: {
    defaultModel: string;
    temperature: number;
    maxTokens: number;
    streamResponse: boolean;
  };
  
  /** Plugin settings */
  plugins: {
    enabled: string[];
    config: Record<string, any>;
  };
  
  /** Overlay settings */
  overlay: {
    position: 'cursor' | 'center' | 'topRight' | 'bottomRight';
    opacity: number;
    autoHideDelay: number;
  };
  
  /** Keyboard shortcuts */
  shortcuts: {
    toggleOverlay: string;
    quickAction: string;
    showSettings: string;
  };
}

// ============================================
// IPC Communication Types
// ============================================

export type IPCChannel = 
  | 'show-overlay'
  | 'hide-overlay'
  | 'ai-request'
  | 'ai-response'
  | 'plugin-execute'
  | 'config-update'
  | 'config-get'
  | 'system-info';

export interface IPCMessage<T = any> {
  channel: IPCChannel;
  data: T;
  requestId?: string;
}

// ============================================
// Overlay UI Types
// ============================================

export interface OverlayState {
  visible: boolean;
  content: string;
  actions: Array<{
    id: string;
    label: string;
    icon?: string;
    onClick: () => void;
  }>;
  position?: { x: number; y: number };
  loading?: boolean;
  error?: string;
}

// ============================================
// MCP (Model Context Protocol) Types
// ============================================

export interface MCPContext {
  activeWindow: string;
  recentInputs: string[];
  clipboardHistory: string[];
  userPreferences: Record<string, any>;
}

export interface MCPEndpoint {
  path: string;
  method: 'GET' | 'POST';
  handler: (request: any) => Promise<any>;
}
