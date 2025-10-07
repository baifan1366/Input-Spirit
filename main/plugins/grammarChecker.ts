/**
 * Grammar Checker Plugin
 * Checks and fixes grammar using Chrome Proofreader API
 */

import type { Plugin, PluginContext, PluginResult } from '../types';

export const grammarCheckerPlugin: Plugin = {
  metadata: {
    name: 'grammar-checker',
    version: '1.0.0',
    description: 'Checks and corrects grammar, spelling, and punctuation',
    author: 'Input Spirit',
    enabled: true,
  },

  trigger: /^fix:\s*(.+)/i,

  async run(context: PluginContext): Promise<PluginResult> {
    const textToFix = context.params.$1?.trim();

    if (!textToFix) {
      throw new Error('No text provided to fix');
    }

    try {
      // Use Proofreader API
      const result = await context.ai.proofread(textToFix);

      const hasChanges = result.original !== result.corrected;

      let formattedContent = `✅ **Grammar Check Complete**\n\n`;
      
      if (hasChanges) {
        formattedContent += `**Original:**\n${result.original}\n\n`;
        formattedContent += `**Corrected:**\n${result.corrected}\n\n`;
        
        if (result.corrections.length > 0) {
          formattedContent += `**Corrections Made:**\n`;
          result.corrections.forEach((correction, index) => {
            formattedContent += `${index + 1}. ${correction.type}: "${correction.original}" → "${correction.suggestion}"\n`;
          });
        }
      } else {
        formattedContent += `No errors found! Your text looks good. ✨`;
      }

      return {
        content: result.corrected,
        formatted: formattedContent,
        actions: hasChanges ? ['insert', 'copy'] : ['copy'],
        metadata: {
          modelUsed: 'gemini-nano-proofreader',
          correctionsCount: result.corrections.length,
          hasChanges,
        },
      };
    } catch (error) {
      console.error('Grammar check error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to check grammar: ${errorMessage}`);
    }
  },
};
