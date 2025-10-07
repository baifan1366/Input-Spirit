"use strict";
/**
 * Configuration Manager
 * Manages application configuration with persistence
 * Supports both local storage (electron-store) and cloud sync (Supabase)
 *
 * NOTE: This will be migrated to use StorageManager for Supabase integration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
exports.getConfigManager = getConfigManager;
const electron_store_1 = __importDefault(require("electron-store"));
/**
 * Default configuration
 */
const defaultConfig = {
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
class ConfigManager {
    constructor() {
        this.store = new electron_store_1.default({
            name: 'input-spirit-config',
            defaults: defaultConfig,
            schema: this.getConfigSchema(),
        });
        console.log('📝 Config loaded from:', this.store.path);
    }
    /**
     * Get entire configuration
     */
    getConfig() {
        return this.store.store;
    }
    get(keyPath) {
        return this.store.get(keyPath);
    }
    set(keyPath, value) {
        this.store.set(keyPath, value);
        console.log(`⚙️  Config updated: ${keyPath}`);
    }
    /**
     * Reset configuration to defaults
     */
    reset() {
        this.store.clear();
        console.log('🔄 Config reset to defaults');
    }
    /**
     * Check if plugin is enabled
     */
    isPluginEnabled(pluginName) {
        const enabledPlugins = this.get('plugins.enabled');
        return enabledPlugins.includes(pluginName);
    }
    /**
     * Enable/disable plugin
     */
    setPluginEnabled(pluginName, enabled) {
        const enabledPlugins = this.get('plugins.enabled');
        if (enabled && !enabledPlugins.includes(pluginName)) {
            enabledPlugins.push(pluginName);
        }
        else if (!enabled) {
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
    getPluginConfig(pluginName) {
        const pluginConfigs = this.get('plugins.config');
        return pluginConfigs[pluginName] || {};
    }
    /**
     * Set plugin configuration
     */
    setPluginConfig(pluginName, config) {
        const pluginConfigs = this.get('plugins.config');
        pluginConfigs[pluginName] = config;
        this.set('plugins.config', pluginConfigs);
    }
    /**
     * Watch for configuration changes
     */
    onDidChange(key, callback) {
        this.store.onDidChange(key, callback);
    }
    /**
     * Get configuration file path
     */
    getConfigPath() {
        return this.store.path;
    }
    /**
     * Get configuration schema for validation
     */
    getConfigSchema() {
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
exports.ConfigManager = ConfigManager;
/**
 * Singleton instance
 */
let configManagerInstance = null;
/**
 * Get or create ConfigManager instance
 */
function getConfigManager() {
    if (!configManagerInstance) {
        configManagerInstance = new ConfigManager();
    }
    return configManagerInstance;
}
