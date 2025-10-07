# Electron API Reference for Input Spirit

## Core Electron `app` Module

**Documentation**: https://www.electronjs.org/docs/latest/api/app

The `app` module controls your application's event lifecycle.

### Essential Lifecycle Events

```javascript
const { app } = require('electron')

// Fired when Electron has finished initialization
app.on('ready', () => {
  // Create windows, start background processes
  createMainWindow()
  startInputMonitoring()
})

// Fired when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running even when windows closed
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// macOS: User clicked dock icon when no windows open
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})

// Fired before app starts closing windows
app.on('before-quit', (event) => {
  // Cleanup operations, save state
  // event.preventDefault() to cancel quit
})

// Fired when app will quit
app.on('will-quit', (event) => {
  // Final cleanup
})

// Fired when app is quitting
app.on('quit', (exitCode) => {
  // App fully closed
})
```

### Critical Methods for Input Spirit

#### Application State
```javascript
// Check if app is ready
if (app.isReady()) {
  // Safe to create windows
}

// Wait for ready state (Promise-based)
app.whenReady().then(() => {
  // Create windows
})

// Quit application
app.quit()

// Force exit with code
app.exit(exitCode)

// Relaunch application
app.relaunch({ args: process.argv.slice(1) })
```

#### Window & Focus Management
```javascript
// Focus the app (bring to front)
app.focus()

// Hide app (macOS)
app.hide()

// Show app (macOS)
app.show()

// Check if app hidden (macOS)
const hidden = app.isHidden()
```

#### Path Management
```javascript
// Get application path
const appPath = app.getAppPath()

// Get user data directory
const userDataPath = app.getPath('userData')

// Available path names:
// 'home', 'appData', 'userData', 'sessionData', 'temp', 
// 'exe', 'module', 'desktop', 'documents', 'downloads',
// 'music', 'pictures', 'videos', 'recent', 'logs'

// Set custom path
app.setPath('logs', '/custom/log/path')
```

#### App Information
```javascript
// Get app version (from package.json)
const version = app.getVersion()

// Get app name
const name = app.getName()

// Set app name
app.setName('Input Spirit')

// Get user's locale
const locale = app.getLocale() // e.g., 'en-US'

// Get country code
const countryCode = app.getLocaleCountryCode() // e.g., 'US'

// Get system locale
const systemLocale = app.getSystemLocale()

// Get preferred languages
const languages = app.getPreferredSystemLanguages()
```

#### Single Instance Lock (IMPORTANT)
```javascript
// Ensure only one instance runs
const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  // Another instance is running, quit this one
  app.quit()
} else {
  // Handle second instance launch
  app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {
    // User tried to launch second instance
    // Focus existing window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
  
  app.whenReady().then(() => {
    createWindow()
  })
}
```

#### Protocol & Deep Linking
```javascript
// Set as default protocol handler (e.g., inputspirit://)
app.setAsDefaultProtocolClient('inputspirit')

// Remove as default
app.removeAsDefaultProtocolClient('inputspirit')

// Check if default
const isDefault = app.isDefaultProtocolClient('inputspirit')

// Handle protocol URLs
app.on('open-url', (event, url) => {
  event.preventDefault()
  // Handle inputspirit://action URLs
})
```

#### Login Items (Auto-start)
```javascript
// Configure auto-start on system login
app.setLoginItemSettings({
  openAtLogin: true,
  openAsHidden: true,
  name: 'Input Spirit'
})

// Get current settings
const settings = app.getLoginItemSettings()
console.log(settings.openAtLogin)
```

#### Hardware & System
```javascript
// Disable hardware acceleration (if issues)
app.disableHardwareAcceleration()

// Get GPU info
app.getGPUInfo('basic').then(info => {
  console.log(info)
})

// Get GPU feature status
const gpuStatus = app.getGPUFeatureStatus()

// Get app metrics (CPU, memory usage)
const metrics = app.getAppMetrics()
```

#### Badge & Notifications (macOS/Linux)
```javascript
// Set dock badge count (macOS) or system tray (Linux)
app.setBadgeCount(5)

// Get badge count
const count = app.getBadgeCount()
```

#### Accessibility
```javascript
// Check if accessibility support enabled
const enabled = app.isAccessibilitySupportEnabled()

// Enable accessibility support
app.setAccessibilitySupportEnabled(true)

// Event when accessibility support changes
app.on('accessibility-support-changed', (event, enabled) => {
  console.log('Accessibility:', enabled)
})
```

#### Sandboxing (Security)
```javascript
// Enable Chromium sandbox (call before app.ready)
app.enableSandbox()

// macOS: Access security-scoped resources
const resource = app.startAccessingSecurityScopedResource(bookmarkData)
// ... use resource ...
resource.stop()
```

### Input Spirit Specific Usage

#### Recommended App Structure
```javascript
const { app, BrowserWindow } = require('electron')
const path = require('path')

let mainWindow = null
let overlayWindow = null

// Single instance lock
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
  process.exit(0)
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

// Disable hardware acceleration if needed
if (process.env.DISABLE_HARDWARE_ACCELERATION) {
  app.disableHardwareAcceleration()
}

// App initialization
app.whenReady().then(async () => {
  // Set app name
  app.setName('Input Spirit')
  
  // Create main settings window (hidden by default)
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  
  // Create overlay window for AI responses
  overlayWindow = new BrowserWindow({
    width: 400,
    height: 200,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload-overlay.js')
    }
  })
  
  // Start global input monitoring
  startInputMonitoring()
  
  // Initialize plugin system
  await initializePlugins()
  
  // Start MCP server
  startMCPServer()
  
  console.log('Input Spirit initialized')
})

app.on('window-all-closed', () => {
  // Keep app running in background on all platforms
  // Only quit when user explicitly quits from tray
  // if (process.platform !== 'darwin') {
  //   app.quit()
  // }
})

app.on('activate', () => {
  // macOS: Show main window when dock icon clicked
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show()
  }
})

app.on('before-quit', () => {
  // Cleanup
  stopInputMonitoring()
  stopMCPServer()
})

// Handle protocol for deep linking
app.setAsDefaultProtocolClient('inputspirit')

app.on('open-url', (event, url) => {
  event.preventDefault()
  // Handle inputspirit://plugin/install?url=...
  handleDeepLink(url)
})
```

#### Configuration & Persistence
```javascript
const Store = require('electron-store')

const store = new Store({
  defaults: {
    triggerPrefixes: ['ai:', 'prompt:', 'translate:', 'fix:'],
    hotkeys: {
      toggleOverlay: 'Ctrl+Shift+Space',
      insert: 'Ctrl+Enter'
    },
    privacy: {
      offlineOnly: false,
      cloudSync: false,
      redact: ['password', 'api_key']
    },
    ai: {
      provider: 'web-ai',
      model: 'gemini-nano'
    }
  }
})

// Access config
const config = store.get('ai')
store.set('ai.model', 'gemini-nano-pro')
```

#### Auto-Launch Setup
```javascript
function setupAutoLaunch() {
  const settings = app.getLoginItemSettings()
  
  if (!settings.openAtLogin) {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: true, // Start in background
      args: ['--hidden'],
      name: 'Input Spirit'
    })
  }
}
```

### BrowserWindow for Overlay UI

```javascript
const { BrowserWindow, screen } = require('electron')

function createOverlayWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  
  const overlay = new BrowserWindow({
    width: 400,
    height: 200,
    x: Math.round((width - 400) / 2),
    y: Math.round((height - 200) / 3),
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    closable: true,
    focusable: true,
    show: false, // Hidden by default
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload-overlay.js')
    }
  })
  
  // Load overlay UI
  overlay.loadFile('overlay.html')
  
  // Show when needed
  function showOverlay(content) {
    overlay.webContents.send('show-content', content)
    overlay.show()
  }
  
  // Hide overlay
  function hideOverlay() {
    overlay.hide()
  }
  
  return { overlay, showOverlay, hideOverlay }
}
```

### System Tray Integration

```javascript
const { Tray, Menu } = require('electron')

let tray = null

function createTray() {
  tray = new Tray(path.join(__dirname, 'assets/icon.png'))
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Input Spirit', type: 'normal', enabled: false },
    { type: 'separator' },
    { label: 'Settings', click: () => mainWindow.show() },
    { label: 'Plugins', click: () => openPluginsWindow() },
    { type: 'separator' },
    { label: 'Enabled', type: 'checkbox', checked: true },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])
  
  tray.setToolTip('Input Spirit - AI Assistant')
  tray.setContextMenu(contextMenu)
  
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
  })
}
```

### Important Properties

```javascript
// Check if app is packaged (production)
if (app.isPackaged) {
  // Production mode
} else {
  // Development mode
}

// Get command line arguments
app.commandLine.appendSwitch('disable-http-cache')
app.commandLine.appendSwitch('enable-features', 'WebAI')

// Check if running under ARM64 translation (Rosetta)
if (app.runningUnderARM64Translation) {
  console.log('Running under translation (Rosetta/Windows ARM)')
}
```

### Security Best Practices

```javascript
// Enable sandbox
app.enableSandbox()

// Validate all IPC messages
ipcMain.handle('invoke-ai', async (event, input) => {
  // Validate input
  if (typeof input !== 'string' || input.length > 10000) {
    throw new Error('Invalid input')
  }
  
  // Process safely
  return await processAIRequest(input)
})

// Content Security Policy
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    // Prevent navigation to external sites
    event.preventDefault()
  })
})
```

## Additional Electron Modules for Input Spirit

### ipcMain / ipcRenderer (Communication)
```javascript
// Main process
const { ipcMain } = require('electron')

ipcMain.handle('get-config', async () => {
  return store.get()
})

ipcMain.on('trigger-detected', (event, { input, trigger }) => {
  handleInputTrigger(input, trigger)
})

// Renderer (via preload script)
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  onShowContent: (callback) => ipcRenderer.on('show-content', callback)
})
```

### globalShortcut (Hotkeys)
```javascript
const { globalShortcut } = require('electron')

app.whenReady().then(() => {
  // Register global hotkey
  globalShortcut.register('Ctrl+Shift+Space', () => {
    toggleOverlay()
  })
  
  // Check if registered
  if (globalShortcut.isRegistered('Ctrl+Shift+Space')) {
    console.log('Hotkey registered')
  }
})

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll()
})
```

### clipboard (Text Operations)
```javascript
const { clipboard } = require('electron')

// Read clipboard
const text = clipboard.readText()

// Write to clipboard
clipboard.writeText('AI generated content')

// Clear clipboard
clipboard.clear()
```

### shell (External Links)
```javascript
const { shell } = require('electron')

// Open URL in browser
shell.openExternal('https://github.com')

// Open file in default app
shell.openPath('/path/to/file')

// Show file in folder
shell.showItemInFolder('/path/to/file')
```

## Performance & Debugging

```javascript
// Monitor performance
app.on('ready', () => {
  setInterval(() => {
    const metrics = app.getAppMetrics()
    const memory = process.memoryUsage()
    console.log('Memory:', memory.heapUsed / 1024 / 1024, 'MB')
  }, 60000) // Every minute
})

// Enable remote debugging
if (!app.isPackaged) {
  app.commandLine.appendSwitch('remote-debugging-port', '9222')
}

// Crash reporting
app.on('render-process-gone', (event, webContents, details) => {
  console.error('Render process gone:', details)
})

app.on('child-process-gone', (event, details) => {
  console.error('Child process gone:', details)
})
```

---

**Reference**: https://www.electronjs.org/docs/latest/api/app
