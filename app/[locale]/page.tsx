'use client';

import { useTranslations } from "next-intl";
import { useRouter } from 'next/navigation';
import { Settings, Zap } from 'lucide-react';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const t = useTranslations('home');

  // Listen for navigation events from Electron
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.on('navigate-to', (path: string) => {
        router.push(path);
      });
    }
  }, [router]);

  const handleGetStarted = () => {
    router.push('/settings');
  };

  const handleLearnMore = () => {
    // Scroll to features or show info
    const element = document.getElementById('features');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 pt-24">
      <main className="flex flex-col gap-8 row-start-2 items-center">
        <h1 className="text-4xl font-bold">🪶 {t('title')}</h1>
        <p className="text-lg text-center max-w-2xl">
          {t('subtitle')}
        </p>
        
        {/* Quick Access Card */}
        <div className="w-full max-w-2xl mt-8 p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg text-white">
          <div className="flex items-start gap-4">
            <Zap className="w-6 h-6 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg mb-2">快速使用</h3>
              <p className="text-sm opacity-90">
                按下 <kbd className="px-2 py-1 bg-white/20 rounded font-mono">Ctrl+Shift+Space</kbd> 在任何地方打开 AI 助手
              </p>
              <p className="text-sm opacity-90 mt-2">
                然后输入命令如 <code className="px-2 py-1 bg-white/20 rounded">ai: 你的问题</code> 或{' '}
                <code className="px-2 py-1 bg-white/20 rounded">fix: 你的文本</code>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-8" id="features">
          <h2 className="text-2xl font-semibold">{t('features')}</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>💭 {t('featureList.prompt')}</li>
            <li>🔤 {t('featureList.proofreader')}</li>
            <li>📄 {t('featureList.summarizer')}</li>
            <li>🌐 {t('featureList.translator')}</li>
            <li>✏️ {t('featureList.writer')}</li>
            <li>🖊️ {t('featureList.rewriter')}</li>
          </ul>
        </div>

        <div className="flex gap-4 mt-8">
          <button 
            onClick={handleGetStarted}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Settings className="w-5 h-5" />
            {t('getStarted')}
          </button>
          <button 
            onClick={handleLearnMore}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            {t('learnMore')}
          </button>
        </div>
      </main>
    </div>
  );
}

// Type definitions for Electron API
declare global {
  interface Window {
    electronAPI?: {
      send: (channel: string, data?: any) => void;
      on: (channel: string, callback: (data: any) => void) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}
