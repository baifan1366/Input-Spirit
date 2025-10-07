'use client';

import { useState, useEffect } from 'react';
import { Settings, Zap, Keyboard, Info, User, LogOut, Cloud, CloudOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  enabled?: boolean;
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tAuth = useTranslations('auth');
  const router = useRouter();
  const { user, signOut, isConfigured } = useAuth();
  const [plugins, setPlugins] = useState<PluginMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        const pluginList = await window.electronAPI.invoke('get-plugins');
        setPlugins(pluginList);
      } catch (error) {
        console.error('Failed to load plugins:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const togglePlugin = async (pluginName: string, enabled: boolean) => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        await window.electronAPI.invoke('toggle-plugin', pluginName, enabled);
        setPlugins(prev =>
          prev.map(p =>
            p.name === pluginName ? { ...p, enabled } : p
          )
        );
      } catch (error) {
        console.error('Failed to toggle plugin:', error);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Settings className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('title')}
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('subtitle')}
              </p>
            </div>

            {/* User Info / Login Button */}
            {isConfigured && (
              <div>
                {user ? (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 justify-end">
                        <Cloud className="w-3 h-3" />
                        Synced
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                      <LogOut className="w-4 h-4" />
                      {tAuth('signOut')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => router.push('/auth')}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    {tAuth('signIn')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Info */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg text-white">
          <div className="flex items-start gap-4">
            <Keyboard className="w-6 h-6 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg mb-2">{t('quickStart.title')}</h3>
              <p className="text-sm opacity-90">
                Press <kbd className="px-2 py-1 bg-white/20 rounded">{t('quickStart.shortcut')}</kbd> anywhere to open the AI overlay.
                Then type commands like <code className="px-2 py-1 bg-white/20 rounded">{t('quickStart.aiExample')}</code> or{' '}
                <code className="px-2 py-1 bg-white/20 rounded">{t('quickStart.fixExample')}</code>.
              </p>
            </div>
          </div>
        </div>

        {/* Plugins Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('plugins.title')}
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('plugins.subtitle')}
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                {t('plugins.loading')}
              </div>
            ) : plugins.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {t('plugins.noPlugins')}
              </div>
            ) : (
              plugins.map((plugin) => (
                <div
                  key={plugin.name}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {plugin.name}
                        </h3>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded">
                          {t('plugins.version', { version: plugin.version })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {plugin.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {t('plugins.by', { author: plugin.author })}
                      </p>
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={plugin.enabled ?? true}
                        onChange={(e) => togglePlugin(plugin.name, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Plugin Examples */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('usage.title')}
              </h2>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {t('usage.aiAssistant.title')}
              </h4>
              <code className="block px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-700 dark:text-gray-300">
                {t('usage.aiAssistant.example')}
              </code>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {t('usage.promptEnhancer.title')}
              </h4>
              <code className="block px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-700 dark:text-gray-300">
                {t('usage.promptEnhancer.example')}
              </code>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {t('usage.grammarChecker.title')}
              </h4>
              <code className="block px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-700 dark:text-gray-300">
                {t('usage.grammarChecker.example')}
              </code>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {t('usage.translator.title')}
              </h4>
              <code className="block px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-700 dark:text-gray-300">
                {t('usage.translator.example')}
              </code>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {t('usage.articleWriter.title')}
              </h4>
              <code className="block px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded text-sm text-gray-700 dark:text-gray-300">
                {t('usage.articleWriter.example')}
              </code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>{t('footer.title')}</p>
          <p className="mt-1">{t('footer.subtitle')}</p>
        </div>
      </div>
    </div>
  );
}
