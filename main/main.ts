/**
 * Input Spirit - Main Process
 * Google Chrome Built-in AI Challenge 2025
 */

import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } from "electron";
import path from "path";
import { autoUpdater } from "electron-updater";

// Enable Chrome AI experimental features
app.commandLine.appendSwitch('enable-features', 'PromptAPI,AIPrompt');
app.commandLine.appendSwitch('enable-blink-features', 'PromptAPI,AIPrompt');
app.commandLine.appendSwitch('enable-ai-prompt-api', 'true');

// Import modules
import { getChromeAI, destroyChromeAI } from "./modules/chromeAI";
import { getPluginManager, cleanupPluginManager } from "./modules/pluginManager";
import { getInputMonitor, cleanupInputMonitor } from "./modules/inputMonitor";
import { getConfigManager } from "./modules/configManager";
import { getChromeAIBridge, cleanupChromeAIBridge } from "./modules/chromeAIBridge";
import { getChromeLauncher, cleanupChromeLauncher } from "./modules/chromeLauncher";
import { builtInPlugins } from "./plugins";
import type { TriggerMatch, PluginResult } from "./types";
import { nanoid } from 'nanoid';

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let aiHelperWindow: BrowserWindow | null = null; // Hidden window for Chrome AI

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
 * Create AI Helper window (hidden, for Chrome AI APIs)
 */
async function createAIHelperWindow() {
  aiHelperWindow = new BrowserWindow({
    width: 1,
    height: 1,
    show: false, // Hidden window
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // @ts-ignore - Enable experimental Chrome AI features
      enableBlinkFeatures: 'PromptAPI,AIPrompt',
      experimentalFeatures: true,
    },
  });

  // Load a minimal page with Chrome AI capabilities
  await aiHelperWindow.loadURL('data:text/html,<html><head><title>AI Helper</title></head><body>Chrome AI Helper Window</body></html>');
  
  console.log("✅ AI Helper window created (hidden)");
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
      // @ts-ignore - Enable experimental Chrome AI features
      enableBlinkFeatures: 'PromptAPI,AIPrompt',
      experimentalFeatures: true,
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
    {
      label: "🤖 Open Chrome AI Client",
      click: async () => {
        try {
          const bridge = getChromeAIBridge();
          await bridge.openChromeClient();
        } catch (error) {
          console.error('Failed to open Chrome AI client:', error);
        }
      },
    },
    {
      type: "separator",
    },
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

    // Option: Use Chrome Launcher (recommended) or Chrome AI Bridge
    const useLauncher = config.get("ai.useLauncher") !== false; // Default to true
    
    if (useLauncher) {
      // Launch Chrome with AI features + Bridge (方案3：混合模式)
      console.log("🚀 [MAIN] Launching Chrome with AI features...");
      try {
        // Start Bridge server first
        const aiBridge = getChromeAIBridge();
        await aiBridge.start();
        console.log("✅ Chrome AI Bridge ready");
        
        // Then launch Chrome pointing to Bridge client
        const chromeLauncher = getChromeLauncher();
        await new Promise(resolve => setTimeout(resolve, 2000));
        await chromeLauncher.launch('http://localhost:3001'); // Bridge client page
        console.log("✅ Chrome launched with AI features");
        console.log("💡 Chrome window will auto-connect to Bridge and handle AI");
      } catch (error) {
        console.error("❌ Failed to launch Chrome:", error);
        console.log("⚠️  Please manually open Chrome to http://localhost:3001");
      }
    } else {
      // Use Chrome AI Bridge (方案C：HTTP通信)
      console.log("🔍 [MAIN] Initializing Chrome AI Bridge...");
      const aiBridge = getChromeAIBridge();
      await aiBridge.start();
      console.log("✅ Chrome AI Bridge ready");
      console.log("💡 Use tray menu to open Chrome AI client window");
    }

    // Initialize plugin manager (for trigger matching only)
    console.log("🔍 [MAIN] Initializing plugin manager...");
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
    
    const inputMonitorEnabled = config.get("inputMonitor.enabled");
    console.log('🔍 [MAIN] ========================================');
    console.log('🔍 [MAIN] Input monitor enabled in config:', inputMonitorEnabled);
    console.log('🔍 [MAIN] ========================================');
    
    if (inputMonitorEnabled) {
      console.log('🔍 [MAIN] Calling inputMonitor.start()...');
      await inputMonitor.start();
      console.log('🔍 [MAIN] inputMonitor.start() completed');
    } else {
      console.log('🔍 [MAIN] Input monitor is DISABLED in config - not starting');
    }

    // Setup input monitor event handlers
    inputMonitor.on("trigger-shortcut-pressed", () => {
      console.log('🔍 [DEBUG] Manual shortcut pressed - showing overlay');
      // Manual shortcut - just show overlay for user to type
      showOverlay();
    });

    inputMonitor.on("trigger-matched", (match: TriggerMatch) => {
      console.log('🎯 TRIGGER MATCHED!');
      console.log('📦 Plugin:', match.pluginName);
      console.log('📝 Input:', match.input);
      
      // Show overlay and send trigger info (AI execution happens in renderer)
      showOverlay();
      
      // Send execution-start to overlay (it will execute AI itself)
      overlayWindow?.webContents.send("execution-start", {
        plugin: match.pluginName,
        input: match.input,
      });
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
  console.log('🔍 [DEBUG] showOverlay() called');
  
  if (!overlayWindow) {
    console.error('❌ Overlay window not found!');
    return;
  }

  // Position at center of screen
  const { screen } = require("electron");
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  overlayWindow.setPosition(
    Math.floor(width / 2 - 250),
    Math.floor(height / 2 - 200)
  );

  console.log('🔍 [DEBUG] Showing overlay window...');
  overlayWindow.show();
  overlayWindow.focus();
  overlayWindow.webContents.send("overlay-shown");
  console.log('✅ Overlay window shown and focused');
}

/**
 * Handle trigger match from global input
 */
async function handleTriggerMatch(match: TriggerMatch) {
  try {
    console.log('🔍 [DEBUG] ========================================');
    console.log('🔍 [DEBUG] handleTriggerMatch() called');
    console.log(`🚀 Executing plugin: ${match.pluginName}`);
    console.log(`📝 Input text: ${match.input}`);
    console.log('🔍 [DEBUG] ========================================');
    
    // Send execution start notification to overlay
    console.log('🔍 [DEBUG] Sending execution-start to overlay...');
    overlayWindow?.webContents.send("execution-start", {
      plugin: match.pluginName,
      input: match.input,
    });

    // Execute the plugin
    console.log('🔍 [DEBUG] Getting plugin manager...');
    const pluginManager = getPluginManager();
    console.log('🔍 [DEBUG] Executing plugin...');
    const result = await pluginManager.executeByTrigger(match);

    console.log('🔍 [DEBUG] ========================================');
    console.log(`✅ Plugin executed successfully`);
    console.log('🔍 [DEBUG] Result:', JSON.stringify(result, null, 2));
    console.log('🔍 [DEBUG] ========================================');

    // Send result to overlay
    console.log('🔍 [DEBUG] Sending execution-complete to overlay...');
    overlayWindow?.webContents.send("execution-complete", {
      plugin: match.pluginName,
      result,
    });
    console.log('✅ Result sent to overlay');
  } catch (error) {
    console.error('🔍 [DEBUG] ========================================');
    console.error("❌ Trigger execution error:", error);
    console.error('🔍 [DEBUG] ========================================');
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

  /**
   * Execute AI via Chrome Bridge
   */
  ipcMain.handle("execute-ai-bridge", async (_event, data: { plugin: string; input: string; systemPrompt?: string }) => {
    try {
      const bridge = getChromeAIBridge();
      const result = await bridge.executeAI({
        id: nanoid(),
        plugin: data.plugin,
        input: data.input,
        systemPrompt: data.systemPrompt,
      });
      return { success: true, result };
    } catch (error) {
      console.error('AI Bridge error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * Open Chrome AI client window
   */
  ipcMain.handle("open-chrome-ai-client", async () => {
    try {
      const bridge = getChromeAIBridge();
      await bridge.openChromeClient();
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  /**
   * Insert text
   */
  ipcMain.handle("insert-text", async (_event, text: string) => {
    try {
      // Use robotjs to simulate typing
      const robot = require('robotjs');
      
      // Small delay to let user switch focus
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Type the text
      robot.typeString(text);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to insert text:', error);
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
  await createAIHelperWindow(); // Create hidden AI helper window
  await createOverlayWindow();
  createTray();
  setupIPC();
  await initializeModules();

  console.log("🎉 Input Spirit is ready!");
  console.log("💡 Tip: Open DevTools on overlay window to see Chrome AI diagnostics");
  
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
  cleanupChromeAIBridge();
  cleanupChromeLauncher(); // Kill Chrome process
  
  console.log("👋 Goodbye!");
});
