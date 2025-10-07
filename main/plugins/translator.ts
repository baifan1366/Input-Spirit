/**
 * Translator Plugin
 * Translates text between languages using Chrome Translator API
 */

import type { Plugin, PluginContext, PluginResult } from '../types';

// Language codes mapping
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  zh: 'Chinese',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  ko: 'Korean',
  ru: 'Russian',
  ar: 'Arabic',
  pt: 'Portuguese',
  it: 'Italian',
  hi: 'Hindi',
};

export const translatorPlugin: Plugin = {
  metadata: {
    name: 'translator',
    version: '1.0.0',
    description: 'Translates text between multiple languages',
    author: 'Input Spirit',
    enabled: true,
  },

  // Matches: translate: zh->en Hello / translate: en->zh 你好
  trigger: /^translate:\s*(\w+)\s*->\s*(\w+)\s+(.+)/i,

  async run(context: PluginContext): Promise<PluginResult> {
    const sourceLanguage = context.params.$1?.toLowerCase();
    const targetLanguage = context.params.$2?.toLowerCase();
    const textToTranslate = context.params.$3?.trim();

    if (!sourceLanguage || !targetLanguage || !textToTranslate) {
      throw new Error('Invalid translation format. Use: translate: zh->en <text>');
    }

    try {
      // Use Translator API
      const translated = await context.ai.translate(textToTranslate, {
        sourceLanguage,
        targetLanguage,
      });

      const sourceLangName = LANGUAGE_NAMES[sourceLanguage] || sourceLanguage.toUpperCase();
      const targetLangName = LANGUAGE_NAMES[targetLanguage] || targetLanguage.toUpperCase();

      const formattedContent = `🌐 **Translation**\n\n` +
        `**From ${sourceLangName}:**\n${textToTranslate}\n\n` +
        `**To ${targetLangName}:**\n${translated}`;

      return {
        content: translated,
        formatted: formattedContent,
        actions: ['insert', 'copy', 'regenerate'],
        metadata: {
          modelUsed: 'gemini-nano-translator',
          sourceLanguage: sourceLangName,
          targetLanguage: targetLangName,
        },
      };
    } catch (error) {
      console.error('Translation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to translate: ${errorMessage}`);
    }
  },
};
