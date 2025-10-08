/**
 * Chrome Built-in AI Client (Browser-side)
 * Uses Chrome's window.ai APIs directly in the browser
 */

// Type definitions for Chrome AI APIs
interface AILanguageModel {
  prompt(input: string): Promise<string>;
  promptStreaming(input: string): ReadableStream;
}

interface AILanguageModelFactory {
  create(options?: {
    systemPrompt?: string;
    temperature?: number;
    topK?: number;
  }): Promise<AILanguageModel>;
  capabilities(): Promise<{
    available: 'readily' | 'after-download' | 'no';
    defaultTemperature?: number;
    defaultTopK?: number;
    maxTopK?: number;
  }>;
}

declare global {
  interface Window {
    ai?: {
      languageModel: AILanguageModelFactory;
    };
  }
}

export interface ChromeAIOptions {
  systemPrompt?: string;
  temperature?: number;
  topK?: number;
}

export class ChromeAIClient {
  private session: AILanguageModel | null = null;

  /**
   * Check if Chrome AI is available
   */
  static async isAvailable(): Promise<boolean> {
    console.log('🔍 [Chrome AI] Checking availability...');
    
    if (typeof window === 'undefined') {
      console.log('❌ [Chrome AI] Window is undefined (SSR)');
      return false;
    }
    
    console.log('🔍 [Chrome AI] window.ai:', window.ai);
    console.log('🔍 [Chrome AI] window.ai?.languageModel:', window.ai?.languageModel);
    
    if (!window.ai?.languageModel) {
      console.log('❌ [Chrome AI] window.ai.languageModel not found');
      console.log('💡 [Chrome AI] User Agent:', navigator.userAgent);
      console.log('💡 [Chrome AI] Chrome version:', /Chrome\/(\d+)/.exec(navigator.userAgent)?.[1]);
      return false;
    }

    try {
      const capabilities = await window.ai.languageModel.capabilities();
      console.log('✅ [Chrome AI] Capabilities:', capabilities);
      const available = capabilities.available !== 'no';
      console.log(available ? '✅ [Chrome AI] Available!' : '❌ [Chrome AI] Not available');
      return available;
    } catch (error) {
      console.error('❌ [Chrome AI] Error checking availability:', error);
      return false;
    }
  }

  /**
   * Get Chrome AI capabilities
   */
  static async getCapabilities() {
    if (!window.ai?.languageModel) {
      throw new Error('Chrome AI not available');
    }
    return await window.ai.languageModel.capabilities();
  }

  /**
   * Create a new AI session
   */
  async createSession(options?: ChromeAIOptions): Promise<void> {
    if (!window.ai?.languageModel) {
      throw new Error('Chrome AI not available. Please use Chrome Canary/Dev with AI features enabled.');
    }

    try {
      this.session = await window.ai.languageModel.create({
        systemPrompt: options?.systemPrompt,
        temperature: options?.temperature ?? 0.7,
        topK: options?.topK ?? 40,
      });
    } catch (error) {
      console.error('Failed to create Chrome AI session:', error);
      throw new Error('Failed to initialize Chrome AI session');
    }
  }

  /**
   * Send a prompt to the AI
   */
  async prompt(input: string): Promise<string> {
    if (!this.session) {
      throw new Error('No active AI session. Call createSession() first.');
    }

    try {
      const response = await this.session.prompt(input);
      return response;
    } catch (error) {
      console.error('Chrome AI prompt error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  /**
   * Send a prompt and get streaming response
   */
  async promptStreaming(input: string): Promise<ReadableStream> {
    if (!this.session) {
      throw new Error('No active AI session. Call createSession() first.');
    }

    try {
      return this.session.promptStreaming(input);
    } catch (error) {
      console.error('Chrome AI streaming error:', error);
      throw new Error('Failed to get AI streaming response');
    }
  }

  /**
   * Destroy the session
   */
  destroy(): void {
    this.session = null;
  }
}

/**
 * Simple helper function to execute a one-off AI prompt
 */
export async function executeAIPrompt(
  input: string,
  options?: ChromeAIOptions
): Promise<string> {
  const client = new ChromeAIClient();
  await client.createSession(options);
  const response = await client.prompt(input);
  client.destroy();
  return response;
}
