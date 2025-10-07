/**
 * Supabase Database Types
 * Auto-generated types for type-safe database operations
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          config: Json;
          device_id: string | null;
          version: number;
          created_at: string;
          updated_at: string;
          synced_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          config: Json;
          device_id?: string | null;
          version?: number;
          created_at?: string;
          updated_at?: string;
          synced_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          config?: Json;
          device_id?: string | null;
          version?: number;
          created_at?: string;
          updated_at?: string;
          synced_at?: string | null;
        };
      };
      custom_plugins: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          version: string;
          description: string | null;
          code: string;
          enabled: boolean;
          is_public: boolean;
          downloads: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          version: string;
          description?: string | null;
          code: string;
          enabled?: boolean;
          is_public?: boolean;
          downloads?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          version?: string;
          description?: string | null;
          code?: string;
          enabled?: boolean;
          is_public?: boolean;
          downloads?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      marketplace_plugins: {
        Row: {
          id: string;
          author_id: string;
          name: string;
          version: string;
          description: string | null;
          code: string;
          downloads: number;
          rating: number;
          reviews_count: number;
          tags: string[];
          featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          name: string;
          version: string;
          description?: string | null;
          code: string;
          downloads?: number;
          rating?: number;
          reviews_count?: number;
          tags?: string[];
          featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          name?: string;
          version?: string;
          description?: string | null;
          code?: string;
          downloads?: number;
          rating?: number;
          reviews_count?: number;
          tags?: string[];
          featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_workflows: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          workflow: Json;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          workflow: Json;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          workflow?: Json;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
