/**
 * AI Assistant Plugin
 * General purpose AI assistant using Chrome Prompt API
 */

import type { Plugin, PluginContext, PluginResult } from '../types';

export const aiAssistantPlugin: Plugin = {
  metadata: {
    name: 'ai-assistant',
    version: '1.0.0',
    description: 'General purpose AI assistant for any query',
    author: 'Input Spirit',
    enabled: true,
  },

  // Matches: ai: <query>
  trigger: /^ai:\s*(.+)/i,

  async run(context: PluginContext): Promise<PluginResult> {
    const query = context.params.$1?.trim();

    if (!query) {
      throw new Error('No query provided');
    }

    try {
      // Create AI session
      const session = await context.ai.createTextSession({
        systemPrompt: 'You are a helpful AI assistant. Provide clear, concise, and accurate answers.',
        temperature: 0.7,
      });

      const response = await session.prompt(query);

      await session.destroy();

      return {
        content: response,
        formatted: `🤖 **AI Response:**\n\n${response}`,
        actions: ['copy', 'insert', 'regenerate'],
        metadata: {
          modelUsed: 'gemini-nano',
          query,
        },
      };
    } catch (error) {
      console.error('AI assistant error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get AI response: ${errorMessage}`);
    }
  },
};
