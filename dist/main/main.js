"use strict";
/**
 * Input Spirit - Main Process
 * Google Chrome Built-in AI Challenge 2025
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const electron_updater_1 = require("electron-updater");
// Import modules
const chromeAI_1 = require("./modules/chromeAI");
const pluginManager_1 = require("./modules/pluginManager");
const inputMonitor_1 = require("./modules/inputMonitor");
const configManager_1 = require("./modules/configManager");
const plugins_1 = require("./plugins");
const isDev = !electron_1.app.isPackaged;
let mainWindow = null;
let overlayWindow = null;
let tray = null;
/**
 * Request single instance lock
 */
const gotLock = electron_1.app.requestSingleInstanceLock();
if (!gotLock) {
    console.log("⚠️  Another instance is already running");
    electron_1.app.quit();
}
/**
 * Create main window
 */
async function createMainWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        show: false, // Start hidden, show after initialization
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    if (isDev) {
        await mainWindow.loadURL("http://localhost:3000");
        mainWindow.webContents.openDevTools();
    }
    else {
        await mainWindow.loadFile(path_1.default.join(__dirname, "../out/index.html"));
    }
    // Show window after content loaded
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
    // Auto-updater
    if (!isDev) {
        electron_updater_1.autoUpdater.autoDownload = true;
        electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
        electron_updater_1.autoUpdater.on("update-available", () => {
            mainWindow?.webContents.send("update-status", "available");
        });
        electron_updater_1.autoUpdater.on("update-downloaded", () => {
            mainWindow?.webContents.send("update-status", "downloaded");
        });
        electron_updater_1.autoUpdater.on("error", (err) => {
            mainWindow?.webContents.send("update-status", "error");
            console.error("Auto-updater error:", err);
        });
    }
    else {
        // Development mode: Test update notifications after 5 seconds
        setTimeout(() => {
            console.log("🧪 Testing update notification (dev mode)");
            mainWindow?.webContents.send("update-status", "available");
            setTimeout(() => {
                mainWindow?.webContents.send("update-status", "downloaded");
            }, 3000);
        }, 5000);
    }
    console.log("✅ Main window created");
}
/**
 * Create overlay window
 */
async function createOverlayWindow() {
    overlayWindow = new electron_1.BrowserWindow({
        width: 500,
        height: 400,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        show: false,
        resizable: false,
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    if (isDev) {
        await overlayWindow.loadURL("http://localhost:3000/overlay");
    }
    else {
        await overlayWindow.loadFile(path_1.default.join(__dirname, "../out/overlay.html"));
    }
    overlayWindow.on("blur", () => {
        // Auto-hide on blur
        const config = (0, configManager_1.getConfigManager)();
        const autoHideDelay = config.get("overlay.autoHideDelay");
        if (autoHideDelay > 0) {
            setTimeout(() => {
                overlayWindow?.hide();
            }, autoHideDelay);
        }
    });
    overlayWindow.on("closed", () => {
        overlayWindow = null;
    });
    console.log("✅ Overlay window created");
}
/**
 * Create system tray
 */
function createTray() {
    const iconPath = path_1.default.join(__dirname, "../public/icon.png");
    const icon = electron_1.nativeImage.createFromPath(iconPath);
    tray = new electron_1.Tray(icon.resize({ width: 16, height: 16 }));
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: "Input Spirit",
            enabled: false,
        },
        { type: "separator" },
        {
            label: "Show Window",
            click: () => {
                mainWindow?.show();
            },
        },
        {
            label: "Open Overlay (Ctrl+Shift+Space)",
            click: () => {
                showOverlay();
            },
        },
        { type: "separator" },
        {
            label: "Settings",
            click: () => {
                mainWindow?.show();
                mainWindow?.webContents.send("navigate-to", "/settings");
            },
        },
        { type: "separator" },
        {
            label: "Quit",
            click: () => {
                electron_1.app.quit();
            },
        },
    ]);
    tray.setToolTip("Input Spirit - AI Everywhere");
    tray.setContextMenu(contextMenu);
    console.log("✅ System tray created");
}
/**
 * Initialize all modules
 */
async function initializeModules() {
    console.log("🚀 Initializing Input Spirit...");
    try {
        // Initialize configuration
        const config = (0, configManager_1.getConfigManager)();
        console.log("📝 Config loaded");
        // Initialize Chrome AI
        if (mainWindow) {
            const chromeAI = (0, chromeAI_1.getChromeAI)();
            await chromeAI.initialize(mainWindow);
            console.log("🤖 Chrome AI initialized");
        }
        // Initialize plugin manager
        const pluginManager = (0, pluginManager_1.getPluginManager)();
        // Register built-in plugins
        for (const plugin of plugins_1.builtInPlugins) {
            const isEnabled = config.isPluginEnabled(plugin.metadata.name);
            plugin.metadata.enabled = isEnabled;
            await pluginManager.registerPlugin(plugin);
        }
        console.log(`📦 ${plugins_1.builtInPlugins.length} plugins registered`);
        // Initialize input monitor
        const inputMonitor = (0, inputMonitor_1.getInputMonitor)();
        if (config.get("inputMonitor.enabled")) {
            inputMonitor.start();
        }
        // Setup input monitor event handlers
        inputMonitor.on("trigger-shortcut-pressed", () => {
            // Manual shortcut - just show overlay for user to type
            showOverlay();
        });
        inputMonitor.on("trigger-matched", async (match) => {
            // Auto-detected trigger - show overlay AND execute immediately
            showOverlay();
            await handleTriggerMatch(match);
        });
        console.log("✅ All modules initialized");
    }
    catch (error) {
        console.error("❌ Initialization error:", error);
        throw error;
    }
}
/**
 * Show overlay window
 */
function showOverlay() {
    if (!overlayWindow)
        return;
    // Position at center of screen
    const { screen } = require("electron");
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    overlayWindow.setPosition(Math.floor(width / 2 - 250), Math.floor(height / 2 - 200));
    overlayWindow.show();
    overlayWindow.focus();
    overlayWindow.webContents.send("overlay-shown");
}
/**
 * Handle trigger match from global input
 */
async function handleTriggerMatch(match) {
    try {
        console.log(`🚀 Executing plugin: ${match.pluginName}`);
        console.log(`📝 Input text: ${match.input}`);
        // Send execution start notification to overlay
        overlayWindow?.webContents.send("execution-start", {
            plugin: match.pluginName,
            input: match.input,
        });
        // Execute the plugin
        const pluginManager = (0, pluginManager_1.getPluginManager)();
        const result = await pluginManager.executeByTrigger(match);
        console.log(`✅ Plugin executed successfully`);
        // Send result to overlay
        overlayWindow?.webContents.send("execution-complete", {
            plugin: match.pluginName,
            result,
        });
    }
    catch (error) {
        console.error("Trigger execution error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        overlayWindow?.webContents.send("execution-error", {
            plugin: match.pluginName,
            error: errorMessage,
        });
    }
}
/**
 * Setup IPC handlers
 */
function setupIPC() {
    // Execute plugin
    electron_1.ipcMain.handle("execute-plugin", async (event, pluginName, input) => {
        try {
            const pluginManager = (0, pluginManager_1.getPluginManager)();
            const result = await pluginManager.executePlugin(pluginName, input);
            return { success: true, result };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: errorMessage };
        }
    });
    // Process input from overlay
    electron_1.ipcMain.on("process-input", (event, input) => {
        const inputMonitor = (0, inputMonitor_1.getInputMonitor)();
        inputMonitor.processInput(input);
    });
    // Get configuration
    electron_1.ipcMain.handle("get-config", () => {
        const config = (0, configManager_1.getConfigManager)();
        return config.getConfig();
    });
    // Update configuration
    electron_1.ipcMain.handle("update-config", (event, key, value) => {
        const config = (0, configManager_1.getConfigManager)();
        config.set(key, value);
        return { success: true };
    });
    // Get plugins list
    electron_1.ipcMain.handle("get-plugins", () => {
        const pluginManager = (0, pluginManager_1.getPluginManager)();
        return pluginManager.getPlugins().map(p => p.metadata);
    });
    // Toggle plugin
    electron_1.ipcMain.handle("toggle-plugin", (event, pluginName, enabled) => {
        const pluginManager = (0, pluginManager_1.getPluginManager)();
        const config = (0, configManager_1.getConfigManager)();
        pluginManager.setPluginEnabled(pluginName, enabled);
        config.setPluginEnabled(pluginName, enabled);
        return { success: true };
    });
    // Hide overlay
    electron_1.ipcMain.on("hide-overlay", () => {
        overlayWindow?.hide();
    });
    // Insert text
    electron_1.ipcMain.handle("insert-text", async (event, text) => {
        try {
            const { insertText } = await Promise.resolve().then(() => __importStar(require("./modules/clipboard")));
            const success = await insertText(text);
            return { success };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    console.log("✅ IPC handlers registered");
}
/**
 * App ready
 */
electron_1.app.whenReady().then(async () => {
    await createMainWindow();
    await createOverlayWindow();
    createTray();
    setupIPC();
    await initializeModules();
    console.log("🎉 Input Spirit is ready!");
    // Show main window in dev mode
    if (isDev) {
        mainWindow?.show();
    }
});
/**
 * Handle second instance
 */
electron_1.app.on("second-instance", () => {
    if (mainWindow) {
        if (mainWindow.isMinimized())
            mainWindow.restore();
        mainWindow.focus();
    }
});
/**
 * Window all closed
 */
electron_1.app.on("window-all-closed", () => {
    // Don't quit on macOS
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
/**
 * Activate
 */
electron_1.app.on("activate", () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});
/**
 * Before quit - cleanup
 */
electron_1.app.on("before-quit", async () => {
    console.log("🧹 Cleaning up...");
    (0, inputMonitor_1.cleanupInputMonitor)();
    await (0, pluginManager_1.cleanupPluginManager)();
    await (0, chromeAI_1.destroyChromeAI)();
    console.log("👋 Goodbye!");
});
