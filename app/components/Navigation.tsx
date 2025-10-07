'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Settings } from 'lucide-react';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show navigation on overlay page
  if (pathname?.includes('overlay')) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪶</span>
            <span className="font-bold text-lg text-gray-900 dark:text-white">Input Spirit</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/')}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                pathname === '/' || pathname?.match(/^\/[a-z]{2}$/)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">首页</span>
            </button>
            
            <button
              onClick={() => router.push('/settings')}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                pathname?.includes('settings')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">设置</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
