/**
 * Preload Script
 * Exposes safe IPC APIs to renderer process
 */

import { contextBridge, ipcRenderer } from "electron";

// Expose safe APIs to renderer
contextBridge.exposeInMainWorld("electronAPI", {
  // Send messages to main process
  send: (channel: string, data?: any) => {
    const validChannels = [
      "process-input",
      "hide-overlay",
      "navigate-to",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  // Listen to messages from main process
  on: (channel: string, callback: (data: any) => void) => {
    const validChannels = [
      "overlay-shown",
      "execution-start",
      "execution-complete",
      "execution-error",
      "update-status",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, data) => callback(data));
    }
  },
  // Invoke and get response from main process
  invoke: async (channel: string, ...args: any[]) => {
    const validChannels = [
      "execute-plugin",
      "get-config",
      "update-config",
      "get-plugins",
      "toggle-plugin",
    ];
    if (validChannels.includes(channel)) {
      return await ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Invalid IPC channel: ${channel}`);
  },
});

// Expose version info
contextBridge.exposeInMainWorld("versions", {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});
