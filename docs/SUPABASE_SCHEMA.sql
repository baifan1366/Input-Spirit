-- ============================================
-- Input Spirit - Supabase Database Schema
-- ============================================
-- This schema supports user authentication, settings sync,
-- custom plugins, and workflows

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Users Table (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own data
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- User Settings Table
-- ============================================
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}',
  device_id TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure one settings record per user
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
  ON public.user_settings
  FOR ALL
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);

-- ============================================
-- Custom Plugins Table
-- ============================================
CREATE TABLE public.custom_plugins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique plugin names per user
  UNIQUE(user_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.custom_plugins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own plugins"
  ON public.custom_plugins
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public plugins"
  ON public.custom_plugins
  FOR SELECT
  USING (is_public = true);

-- Indexes
CREATE INDEX idx_custom_plugins_user_id ON public.custom_plugins(user_id);
CREATE INDEX idx_custom_plugins_public ON public.custom_plugins(is_public) WHERE is_public = true;

-- ============================================
-- Plugin Marketplace Table
-- ============================================
CREATE TABLE public.marketplace_plugins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL UNIQUE,
  version TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.marketplace_plugins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view marketplace plugins"
  ON public.marketplace_plugins
  FOR SELECT
  USING (true);

CREATE POLICY "Authors can manage own plugins"
  ON public.marketplace_plugins
  FOR ALL
  USING (auth.uid() = author_id);

-- Indexes
CREATE INDEX idx_marketplace_plugins_author ON public.marketplace_plugins(author_id);
CREATE INDEX idx_marketplace_plugins_downloads ON public.marketplace_plugins(downloads DESC);
CREATE INDEX idx_marketplace_plugins_rating ON public.marketplace_plugins(rating DESC);
CREATE INDEX idx_marketplace_plugins_tags ON public.marketplace_plugins USING GIN(tags);

-- ============================================
-- User Workflows Table
-- ============================================
CREATE TABLE public.user_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  workflow JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.user_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workflows"
  ON public.user_workflows
  FOR ALL
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_user_workflows_user_id ON public.user_workflows(user_id);

-- ============================================
-- Plugin Reviews Table
-- ============================================
CREATE TABLE public.plugin_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plugin_id UUID NOT NULL REFERENCES public.marketplace_plugins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One review per user per plugin
  UNIQUE(plugin_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.plugin_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.plugin_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own reviews"
  ON public.plugin_reviews
  FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_plugin_reviews_plugin ON public.plugin_reviews(plugin_id);
CREATE INDEX idx_plugin_reviews_user ON public.plugin_reviews(user_id);

-- ============================================
-- Sync Logs Table (for debugging)
-- ============================================
CREATE TABLE public.sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id TEXT,
  sync_type TEXT NOT NULL, -- 'config', 'plugins', 'workflows'
  status TEXT NOT NULL, -- 'success', 'conflict', 'error'
  conflicts JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync logs"
  ON public.sync_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_sync_logs_user_created ON public.sync_logs(user_id, created_at DESC);

-- ============================================
-- Functions & Triggers
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_plugins_updated_at
  BEFORE UPDATE ON public.custom_plugins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_plugins_updated_at
  BEFORE UPDATE ON public.marketplace_plugins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_workflows_updated_at
  BEFORE UPDATE ON public.user_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update marketplace plugin rating when review is added/updated
CREATE OR REPLACE FUNCTION update_plugin_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.marketplace_plugins
  SET 
    rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM public.plugin_reviews
      WHERE plugin_id = NEW.plugin_id
    ),
    reviews_count = (
      SELECT COUNT(*)
      FROM public.plugin_reviews
      WHERE plugin_id = NEW.plugin_id
    )
  WHERE id = NEW.plugin_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plugin_rating_trigger
  AFTER INSERT OR UPDATE ON public.plugin_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_plugin_rating();

-- ============================================
-- Storage Bucket for Plugin Assets (optional)
-- ============================================
-- Run this in Supabase Storage UI or via SQL:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('plugin-assets', 'plugin-assets', true);

-- ============================================
-- Sample Data (for development)
-- ============================================

-- This will be populated by actual user signups
-- No need to insert sample users in production
