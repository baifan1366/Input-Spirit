'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Copy, Check, RotateCw, X, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ChromeAIClient } from '@/app/lib/chromeAI';

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
  triggerText?: string;
  result?: PluginResult;
  error?: string;
  loading: boolean;
}

export default function OverlayPage() {
  const t = useTranslations('overlay');
  const [execution, setExecution] = useState<ExecutionState>({ loading: false });
  const [visible, setVisible] = useState(false);

  /**
   * Execute AI - auto-detect environment (Chrome Launcher or Bridge)
   */
  const executeAI = async (plugin: string, input: string) => {
    const startTime = Date.now();

    try {
      // Extract query from input
      const query = input.match(/^[a-z]+:\s*(.+)/i)?.[1] || input;
      
      // Determine system prompt based on plugin
      let systemPrompt = 'You are a helpful AI assistant. Provide clear, concise, and accurate answers.';
      if (plugin === 'grammar-checker') {
        systemPrompt = 'You are a grammar checker. Fix grammar and spelling errors while preserving the original meaning.';
      } else if (plugin === 'translator') {
        systemPrompt = 'You are a translator. Translate the text accurately while preserving tone and context.';
      } else if (plugin === 'article-writer') {
        systemPrompt = 'You are a professional article writer. Create well-structured, engaging content.';
      } else if (plugin === 'prompt-enhancer') {
        systemPrompt = 'You are a prompt enhancer. Improve and expand prompts to be more effective.';
      }
      
      // Check if Chrome AI is available directly (Chrome Launcher mode)
      const directAI = await ChromeAIClient.isAvailable();
      
      if (directAI) {
        // Use Chrome AI directly (running in real Chrome)
        console.log(`🚀 Executing AI directly in Chrome (plugin: ${plugin})`);
        
        const client = new ChromeAIClient();
        await client.createSession({ systemPrompt, temperature: 0.7 });
        const response = await client.prompt(query);
        client.destroy();
        
        const processingTime = Date.now() - startTime;
        
        setExecution({
          loading: false,
          plugin,
          triggerText: input,
          result: {
            content: response,
            formatted: response,
            actions: ['copy', 'insert', 'regenerate'],
            metadata: {
              processingTime,
              modelUsed: 'gemini-nano (direct)',
            },
          },
        });
        
        console.log(`✅ AI execution completed in ${processingTime}ms`);
        return;
      }
      
      // Fallback: Use Chrome AI Bridge via IPC (if in Electron)
      if (window.electronAPI) {
        console.log(`🚀 Executing AI via Chrome Bridge (plugin: ${plugin})`);
        
        const response = await window.electronAPI.invoke('execute-ai-bridge', {
          plugin,
          input,
          systemPrompt,
        });
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to execute AI');
        }
        
        const processingTime = Date.now() - startTime;
        
        setExecution({
          loading: false,
          plugin,
          triggerText: input,
          result: {
            content: response.result,
            formatted: response.result,
            actions: ['copy', 'insert', 'regenerate'],
            metadata: {
              processingTime,
              modelUsed: 'gemini-nano (via bridge)',
            },
          },
        });
        
        console.log(`✅ AI execution completed in ${processingTime}ms`);
        return;
      }
      
      throw new Error('No AI execution method available');
    } catch (error) {
      console.error('❌ AI execution error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if it's a "not ready" error
      if (errorMessage.includes('not ready')) {
        setExecution({
          loading: false,
          plugin,
          triggerText: input,
          error: 'Chrome AI client not ready. Please open it from the tray menu (🤖 Open Chrome AI Client)',
        });
        return;
      }
      
      // Generic error
      setExecution({
        loading: false,
        plugin,
        triggerText: input,
        error: errorMessage,
      });
    }
  };

  useEffect(() => {
    // Listen for overlay events from main process
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.on('overlay-shown', () => {
        console.log('🔍 [DEBUG] Overlay shown event received');
        setVisible(true);
      });

      window.electronAPI.on('execution-start', async (data: any) => {
        console.log('🔍 [DEBUG] Execution start:', data);
        setVisible(true); // Make sure overlay is visible
        setExecution({ 
          loading: true, 
          plugin: data.plugin,
          triggerText: data.input 
        });

        // Execute AI in browser (rendering process)
        await executeAI(data.plugin, data.input);
      });
    }
  }, [execution.triggerText]);

  const handleInsert = async () => {
    if (!execution.result) return;

    const content = execution.result.content;
    console.log('🔍 [DEBUG] Inserting text:', content);

    // Send insert request to main process
    if (window.electronAPI) {
      const result = await window.electronAPI.invoke('insert-text', content);
      if (result.success) {
        console.log('✅ Text inserted successfully');
        handleClose();
      } else {
        console.error('❌ Failed to insert text:', result.error);
      }
    }
  };

  const handleCopy = async () => {
    if (!execution.result) return;
    await navigator.clipboard.writeText(execution.result.content);
    console.log('✅ Text copied to clipboard');
  };

  const handleRegenerate = () => {
    if (!execution.triggerText) return;
    console.log('🔍 [DEBUG] Regenerating with:', execution.triggerText);
    
    setExecution({ loading: true, triggerText: execution.triggerText });
    
    // Send to main process for re-execution
    if (window.electronAPI) {
      window.electronAPI.send('process-input', execution.triggerText);
    }
  };

  const handleClose = () => {
    console.log('🔍 [DEBUG] Closing overlay');
    if (window.electronAPI) {
      window.electronAPI.send('hide-overlay');
    }
    setVisible(false);
  };

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    if (visible) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible]);

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
              <div className="flex items-center gap-3 text-white">
                <Sparkles className="w-5 h-5" />
                <div>
                  <h2 className="font-semibold text-lg">AI Response</h2>
                  {execution.triggerText && (
                    <p className="text-xs text-white/80">Trigger: {execution.triggerText}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-4">

              {/* Loading State */}
              {execution.loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 gap-4"
                >
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                  <p className="text-gray-600 dark:text-gray-400">Processing with AI...</p>
                  {execution.plugin && (
                    <p className="text-sm text-gray-500">Plugin: {execution.plugin}</p>
                  )}
                </motion.div>
              )}

              {/* Result Display */}
              <AnimatePresence mode="wait">
                {execution.result && !execution.loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="space-y-4"
                  >
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 max-h-96 overflow-y-auto">
                      <div className="text-base text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                        {execution.result.formatted || execution.result.content}
                      </div>
                    </div>

                    {/* Metadata */}
                    {execution.result.metadata && (
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        {execution.result.metadata.processingTime && (
                          <span>⏱️ {execution.result.metadata.processingTime}ms</span>
                        )}
                        {execution.result.metadata.modelUsed && (
                          <span>🤖 {execution.result.metadata.modelUsed}</span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleInsert}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        Insert
                      </button>
                      <button
                        onClick={handleCopy}
                        className="py-3 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                      >
                        <Copy className="w-5 h-5" />
                        Copy
                      </button>
                      <button
                        onClick={handleRegenerate}
                        className="py-3 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                      >
                        <RotateCw className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Error Display */}
                {execution.error && !execution.loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
                      Error
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-300">
                      {execution.error}
                    </p>
                    <button
                      onClick={handleRegenerate}
                      className="mt-3 text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                      Try again
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Hint */}
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">ESC</kbd> to close
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
