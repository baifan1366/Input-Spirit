'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Copy, Send, RotateCw, X, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PluginResult {
  content: string;
  formatted?: string;
  actions?: string[];
  metadata?: {
    processingTime?: number;
    modelUsed?: string;
    [key: string]: any;
  };
}

interface ExecutionState {
  plugin?: string;
  result?: PluginResult;
  error?: string;
  loading: boolean;
}

export default function OverlayPage() {
  const t = useTranslations('overlay');
  const [input, setInput] = useState('');
  const [execution, setExecution] = useState<ExecutionState>({ loading: false });
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Listen for overlay events from main process
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.on('overlay-shown', () => {
        setVisible(true);
        // Only clear if not already executing
        if (!execution.loading) {
          setInput('');
          setExecution({ loading: false });
        }
        setTimeout(() => inputRef.current?.focus(), 100);
      });

      window.electronAPI.on('execution-start', (data: any) => {
        setVisible(true); // Make sure overlay is visible
        // If input was provided (auto-trigger), show it
        if (data.input) {
          setInput(data.input);
        }
        setExecution({ loading: true, plugin: data.plugin });
      });

      window.electronAPI.on('execution-complete', (data: any) => {
        setExecution({ loading: false, plugin: data.plugin, result: data.result });
      });

      window.electronAPI.on('execution-error', (data: any) => {
        setExecution({ loading: false, plugin: data.plugin, error: data.error });
      });
    }
  }, [execution.loading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || execution.loading) return;

    setExecution({ loading: true });

    // Send input to main process for processing
    if (window.electronAPI) {
      window.electronAPI.send('process-input', input);
    }
  };

  const handleAction = async (action: string) => {
    if (!execution.result) return;

    const content = execution.result.content;

    switch (action) {
      case 'copy':
        await navigator.clipboard.writeText(content);
        // Show toast notification
        break;
      
      case 'insert':
        // In a real implementation, this would insert into the active window
        await navigator.clipboard.writeText(content);
        handleClose();
        break;
      
      case 'regenerate':
        handleSubmit();
        break;
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.send('hide-overlay');
    }
    setVisible(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600">
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5" />
                <h2 className="font-semibold text-lg">{t('title')}</h2>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input Area */}
            <div className="p-6 space-y-4">
              <form onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('inputLabel')}
                  </label>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('inputPlaceholder')}
                    className="w-full h-24 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    disabled={execution.loading}
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{t('submitHint')}</span>
                    {execution.plugin && (
                      <span className="text-blue-600 dark:text-blue-400">
                        {t('plugin')} {execution.plugin}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!input.trim() || execution.loading}
                  className="mt-4 w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {execution.loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('processing')}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {t('execute')}
                    </>
                  )}
                </button>
              </form>

              {/* Result Area */}
              <AnimatePresence mode="wait">
                {execution.result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-6 space-y-4"
                  >
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        {t('result')}
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-sans">
                          {execution.result.formatted || execution.result.content}
                        </pre>
                      </div>

                      {/* Metadata */}
                      {execution.result.metadata && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-4">
                          {execution.result.metadata.processingTime && (
                            <span>⏱️ {execution.result.metadata.processingTime}{t('metadata.processingTime')}</span>
                          )}
                          {execution.result.metadata.modelUsed && (
                            <span>🤖 {execution.result.metadata.modelUsed}</span>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      {execution.result.actions && execution.result.actions.length > 0 && (
                        <div className="mt-4 flex gap-2 flex-wrap">
                          {execution.result.actions.map((action) => (
                            <button
                              key={action}
                              onClick={() => handleAction(action)}
                              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm"
                            >
                              {action === 'copy' && <Copy className="w-4 h-4" />}
                              {action === 'insert' && <Send className="w-4 h-4" />}
                              {action === 'regenerate' && <RotateCw className="w-4 h-4" />}
                              {t(`actions.${action}`)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {execution.error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
                      {t('error')}
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-300">
                      {execution.error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tips */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-semibold">{t('tips.label')}</span> {t('tips.text')}{' '}
                <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">{t('tips.examples.ai')}</code>,{' '}
                <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">{t('tips.examples.fix')}</code>,{' '}
                <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">{t('tips.examples.translate')}</code>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
