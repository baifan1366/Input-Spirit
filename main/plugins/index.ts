/**
 * Plugin Index
 * Exports all available plugins
 */

import { aiAssistantPlugin } from './aiAssistant';
import { promptEnhancerPlugin } from './promptEnhancer';
import { grammarCheckerPlugin } from './grammarChecker';
import { translatorPlugin } from './translator';
import { articleWriterPlugin } from './articleWriter';
import type { Plugin } from '../types';

/**
 * All available plugins
 */
export const builtInPlugins: Plugin[] = [
  aiAssistantPlugin,
  promptEnhancerPlugin,
  grammarCheckerPlugin,
  translatorPlugin,
  articleWriterPlugin,
];

/**
 * Get plugin by name
 */
export function getPluginByName(name: string): Plugin | undefined {
  return builtInPlugins.find(plugin => plugin.metadata.name === name);
}

/**
 * Get enabled plugins
 */
export function getEnabledPlugins(): Plugin[] {
  return builtInPlugins.filter(plugin => plugin.metadata.enabled);
}

export {
  aiAssistantPlugin,
  promptEnhancerPlugin,
  grammarCheckerPlugin,
  translatorPlugin,
  articleWriterPlugin,
};
