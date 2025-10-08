"use strict";
/**
 * Plugin Manager
 * Loads, manages, and executes plugins
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginManager = void 0;
exports.getPluginManager = getPluginManager;
exports.cleanupPluginManager = cleanupPluginManager;
const events_1 = require("events");
const chromeAI_1 = require("./chromeAI");
/**
 * Plugin Manager Class
 */
class PluginManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.plugins = new Map();
        this.executionTimeouts = new Map();
    }
    /**
     * Register a plugin
     */
    async registerPlugin(plugin) {
        const { name } = plugin.metadata;
        if (this.plugins.has(name)) {
            throw new Error(`Plugin "${name}" already registered`);
        }
        // Initialize plugin if needed
        if (plugin.init) {
            try {
                await plugin.init();
                console.log(`✅ Plugin "${name}" initialized`);
            }
            catch (error) {
                console.error(`❌ Failed to initialize plugin "${name}":`, error);
                throw error;
            }
        }
        this.plugins.set(name, plugin);
        this.emit('plugin-registered', plugin.metadata);
        console.log(`📦 Plugin "${name}" registered`);
    }
    /**
     * Unregister a plugin
     */
    async unregisterPlugin(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw new Error(`Plugin "${name}" not found`);
        }
        // Cleanup plugin if needed
        if (plugin.destroy) {
            try {
                await plugin.destroy();
            }
            catch (error) {
                console.error(`Error destroying plugin "${name}":`, error);
            }
        }
        this.plugins.delete(name);
        this.emit('plugin-unregistered', name);
        console.log(`🗑️  Plugin "${name}" unregistered`);
    }
    /**
     * Get all registered plugins
     */
    getPlugins() {
        return Array.from(this.plugins.values());
    }
    /**
     * Get plugin by name
     */
    getPlugin(name) {
        return this.plugins.get(name);
    }
    /**
     * Check if input matches any plugin trigger
     */
    matchTrigger(input) {
        for (const plugin of this.plugins.values()) {
            if (!plugin.metadata.enabled)
                continue;
            const { trigger } = plugin;
            if (trigger instanceof RegExp) {
                const match = input.match(trigger);
                if (match) {
                    console.log(`🎯 Matched plugin: ${plugin.metadata.name}`);
                    return {
                        pattern: trigger.source,
                        pluginName: plugin.metadata.name,
                        params: this.extractParams(match),
                        input,
                    };
                }
            }
            else if (typeof trigger === 'function') {
                if (trigger(input)) {
                    console.log(`🎯 Matched plugin: ${plugin.metadata.name}`);
                    return {
                        pattern: 'custom-function',
                        pluginName: plugin.metadata.name,
                        params: {},
                        input,
                    };
                }
            }
        }
        return null;
    }
    /**
     * Execute a plugin
     */
    async executePlugin(pluginName, input, params = {}) {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`Plugin "${pluginName}" not found`);
        }
        if (!plugin.metadata.enabled) {
            throw new Error(`Plugin "${pluginName}" is disabled`);
        }
        const chromeAI = (0, chromeAI_1.getChromeAI)();
        // Create abort controller for timeout
        const abortController = new AbortController();
        const timeout = plugin.timeout ?? 8000;
        // Create plugin context
        const context = {
            input,
            params,
            ai: chromeAI,
            abort: abortController.signal,
        };
        // Setup timeout
        const timeoutId = setTimeout(() => {
            abortController.abort();
            this.emit('plugin-timeout', {
                plugin: pluginName,
                timeout,
            });
        }, timeout);
        this.executionTimeouts.set(pluginName, timeoutId);
        try {
            this.emit('plugin-execution-start', {
                plugin: pluginName,
                input,
            });
            const startTime = Date.now();
            const result = await plugin.run(context);
            const processingTime = Date.now() - startTime;
            // Add processing time to metadata
            result.metadata = {
                ...result.metadata,
                processingTime,
            };
            this.emit('plugin-execution-complete', {
                plugin: pluginName,
                result,
                processingTime,
            });
            return result;
        }
        catch (error) {
            this.emit('plugin-execution-error', {
                plugin: pluginName,
                error,
            });
            throw error;
        }
        finally {
            clearTimeout(timeoutId);
            this.executionTimeouts.delete(pluginName);
        }
    }
    /**
     * Execute plugin by trigger match
     */
    async executeByTrigger(triggerMatch) {
        return this.executePlugin(triggerMatch.pluginName, triggerMatch.input, triggerMatch.params);
    }
    /**
     * Cancel plugin execution
     */
    cancelExecution(pluginName) {
        const timeoutId = this.executionTimeouts.get(pluginName);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.executionTimeouts.delete(pluginName);
            this.emit('plugin-execution-cancelled', pluginName);
        }
    }
    /**
     * Enable/disable plugin
     */
    setPluginEnabled(name, enabled) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw new Error(`Plugin "${name}" not found`);
        }
        plugin.metadata.enabled = enabled;
        this.emit('plugin-enabled-changed', { name, enabled });
        console.log(`${enabled ? '✅' : '❌'} Plugin "${name}" ${enabled ? 'enabled' : 'disabled'}`);
    }
    /**
     * Extract parameters from regex match
     */
    extractParams(match) {
        const params = {};
        // Extract named groups if available
        if (match.groups) {
            Object.assign(params, match.groups);
        }
        // Extract numbered groups
        for (let i = 1; i < match.length; i++) {
            params[`$${i}`] = match[i];
        }
        return params;
    }
    /**
     * Cleanup all plugins
     */
    async cleanup() {
        console.log('🧹 Cleaning up plugins...');
        // Cancel all ongoing executions
        for (const timeoutId of this.executionTimeouts.values()) {
            clearTimeout(timeoutId);
        }
        this.executionTimeouts.clear();
        // Destroy all plugins
        for (const [name, plugin] of this.plugins.entries()) {
            if (plugin.destroy) {
                try {
                    await plugin.destroy();
                }
                catch (error) {
                    console.error(`Error destroying plugin "${name}":`, error);
                }
            }
        }
        this.plugins.clear();
        console.log('✅ Plugin cleanup complete');
    }
}
exports.PluginManager = PluginManager;
/**
 * Singleton instance
 */
let pluginManagerInstance = null;
/**
 * Get or create PluginManager instance
 */
function getPluginManager() {
    if (!pluginManagerInstance) {
        pluginManagerInstance = new PluginManager();
    }
    return pluginManagerInstance;
}
/**
 * Cleanup PluginManager instance
 */
async function cleanupPluginManager() {
    if (pluginManagerInstance) {
        await pluginManagerInstance.cleanup();
        pluginManagerInstance = null;
    }
}
