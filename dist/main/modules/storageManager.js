"use strict";
/**
 * Storage Manager
 * Unified storage layer supporting both local (electron-store) and cloud (Supabase) storage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageManager = void 0;
exports.getStorageManager = getStorageManager;
exports.cleanupStorageManager = cleanupStorageManager;
const events_1 = require("events");
/**
 * Default sync configuration
 */
const defaultSyncConfig = {
    enabled: false,
    autoSync: true,
    syncInterval: 5 * 60 * 1000, // 5 minutes
    conflictResolution: 'remote', // Prefer remote by default
    syncOnStartup: true,
    syncOnChange: false,
};
/**
 * Storage Manager Class
 * Handles both local and cloud storage
 */
class StorageManager extends events_1.EventEmitter {
    constructor(localStore) {
        super();
        this.localStore = localStore;
        this.syncConfig = defaultSyncConfig;
        this.syncStatus = {
            enabled: false,
            syncing: false,
        };
    }
    // ============================================
    // Basic Config Operations
    // ============================================
    /**
     * Get configuration
     */
    async getConfig() {
        return this.localStore.store;
    }
    /**
     * Update configuration
     */
    async updateConfig(config) {
        const currentConfig = await this.getConfig();
        const newConfig = { ...currentConfig, ...config };
        // Update local store
        this.localStore.store = newConfig;
        this.emit('config-updated', newConfig);
        // Trigger sync if enabled
        if (this.syncConfig.enabled && this.syncConfig.syncOnChange) {
            await this.sync();
        }
    }
    /**
     * Reset configuration to defaults
     */
    async resetConfig() {
        this.localStore.clear();
        this.emit('config-reset');
        if (this.syncConfig.enabled) {
            await this.sync();
        }
    }
    // ============================================
    // Sync Operations
    // ============================================
    /**
     * Enable sync for a user
     */
    async enableSync(userId) {
        this.userId = userId;
        this.syncConfig.enabled = true;
        this.syncStatus.enabled = true;
        this.syncStatus.userId = userId;
        // Initial sync
        if (this.syncConfig.syncOnStartup) {
            await this.sync();
        }
        // Start auto-sync timer
        if (this.syncConfig.autoSync) {
            this.startSyncTimer();
        }
        this.emit('sync-enabled', userId);
        console.log(`✅ Sync enabled for user: ${userId}`);
    }
    /**
     * Disable sync
     */
    async disableSync() {
        this.syncConfig.enabled = false;
        this.syncStatus.enabled = false;
        this.userId = undefined;
        this.stopSyncTimer();
        this.emit('sync-disabled');
        console.log('🔴 Sync disabled');
    }
    /**
     * Sync configuration with Supabase
     */
    async sync() {
        if (!this.syncConfig.enabled || !this.userId) {
            return {
                success: false,
                synced_at: new Date().toISOString(),
                error: 'Sync not enabled or user not logged in',
            };
        }
        this.syncStatus.syncing = true;
        this.emit('sync-start');
        try {
            // Get local config
            const localConfig = await this.getConfig();
            // TODO: Implement actual Supabase sync when integrated
            // For now, this is a placeholder
            const result = await this.performSync(localConfig);
            this.syncStatus.syncing = false;
            this.syncStatus.lastSync = result.synced_at;
            this.emit('sync-complete', result);
            return result;
        }
        catch (error) {
            this.syncStatus.syncing = false;
            this.syncStatus.error = error instanceof Error ? error.message : 'Unknown error';
            this.emit('sync-error', error);
            return {
                success: false,
                synced_at: new Date().toISOString(),
                error: this.syncStatus.error,
            };
        }
    }
    /**
     * Get sync status
     */
    getSyncStatus() {
        return { ...this.syncStatus };
    }
    // ============================================
    // Custom Plugin Operations
    // ============================================
    /**
     * Get user's custom plugins
     */
    async getCustomPlugins() {
        if (!this.syncConfig.enabled || !this.userId) {
            return [];
        }
        // TODO: Fetch from Supabase
        // SELECT * FROM custom_plugins WHERE user_id = $1
        return [];
    }
    /**
     * Save a custom plugin
     */
    async saveCustomPlugin(plugin) {
        if (!this.syncConfig.enabled || !this.userId) {
            throw new Error('Sync not enabled');
        }
        // TODO: Insert into Supabase
        // INSERT INTO custom_plugins (user_id, name, version, ...) VALUES (...)
        const savedPlugin = {
            id: this.generateId(),
            ...plugin,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        this.emit('plugin-saved', savedPlugin);
        return savedPlugin;
    }
    /**
     * Delete a custom plugin
     */
    async deleteCustomPlugin(pluginId) {
        if (!this.syncConfig.enabled || !this.userId) {
            throw new Error('Sync not enabled');
        }
        // TODO: Delete from Supabase
        // DELETE FROM custom_plugins WHERE id = $1 AND user_id = $2
        this.emit('plugin-deleted', pluginId);
    }
    // ============================================
    // Workflow Operations
    // ============================================
    /**
     * Get user's workflows
     */
    async getWorkflows() {
        if (!this.syncConfig.enabled || !this.userId) {
            return [];
        }
        // TODO: Fetch from Supabase
        return [];
    }
    /**
     * Save a workflow
     */
    async saveWorkflow(workflow) {
        if (!this.syncConfig.enabled || !this.userId) {
            throw new Error('Sync not enabled');
        }
        const savedWorkflow = {
            id: this.generateId(),
            ...workflow,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        this.emit('workflow-saved', savedWorkflow);
        return savedWorkflow;
    }
    /**
     * Delete a workflow
     */
    async deleteWorkflow(workflowId) {
        if (!this.syncConfig.enabled || !this.userId) {
            throw new Error('Sync not enabled');
        }
        this.emit('workflow-deleted', workflowId);
    }
    // ============================================
    // Private Helper Methods
    // ============================================
    /**
     * Perform actual sync operation
     */
    async performSync(localConfig) {
        // TODO: Implement actual Supabase sync logic
        // 1. Fetch remote config from Supabase
        // 2. Compare timestamps
        // 3. Detect conflicts
        // 4. Resolve conflicts based on strategy
        // 5. Update local/remote as needed
        // Placeholder implementation
        const synced_at = new Date().toISOString();
        return {
            success: true,
            synced_at,
            conflicts: [],
        };
    }
    /**
     * Resolve sync conflicts
     */
    resolveConflicts(localConfig, remoteConfig) {
        const conflicts = [];
        // Simple conflict resolution based on strategy
        let resolved;
        switch (this.syncConfig.conflictResolution) {
            case 'local':
                resolved = localConfig;
                break;
            case 'remote':
                resolved = remoteConfig;
                break;
            case 'manual':
                // Return conflicts for manual resolution
                resolved = localConfig; // Keep local until resolved
                // TODO: Detect actual conflicts
                break;
            default:
                resolved = remoteConfig;
        }
        return { resolved, conflicts };
    }
    /**
     * Start auto-sync timer
     */
    startSyncTimer() {
        this.stopSyncTimer();
        this.syncTimer = setInterval(() => {
            this.sync().catch((error) => {
                console.error('Auto-sync failed:', error);
            });
        }, this.syncConfig.syncInterval);
        console.log(`⏱️  Auto-sync timer started (${this.syncConfig.syncInterval}ms)`);
    }
    /**
     * Stop auto-sync timer
     */
    stopSyncTimer() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = undefined;
        }
    }
    /**
     * Generate UUID
     */
    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
    /**
     * Cleanup
     */
    async cleanup() {
        this.stopSyncTimer();
        this.removeAllListeners();
    }
}
exports.StorageManager = StorageManager;
/**
 * Singleton instance
 */
let storageManagerInstance = null;
/**
 * Get or create StorageManager instance
 */
function getStorageManager(localStore) {
    if (!storageManagerInstance) {
        storageManagerInstance = new StorageManager(localStore);
    }
    return storageManagerInstance;
}
/**
 * Cleanup StorageManager instance
 */
async function cleanupStorageManager() {
    if (storageManagerInstance) {
        await storageManagerInstance.cleanup();
        storageManagerInstance = null;
    }
}
