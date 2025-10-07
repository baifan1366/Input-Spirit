/**
 * Storage Layer Types
 * Supports both local storage (electron-store) and cloud sync (Supabase)
 */

import type { AppConfig } from './index';

// ============================================
// Storage Strategy Interface
// ============================================

export interface StorageStrategy {
  get<T = any>(key: string): Promise<T | undefined>;
  set<T = any>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

// ============================================
// Supabase Database Schema
// ============================================

/**
 * User table schema
 */
export interface User {
  id: string; // UUID (primary key)
  email: string;
  created_at: string;
  updated_at: string;
  display_name?: string;
  avatar_url?: string;
}

/**
 * User settings table schema
 * Stores AppConfig in JSONB column
 */
export interface UserSettings {
  id: string; // UUID (primary key)
  user_id: string; // Foreign key to users.id
  config: AppConfig; // JSONB column
  created_at: string;
  updated_at: string;
  synced_at?: string;
}

/**
 * Custom plugins table schema
 */
export interface CustomPlugin {
  id: string; // UUID (primary key)
  user_id: string; // Foreign key to users.id
  name: string;
  version: string;
  description: string;
  code: string; // Plugin code
  enabled: boolean;
  is_public: boolean; // If true, visible in plugin marketplace
  downloads: number;
  created_at: string;
  updated_at: string;
}

/**
 * Plugin marketplace entry
 */
export interface MarketplacePlugin {
  id: string;
  author_id: string;
  name: string;
  version: string;
  description: string;
  code: string;
  downloads: number;
  rating: number;
  reviews_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

/**
 * User workflows table schema
 */
export interface UserWorkflow {
  id: string; // UUID (primary key)
  user_id: string; // Foreign key to users.id
  name: string;
  description: string;
  workflow: any; // JSONB - workflow definition
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Sync metadata
 */
export interface SyncMetadata {
  last_sync: string;
  version: number;
  device_id: string;
  conflicts?: SyncConflict[];
}

/**
 * Sync conflict data
 */
export interface SyncConflict {
  key: string;
  local_value: any;
  remote_value: any;
  local_updated_at: string;
  remote_updated_at: string;
  resolution?: 'local' | 'remote' | 'merge';
}

// ============================================
// Sync Configuration
// ============================================

export interface SyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // milliseconds
  conflictResolution: 'local' | 'remote' | 'manual';
  syncOnStartup: boolean;
  syncOnChange: boolean;
}

// ============================================
// Storage Manager Interface
// ============================================

export interface IStorageManager {
  // Basic operations
  getConfig(): Promise<AppConfig>;
  updateConfig(config: Partial<AppConfig>): Promise<void>;
  resetConfig(): Promise<void>;

  // Sync operations
  sync(): Promise<SyncResult>;
  enableSync(userId: string): Promise<void>;
  disableSync(): Promise<void>;
  getSyncStatus(): SyncStatus;

  // Plugin operations
  getCustomPlugins(): Promise<CustomPlugin[]>;
  saveCustomPlugin(plugin: Omit<CustomPlugin, 'id' | 'created_at' | 'updated_at'>): Promise<CustomPlugin>;
  deleteCustomPlugin(pluginId: string): Promise<void>;

  // Workflow operations
  getWorkflows(): Promise<UserWorkflow[]>;
  saveWorkflow(workflow: Omit<UserWorkflow, 'id' | 'created_at' | 'updated_at'>): Promise<UserWorkflow>;
  deleteWorkflow(workflowId: string): Promise<void>;
}

// ============================================
// Sync Result & Status
// ============================================

export interface SyncResult {
  success: boolean;
  conflicts?: SyncConflict[];
  synced_at: string;
  error?: string;
}

export interface SyncStatus {
  enabled: boolean;
  syncing: boolean;
  lastSync?: string;
  userId?: string;
  error?: string;
}

// ============================================
// Supabase Client Types
// ============================================

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: User;
  expires_at: number;
}
