/**
 * Input Spirit - Main Process
 * Google Chrome Built-in AI Challenge 2025
 */

import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } from "electron";
import path from "path";
import { autoUpdater } from "electron-updater";

// Import modules
import { getChromeAI, destroyChromeAI } from "./modules/chromeAI";
import { getPluginManager, cleanupPluginManager } from "./modules/pluginManager";
import { getInputMonitor, cleanupInputMonitor } from "./modules/inputMonitor";
import { getConfigManager } from "./modules/configManager";
import { builtInPlugins } from "./plugins";
import type { TriggerMatch, PluginResult } from "./types";

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

/**
 * Request single instance lock
 */
const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  console.log("⚠️  Another instance is already running");
  app.quit();
}

/**
 * Create main window
 */
async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Start hidden, show after initialization
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    await mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, "../out/index.html"));
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
    autoUpdater.autoDownload = true;
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on("update-available", () => {
      mainWindow?.webContents.send("update-status", "available");
    });

    autoUpdater.on("update-downloaded", () => {
      mainWindow?.webContents.send("update-status", "downloaded");
    });

    autoUpdater.on("error", (err) => {
      mainWindow?.webContents.send("update-status", "error");
      console.error("Auto-updater error:", err);
    });
  } else {
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
  overlayWindow = new BrowserWindow({
    width: 500,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    await overlayWindow.loadURL("http://localhost:3000/overlay");
  } else {
    await overlayWindow.loadFile(path.join(__dirname, "../out/overlay.html"));
  }

  overlayWindow.on("blur", () => {
    // Auto-hide on blur
    const config = getConfigManager();
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
  const iconPath = path.join(__dirname, "../public/icon.png");
  const icon = nativeImage.createFromPath(iconPath);
  
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  
  const contextMenu = Menu.buildFromTemplate([
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
        app.quit();
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
    const config = getConfigManager();
    console.log("📝 Config loaded");

    // Initialize Chrome AI
    if (mainWindow) {
      const chromeAI = getChromeAI();
      await chromeAI.initialize(mainWindow);
      console.log("🤖 Chrome AI initialized");
    }

    // Initialize plugin manager
    const pluginManager = getPluginManager();

    // Register built-in plugins
    for (const plugin of builtInPlugins) {
      const isEnabled = config.isPluginEnabled(plugin.metadata.name);
      plugin.metadata.enabled = isEnabled;
      await pluginManager.registerPlugin(plugin);
    }
    console.log(`📦 ${builtInPlugins.length} plugins registered`);

    // Initialize input monitor
    const inputMonitor = getInputMonitor();
    
    if (config.get("inputMonitor.enabled")) {
      inputMonitor.start();
    }

    // Setup input monitor event handlers
    inputMonitor.on("trigger-shortcut-pressed", () => {
      // Manual shortcut - just show overlay for user to type
      showOverlay();
    });

    inputMonitor.on("trigger-matched", async (match: TriggerMatch) => {
      // Auto-detected trigger - show overlay AND execute immediately
      showOverlay();
      await handleTriggerMatch(match);
    });

    console.log("✅ All modules initialized");
  } catch (error) {
    console.error("❌ Initialization error:", error);
    throw error;
  }
}

/**
 * Show overlay window
 */
function showOverlay() {
  if (!overlayWindow) return;

  // Position at center of screen
  const { screen } = require("electron");
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  overlayWindow.setPosition(
    Math.floor(width / 2 - 250),
    Math.floor(height / 2 - 200)
  );

  overlayWindow.show();
  overlayWindow.focus();
  overlayWindow.webContents.send("overlay-shown");
}

/**
 * Handle trigger match from global input
 */
async function handleTriggerMatch(match: TriggerMatch) {
  try {
    console.log(`🚀 Executing plugin: ${match.pluginName}`);
    console.log(`📝 Input text: ${match.input}`);
    
    // Send execution start notification to overlay
    overlayWindow?.webContents.send("execution-start", {
      plugin: match.pluginName,
      input: match.input,
    });

    // Execute the plugin
    const pluginManager = getPluginManager();
    const result = await pluginManager.executeByTrigger(match);

    console.log(`✅ Plugin executed successfully`);

    // Send result to overlay
    overlayWindow?.webContents.send("execution-complete", {
      plugin: match.pluginName,
      result,
    });
  } catch (error) {
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
  ipcMain.handle("execute-plugin", async (event, pluginName: string, input: string) => {
    try {
      const pluginManager = getPluginManager();
      const result = await pluginManager.executePlugin(pluginName, input);
      return { success: true, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  });

  // Process input from overlay
  ipcMain.on("process-input", (event, input: string) => {
    const inputMonitor = getInputMonitor();
    inputMonitor.processInput(input);
  });

  // Get configuration
  ipcMain.handle("get-config", () => {
    const config = getConfigManager();
    return config.getConfig();
  });

  // Update configuration
  ipcMain.handle("update-config", (event, key: string, value: any) => {
    const config = getConfigManager();
    config.set(key, value);
    return { success: true };
  });

  // Get plugins list
  ipcMain.handle("get-plugins", () => {
    const pluginManager = getPluginManager();
    return pluginManager.getPlugins().map(p => p.metadata);
  });

  // Toggle plugin
  ipcMain.handle("toggle-plugin", (event, pluginName: string, enabled: boolean) => {
    const pluginManager = getPluginManager();
    const config = getConfigManager();
    
    pluginManager.setPluginEnabled(pluginName, enabled);
    config.setPluginEnabled(pluginName, enabled);
    
    return { success: true };
  });

  // Hide overlay
  ipcMain.on("hide-overlay", () => {
    overlayWindow?.hide();
  });

  // Insert text
  ipcMain.handle("insert-text", async (event, text: string) => {
    try {
      const { insertText } = await import("./modules/clipboard");
      const success = await insertText(text);
      return { success };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  console.log("✅ IPC handlers registered");
}

/**
 * App ready
 */
app.whenReady().then(async () => {
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
app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

/**
 * Window all closed
 */
app.on("window-all-closed", () => {
  // Don't quit on macOS
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/**
 * Activate
 */
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

/**
 * Before quit - cleanup
 */
app.on("before-quit", async () => {
  console.log("🧹 Cleaning up...");
  
  cleanupInputMonitor();
  await cleanupPluginManager();
  await destroyChromeAI();
  
  console.log("👋 Goodbye!");
});
