"use strict";
/**
 * Input Monitor
 * Monitors global keyboard input for trigger detection using iohook
 * Enables AI commands in ANY text field system-wide
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputMonitor = void 0;
exports.getInputMonitor = getInputMonitor;
exports.cleanupInputMonitor = cleanupInputMonitor;
const events_1 = require("events");
const electron_1 = require("electron");
const pluginManager_1 = require("./pluginManager");
// Dynamic import for iohook to handle native module
let iohook = null;
/**
 * Input Monitor Class
 */
class InputMonitor extends events_1.EventEmitter {
    constructor() {
        super();
        this.enabled = false;
        this.inputBuffer = '';
        this.bufferTimeout = null;
        this.debounceMs = 1000; // 1 second to detect trigger patterns
        this.maxBufferLength = 500;
        this.ioHookStarted = false;
    }
    /**
     * Start monitoring global keyboard input
     */
    async start() {
        if (this.enabled) {
            console.warn('⚠️  Input monitor already started');
            return;
        }
        this.enabled = true;
        try {
            // Load iohook dynamically
            if (!iohook) {
                iohook = require('iohook');
            }
            // Register keyboard event listener
            iohook.on('keypress', (event) => {
                this.handleKeyPress(event);
            });
            // Start iohook
            if (!this.ioHookStarted) {
                iohook.start();
                this.ioHookStarted = true;
            }
            // Also register emergency shortcut (Ctrl+Shift+Space) to manually open overlay
            const registered = electron_1.globalShortcut.register('CommandOrControl+Shift+Space', () => {
                this.emit('trigger-shortcut-pressed');
                console.log('⌨️  Manual shortcut pressed');
            });
            console.log('✅ Input monitor started - Listening globally with iohook');
            if (registered) {
                console.log('✅ Emergency shortcut registered: Ctrl+Shift+Space');
            }
        }
        catch (error) {
            console.error('❌ Failed to start iohook:', error);
            console.log('📝 Falling back to shortcut-only mode');
            // Fallback: just use global shortcut
            const registered = electron_1.globalShortcut.register('CommandOrControl+Shift+Space', () => {
                this.emit('trigger-shortcut-pressed');
            });
            if (registered) {
                console.log('✅ Fallback mode: Ctrl+Shift+Space shortcut registered');
            }
        }
    }
    /**
     * Handle key press events from iohook
     */
    handleKeyPress(event) {
        if (!this.enabled)
            return;
        // Get the character from the key event
        const char = this.getCharFromEvent(event);
        if (!char)
            return;
        // Add to buffer
        this.inputBuffer += char;
        // Limit buffer size
        if (this.inputBuffer.length > this.maxBufferLength) {
            this.inputBuffer = this.inputBuffer.slice(-this.maxBufferLength);
        }
        // Clear existing timeout
        if (this.bufferTimeout) {
            clearTimeout(this.bufferTimeout);
        }
        // Check for trigger immediately
        this.checkForTrigger();
        // Set timeout to clear buffer
        this.bufferTimeout = setTimeout(() => {
            this.clearBuffer();
        }, this.debounceMs);
    }
    /**
     * Convert iohook key event to character
     */
    getCharFromEvent(event) {
        // iohook provides rawcode, keychar, etc.
        // For simplicity, we'll use the keychar if available
        if (event.keychar !== undefined && event.keychar !== 0) {
            return String.fromCharCode(event.keychar);
        }
        return null;
    }
    /**
     * Check if buffer contains any trigger patterns
     */
    checkForTrigger() {
        const pluginManager = (0, pluginManager_1.getPluginManager)();
        const triggerMatch = pluginManager.matchTrigger(this.inputBuffer);
        if (triggerMatch) {
            console.log(`🎯 Trigger detected in global input: ${triggerMatch.pluginName}`);
            console.log(`📝 Buffer content: "${this.inputBuffer}"`);
            // Emit trigger matched event
            this.emit('trigger-matched', triggerMatch);
            // Clear buffer after trigger
            this.clearBuffer();
        }
    }
    /**
     * Stop monitoring
     */
    stop() {
        if (!this.enabled)
            return;
        this.enabled = false;
        // Stop iohook
        if (iohook && this.ioHookStarted) {
            try {
                iohook.stop();
                this.ioHookStarted = false;
                console.log('🛑 iohook stopped');
            }
            catch (error) {
                console.error('Error stopping iohook:', error);
            }
        }
        // Unregister shortcuts
        electron_1.globalShortcut.unregisterAll();
        this.clearBuffer();
        console.log('🛑 Input monitor stopped');
    }
    /**
     * Process input text (called from overlay input or manual trigger)
     */
    processInput(text) {
        if (!this.enabled)
            return;
        const inputEvent = {
            text,
            timestamp: Date.now(),
        };
        this.emit('input-received', inputEvent);
        // Check for trigger match
        const pluginManager = (0, pluginManager_1.getPluginManager)();
        const triggerMatch = pluginManager.matchTrigger(text);
        if (triggerMatch) {
            this.emit('trigger-matched', triggerMatch);
            console.log(`🎯 Trigger matched from manual input: ${triggerMatch.pluginName}`);
        }
        else {
            this.emit('no-match', text);
        }
    }
    /**
     * Set debounce delay
     */
    setDebounce(ms) {
        this.debounceMs = ms;
    }
    /**
     * Clear input buffer
     */
    clearBuffer() {
        this.inputBuffer = '';
        if (this.bufferTimeout) {
            clearTimeout(this.bufferTimeout);
            this.bufferTimeout = null;
        }
    }
    /**
     * Get current buffer (for debugging)
     */
    getBuffer() {
        return this.inputBuffer;
    }
    /**
     * Check if monitoring is enabled
     */
    isEnabled() {
        return this.enabled;
    }
}
exports.InputMonitor = InputMonitor;
/**
 * Singleton instance
 */
let inputMonitorInstance = null;
/**
 * Get or create InputMonitor instance
 */
function getInputMonitor() {
    if (!inputMonitorInstance) {
        inputMonitorInstance = new InputMonitor();
    }
    return inputMonitorInstance;
}
/**
 * Cleanup InputMonitor instance
 */
function cleanupInputMonitor() {
    if (inputMonitorInstance) {
        inputMonitorInstance.stop();
        inputMonitorInstance = null;
    }
}
