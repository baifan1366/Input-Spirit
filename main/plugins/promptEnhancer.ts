/**
 * Prompt Enhancer Plugin
 * Enhances user prompts using Chrome Prompt API
 */

import type { Plugin, PluginContext, PluginResult } from '../types';

export const promptEnhancerPlugin: Plugin = {
  metadata: {
    name: 'prompt-enhancer',
    version: '1.0.0',
    description: 'Enhances and optimizes user prompts for better AI responses',
    author: 'Input Spirit',
    enabled: true,
  },

  trigger: /^prompt:\s*(.+)/i,

  async run(context: PluginContext): Promise<PluginResult> {
    const userPrompt = context.params.$1?.trim();

    if (!userPrompt) {
      throw new Error('No prompt provided');
    }

    try {
      // Create AI session for prompt enhancement
      const session = await context.ai.createTextSession({
        systemPrompt: `You are an expert at crafting effective AI prompts. 
Your task is to enhance user prompts to be more specific, clear, and effective.
Return only the enhanced prompt without explanations.`,
        temperature: 0.7,
      });

      const enhancedPrompt = await session.prompt(
        `Enhance this prompt to be more specific and effective:\n\n"${userPrompt}"`
      );

      await session.destroy();

      return {
        content: enhancedPrompt.trim(),
        formatted: `📝 **Enhanced Prompt:**\n\n${enhancedPrompt.trim()}`,
        actions: ['copy', 'insert', 'regenerate'],
        metadata: {
          modelUsed: 'gemini-nano',
          originalPrompt: userPrompt,
        },
      };
    } catch (error) {
      console.error('Prompt enhancement error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to enhance prompt: ${errorMessage}`);
    }
  },
};
