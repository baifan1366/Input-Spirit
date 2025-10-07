/**
 * Supabase Sync Utilities
 * Handles syncing settings, plugins, and workflows with Supabase
 */

import { supabase } from './client';
import type { AppConfig } from '@/main/types';

/**
 * Sync user settings to Supabase
 */
export async function syncSettingsToSupabase(userId: string, config: AppConfig) {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        config: config as any,
        synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error syncing settings:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error syncing settings:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Fetch user settings from Supabase
 */
export async function fetchSettingsFromSupabase(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no settings found, return null (not an error)
      if (error.code === 'PGRST116') {
        return { success: true, data: null };
      }
      console.error('Error fetching settings:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Subscribe to settings changes in real-time
 */
export function subscribeToSettingsChanges(
  userId: string,
  callback: (config: AppConfig) => void
) {
  const channel = supabase
    .channel('settings-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_settings',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new.config as AppConfig);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Sync custom plugin to Supabase
 */
export async function syncPluginToSupabase(userId: string, plugin: {
  name: string;
  version: string;
  description?: string;
  code: string;
  enabled?: boolean;
  is_public?: boolean;
}) {
  try {
    const { data, error } = await supabase
      .from('custom_plugins')
      .upsert({
        user_id: userId,
        ...plugin,
      })
      .select()
      .single();

    if (error) {
      console.error('Error syncing plugin:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error syncing plugin:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Fetch user's custom plugins from Supabase
 */
export async function fetchPluginsFromSupabase(userId: string) {
  try {
    const { data, error } = await supabase
      .from('custom_plugins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching plugins:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching plugins:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Delete custom plugin from Supabase
 */
export async function deletePluginFromSupabase(pluginId: string) {
  try {
    const { error } = await supabase
      .from('custom_plugins')
      .delete()
      .eq('id', pluginId);

    if (error) {
      console.error('Error deleting plugin:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting plugin:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Fetch marketplace plugins
 */
export async function fetchMarketplacePlugins(options?: {
  search?: string;
  tags?: string[];
  sortBy?: 'downloads' | 'rating' | 'recent';
  limit?: number;
}) {
  try {
    let query = supabase
      .from('marketplace_plugins')
      .select('*');

    if (options?.search) {
      query = query.ilike('name', `%${options.search}%`);
    }

    if (options?.tags && options.tags.length > 0) {
      query = query.contains('tags', options.tags);
    }

    if (options?.sortBy === 'downloads') {
      query = query.order('downloads', { ascending: false });
    } else if (options?.sortBy === 'rating') {
      query = query.order('rating', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching marketplace plugins:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching marketplace plugins:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Install plugin from marketplace
 */
export async function installMarketplacePlugin(userId: string, marketplacePluginId: string) {
  try {
    // 1. Fetch the marketplace plugin
    const { data: plugin, error: fetchError } = await supabase
      .from('marketplace_plugins')
      .select('*')
      .eq('id', marketplacePluginId)
      .single();

    if (fetchError || !plugin) {
      return { success: false, error: fetchError };
    }

    // 2. Create a copy in user's custom plugins
    const { data, error } = await supabase
      .from('custom_plugins')
      .insert({
        user_id: userId,
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        code: plugin.code,
        enabled: true,
        is_public: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error installing plugin:', error);
      return { success: false, error };
    }

    // 3. Increment download count
    await supabase.rpc('increment_plugin_downloads', { plugin_id: marketplacePluginId });

    return { success: true, data };
  } catch (error) {
    console.error('Error installing plugin:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Sync workflow to Supabase
 */
export async function syncWorkflowToSupabase(userId: string, workflow: {
  name: string;
  description?: string;
  workflow: any;
  enabled?: boolean;
}) {
  try {
    const { data, error } = await supabase
      .from('user_workflows')
      .upsert({
        user_id: userId,
        ...workflow,
      })
      .select()
      .single();

    if (error) {
      console.error('Error syncing workflow:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error syncing workflow:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Fetch user's workflows from Supabase
 */
export async function fetchWorkflowsFromSupabase(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_workflows')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching workflows:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return { success: false, error: error as Error };
  }
}
