/**
 * Chrome Built-in AI Adapter
 * Integrates Chrome's Gemini Nano APIs with Electron
 */

import { BrowserView, BrowserWindow } from 'electron';
import type { ChromeAI, ChromeAISession, PromptAPIOptions, ProofreadResult, TranslateOptions } from '../types';

/**
 * Chrome AI Adapter Class
 * Uses a hidden BrowserView to access Chrome's Built-in AI APIs
 */
export class ChromeAIAdapter implements ChromeAI {
  private aiView: BrowserView | null = null;
  private parentWindow: BrowserWindow | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {}

  /**
   * Initialize the Chrome AI adapter
   * Creates a hidden BrowserView with Chrome AI capabilities
   */
  async initialize(parentWindow: BrowserWindow): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize(parentWindow);
    return this.initPromise;
  }

  private async _initialize(parentWindow: BrowserWindow): Promise<void> {
    if (this.initialized) return;

    this.parentWindow = parentWindow;

    // Create a BrowserView with experimental AI features enabled
    this.aiView = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        // @ts-ignore - experimental feature
        enableBlinkFeatures: 'PromptAPI,AIPrompt',
      },
    });

    // Hide the view (we only use it for AI API access)
    this.aiView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    parentWindow.addBrowserView(this.aiView);

    // Load a minimal HTML page
    await this.aiView.webContents.loadURL('data:text/html,<html><body></body></html>');

    // Wait for page to be ready
    await new Promise<void>((resolve) => {
      this.aiView!.webContents.once('did-finish-load', () => resolve());
    });

    // Check if AI APIs are available
    const available = await this.checkAIAvailability();
    if (!available) {
      console.warn('⚠️ Chrome Built-in AI APIs not available. Please use Chrome Canary/Dev with AI features enabled.');
    }

    this.initialized = true;
    console.log('✅ Chrome AI Adapter initialized');
  }

  /**
   * Check if Chrome AI APIs are available
   */
  private async checkAIAvailability(): Promise<boolean> {
    try {
      const result = await this.aiView!.webContents.executeJavaScript(`
        (async () => {
          return typeof window.ai !== 'undefined';
        })()
      `);
      return result;
    } catch (error) {
      console.error('Error checking AI availability:', error);
      return false;
    }
  }

  /**
   * Create a text session using Prompt API
   */
  async createTextSession(options?: PromptAPIOptions): Promise<ChromeAISession> {
    this.ensureInitialized();

    const sessionId = Math.random().toString(36).substring(7);

    // Create session in the AI view
    await this.aiView!.webContents.executeJavaScript(`
      (async () => {
        if (!window.ai?.languageModel) {
          throw new Error('Prompt API not available');
        }
        
        window['aiSession_${sessionId}'] = await window.ai.languageModel.create({
          temperature: ${options?.temperature ?? 0.7},
          topK: ${options?.topK ?? 40},
          systemPrompt: ${JSON.stringify(options?.systemPrompt ?? '')}
        });
      })()
    `);

    // Return session interface
    return {
      prompt: async (input: string) => {
        const result = await this.aiView!.webContents.executeJavaScript(`
          (async () => {
            const session = window['aiSession_${sessionId}'];
            if (!session) throw new Error('Session not found');
            return await session.prompt(${JSON.stringify(input)});
          })()
        `);
        return result;
      },

      promptStreaming: async (input: string) => {
        // Get full response first
        const fullResponse = await this.aiView!.webContents.executeJavaScript(`
          (async () => {
            const session = window['aiSession_${sessionId}'];
            if (!session) throw new Error('Session not found');
            return await session.prompt(${JSON.stringify(input)});
          })()
        `);
        
        // Create a custom ReadableStream that simulates streaming
        const stream = new ReadableStream({
          async start(controller) {
            try {
              // Simulate streaming by chunking the response
              const words = fullResponse.split(' ');
              for (const word of words) {
                controller.enqueue(word + ' ');
                await new Promise(resolve => setTimeout(resolve, 50));
              }
              
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          },
        });
        
        return stream;
      },

      destroy: async () => {
        await this.aiView!.webContents.executeJavaScript(`
          (async () => {
            const session = window['aiSession_${sessionId}'];
            if (session?.destroy) session.destroy();
            delete window['aiSession_${sessionId}'];
          })()
        `);
      },
    };
  }

  /**
   * Proofread text using Proofreader API
   */
  async proofread(text: string): Promise<ProofreadResult> {
    this.ensureInitialized();

    try {
      // Note: Actual Proofreader API might have different interface
      // This is a placeholder implementation using Prompt API
      const session = await this.createTextSession({
        systemPrompt: 'You are a grammar and spelling checker. Return only the corrected text.',
      });

      const corrected = await session.prompt(
        `Correct any grammar, spelling, or punctuation errors in the following text:\n\n${text}`
      );

      await session.destroy();

      return {
        original: text,
        corrected: corrected.trim(),
        corrections: [], // TODO: Parse detailed corrections
      };
    } catch (error) {
      console.error('Proofreading error:', error);
      throw error;
    }
  }

  /**
   * Write content using Writer API
   */
  async write(prompt: string, options?: PromptAPIOptions): Promise<string> {
    this.ensureInitialized();

    const session = await this.createTextSession({
      ...options,
      systemPrompt: options?.systemPrompt ?? 'You are a helpful writing assistant.',
    });

    try {
      const result = await session.prompt(prompt);
      return result;
    } finally {
      await session.destroy();
    }
  }

  /**
   * Rewrite text with different tone
   */
  async rewrite(text: string, tone: 'formal' | 'casual' | 'professional' = 'professional'): Promise<string> {
    this.ensureInitialized();

    const tonePrompts = {
      formal: 'Rewrite the following text in a formal tone:',
      casual: 'Rewrite the following text in a casual, friendly tone:',
      professional: 'Rewrite the following text in a professional business tone:',
    };

    const session = await this.createTextSession();

    try {
      const result = await session.prompt(`${tonePrompts[tone]}\n\n${text}`);
      return result;
    } finally {
      await session.destroy();
    }
  }

  /**
   * Translate text
   */
  async translate(text: string, options: TranslateOptions): Promise<string> {
    this.ensureInitialized();

    const session = await this.createTextSession();

    try {
      const result = await session.prompt(
        `Translate the following text from ${options.sourceLanguage} to ${options.targetLanguage}:\n\n${text}`
      );
      return result;
    } finally {
      await session.destroy();
    }
  }

  /**
   * Summarize text
   */
  async summarize(text: string, format: 'paragraph' | 'bullets' = 'paragraph'): Promise<string> {
    this.ensureInitialized();

    const formatPrompts = {
      paragraph: 'Summarize the following text in a concise paragraph:',
      bullets: 'Summarize the following text as bullet points:',
    };

    const session = await this.createTextSession();

    try {
      const result = await session.prompt(`${formatPrompts[format]}\n\n${text}`);
      return result;
    } finally {
      await session.destroy();
    }
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    if (this.aiView) {
      this.parentWindow?.removeBrowserView(this.aiView);
      // @ts-ignore
      this.aiView.webContents.destroy();
      this.aiView = null;
    }
    this.initialized = false;
    this.initPromise = null;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('ChromeAIAdapter not initialized. Call initialize() first.');
    }
  }
}

/**
 * Singleton instance
 */
let chromeAIInstance: ChromeAIAdapter | null = null;

/**
 * Get or create ChromeAI instance
 */
export function getChromeAI(): ChromeAIAdapter {
  if (!chromeAIInstance) {
    chromeAIInstance = new ChromeAIAdapter();
  }
  return chromeAIInstance;
}

/**
 * Destroy ChromeAI instance
 */
export async function destroyChromeAI(): Promise<void> {
  if (chromeAIInstance) {
    await chromeAIInstance.destroy();
    chromeAIInstance = null;
  }
}
