/**
 * Article Writer Plugin
 * Generates articles and long-form content using Chrome Writer API
 */

import type { Plugin, PluginContext, PluginResult } from '../types';

export const articleWriterPlugin: Plugin = {
  metadata: {
    name: 'article-writer',
    version: '1.0.0',
    description: 'Generates articles, blog posts, and long-form content',
    author: 'Input Spirit',
    enabled: true,
  },

  // Matches: write: <topic> or article: <topic>
  trigger: /^(?:write|article):\s*(.+)/i,

  async run(context: PluginContext): Promise<PluginResult> {
    const topic = context.params.$1?.trim();

    if (!topic) {
      throw new Error('No topic provided');
    }

    try {
      // Use Writer API
      const article = await context.ai.write(
        `Write a well-structured, informative article about: ${topic}. 
        Include an introduction, main points with details, and a conclusion.`,
        {
          temperature: 0.8,
        }
      );

      const formattedContent = `📝 **Generated Article**\n\n${article}`;

      return {
        content: article,
        formatted: formattedContent,
        actions: ['insert', 'copy', 'regenerate', 'edit'],
        metadata: {
          modelUsed: 'gemini-nano-writer',
          topic,
          wordCount: article.split(/\s+/).length,
        },
      };
    } catch (error) {
      console.error('Article writing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to write article: ${errorMessage}`);
    }
  },
};
