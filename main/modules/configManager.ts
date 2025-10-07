/**
 * Configuration Manager
 * Manages application configuration with persistence
 * Supports both local storage (electron-store) and cloud sync (Supabase)
 * 
 * NOTE: This will be migrated to use StorageManager for Supabase integration
 */

import Store from 'electron-store';
import type { AppConfig } from '../types';

/**
 * Default configuration
 */
const defaultConfig: AppConfig = {
  general: {
    autoStart: false,
    showTrayIcon: true,
    language: 'en',
    theme: 'system',
  },
  inputMonitor: {
    enabled: true,
    debounceMs: 300,
    excludeApps: ['1password', 'keepass', 'bitwarden'],
    excludePasswordFields: true,
  },
  ai: {
    defaultModel: 'gemini-nano',
    temperature: 0.7,
    maxTokens: 2048,
    streamResponse: false,
  },
  plugins: {
    enabled: [
      'ai-assistant',
      'prompt-enhancer',
      'grammar-checker',
      'translator',
      'article-writer',
    ],
    config: {},
  },
  overlay: {
    position: 'cursor',
    opacity: 0.95,
    autoHideDelay: 10000,
  },
  shortcuts: {
    toggleOverlay: 'CommandOrControl+Shift+Space',
    quickAction: 'CommandOrControl+Shift+A',
    showSettings: 'CommandOrControl+Shift+,',
  },
};

/**
 * Configuration Manager Class
 */
export class ConfigManager {
  private store: Store<AppConfig>;

  constructor() {
    this.store = new Store<AppConfig>({
      name: 'input-spirit-config',
      defaults: defaultConfig,
      schema: this.getConfigSchema() as any,
    });

    console.log('📝 Config loaded from:', (this.store as any).path);
  }

  /**
   * Get entire configuration
   */
  getConfig(): AppConfig {
    return (this.store as any).store;
  }

  /**
   * Get configuration value by key path
   */
  get<K extends keyof AppConfig>(key: K): AppConfig[K];
  get(keyPath: string): any;
  get(keyPath: any): any {
    return (this.store as any).get(keyPath);
  }

  /**
   * Set configuration value by key path
   */
  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void;
  set(keyPath: string, value: any): void;
  set(keyPath: any, value: any): void {
    (this.store as any).set(keyPath, value);
    console.log(`⚙️  Config updated: ${keyPath}`);
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    (this.store as any).clear();
    console.log('🔄 Config reset to defaults');
  }

  /**
   * Check if plugin is enabled
   */
  isPluginEnabled(pluginName: string): boolean {
    const enabledPlugins = this.get('plugins.enabled');
    return enabledPlugins.includes(pluginName);
  }

  /**
   * Enable/disable plugin
   */
  setPluginEnabled(pluginName: string, enabled: boolean): void {
    const enabledPlugins = this.get('plugins.enabled');
    
    if (enabled && !enabledPlugins.includes(pluginName)) {
      enabledPlugins.push(pluginName);
    } else if (!enabled) {
      const index = enabledPlugins.indexOf(pluginName);
      if (index > -1) {
        enabledPlugins.splice(index, 1);
      }
    }

    this.set('plugins.enabled', enabledPlugins);
  }

  /**
   * Get plugin configuration
   */
  getPluginConfig(pluginName: string): any {
    const pluginConfigs = this.get('plugins.config');
    return pluginConfigs[pluginName] || {};
  }

  /**
   * Set plugin configuration
   */
  setPluginConfig(pluginName: string, config: any): void {
    const pluginConfigs = this.get('plugins.config');
    pluginConfigs[pluginName] = config;
    this.set('plugins.config', pluginConfigs);
  }

  /**
   * Watch for configuration changes
   */
  onDidChange<K extends keyof AppConfig>(
    key: K,
    callback: (newValue: AppConfig[K], oldValue: AppConfig[K]) => void
  ): void {
    (this.store as any).onDidChange(key, callback);
  }

  /**
   * Get configuration file path
   */
  getConfigPath(): string {
    return (this.store as any).path;
  }

  /**
   * Get configuration schema for validation
   */
  private getConfigSchema(): any {
    return {
      general: {
        type: 'object',
        properties: {
          autoStart: { type: 'boolean' },
          showTrayIcon: { type: 'boolean' },
          language: { type: 'string' },
          theme: { type: 'string', enum: ['light', 'dark', 'system'] },
        },
      },
      inputMonitor: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          debounceMs: { type: 'number', minimum: 0 },
          excludeApps: { type: 'array', items: { type: 'string' } },
          excludePasswordFields: { type: 'boolean' },
        },
      },
      ai: {
        type: 'object',
        properties: {
          defaultModel: { type: 'string' },
          temperature: { type: 'number', minimum: 0, maximum: 2 },
          maxTokens: { type: 'number', minimum: 1 },
          streamResponse: { type: 'boolean' },
        },
      },
      plugins: {
        type: 'object',
        properties: {
          enabled: { type: 'array', items: { type: 'string' } },
          config: { type: 'object' },
        },
      },
      overlay: {
        type: 'object',
        properties: {
          position: { type: 'string', enum: ['cursor', 'center', 'topRight', 'bottomRight'] },
          opacity: { type: 'number', minimum: 0, maximum: 1 },
          autoHideDelay: { type: 'number', minimum: 0 },
        },
      },
      shortcuts: {
        type: 'object',
        properties: {
          toggleOverlay: { type: 'string' },
          quickAction: { type: 'string' },
          showSettings: { type: 'string' },
        },
      },
    };
  }
}

/**
 * Singleton instance
 */
let configManagerInstance: ConfigManager | null = null;

/**
 * Get or create ConfigManager instance
 */
export function getConfigManager(): ConfigManager {
  if (!configManagerInstance) {
    configManagerInstance = new ConfigManager();
  }
  return configManagerInstance;
}
