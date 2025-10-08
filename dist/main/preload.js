"use strict";
/**
 * Preload Script
 * Exposes safe IPC APIs to renderer process
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose safe APIs to renderer
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    // Send messages to main process
    send: (channel, data) => {
        const validChannels = [
            "process-input",
            "hide-overlay",
            "navigate-to",
        ];
        if (validChannels.includes(channel)) {
            electron_1.ipcRenderer.send(channel, data);
        }
    },
    // Listen to messages from main process
    on: (channel, callback) => {
        const validChannels = [
            "overlay-shown",
            "execution-start",
            "execution-complete",
            "execution-error",
            "update-status",
        ];
        if (validChannels.includes(channel)) {
            electron_1.ipcRenderer.on(channel, (_event, data) => callback(data));
        }
    },
    // Invoke and get response from main process
    invoke: async (channel, ...args) => {
        const validChannels = [
            "execute-plugin",
            "get-config",
            "update-config",
            "get-plugins",
            "toggle-plugin",
            "insert-text",
            "execute-ai-bridge",
            "open-chrome-ai-client",
        ];
        if (validChannels.includes(channel)) {
            return await electron_1.ipcRenderer.invoke(channel, ...args);
        }
        throw new Error(`Invalid IPC channel: ${channel}`);
    },
});
// Expose version info
electron_1.contextBridge.exposeInMainWorld("versions", {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
});
