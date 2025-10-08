"use strict";
/**
 * Input Monitor
 * Monitors global keyboard input for trigger detection using uiohook
 * Enables AI commands in ANY text field system-wide
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputMonitor = void 0;
exports.getInputMonitor = getInputMonitor;
exports.cleanupInputMonitor = cleanupInputMonitor;
const events_1 = require("events");
const electron_1 = require("electron");
const pluginManager_1 = require("./pluginManager");
// Dynamic import for uiohook-napi to handle native module
let uiohook = null;
/**
 * Input Monitor Class
 */
class InputMonitor extends events_1.EventEmitter {
    constructor() {
        super();
        this.enabled = false;
        this.inputBuffer = '';
        this.bufferTimeout = null;
        this.debounceMs = 1500; // Wait 1.5s after last keystroke before checking
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
            console.log('🔍 [DEBUG] ========================================');
            console.log('🔍 [DEBUG] Starting input monitor initialization...');
            console.log('🔍 [DEBUG] ========================================');
            // Load uiohook dynamically
            if (!uiohook) {
                console.log('🔍 [DEBUG] Loading uiohook-napi module...');
                const { uIOhook } = require('uiohook-napi');
                uiohook = uIOhook;
                console.log('🔍 [DEBUG] uiohook loaded:', typeof uiohook);
                console.log('🔍 [DEBUG] uiohook.start:', typeof uiohook.start);
                console.log('🔍 [DEBUG] uiohook.on:', typeof uiohook.on);
            }
            console.log('🔍 [DEBUG] Registering uiohook event listeners...');
            // Register keydown event (uiohook-napi doesn't have keypress)
            uiohook.on('keydown', (event) => {
                // Only log keydown for debugging (comment out in production)
                // console.log('🔍 [DEBUG] ===== KEYDOWN =====', JSON.stringify(event));
                this.handleKeyPress(event);
            });
            // Start uiohook
            if (!this.ioHookStarted) {
                console.log('🔍 [DEBUG] Calling uiohook.start()...');
                uiohook.start();
                this.ioHookStarted = true;
                console.log('🔍 [DEBUG] uiohook.start() completed!');
            }
            // Also register emergency shortcut (Ctrl+Shift+Space) to manually open overlay
            const registered = electron_1.globalShortcut.register('CommandOrControl+Shift+Space', () => {
                this.emit('trigger-shortcut-pressed');
                console.log('⌨️  Manual shortcut pressed');
            });
            console.log('✅ ========================================');
            console.log('✅ Input monitor started successfully!');
            console.log('✅ Using uiohook for global keyboard monitoring');
            console.log('✅ Will detect triggers: ai:, fix:, translate:, etc.');
            console.log('✅ ========================================');
            if (registered) {
                console.log('✅ Emergency shortcut registered: Ctrl+Shift+Space');
            }
            // Test: Log first few keypress events
            console.log('🔍 [DEBUG] Waiting for keyboard input...');
            console.log('🔍 [DEBUG] Try typing or clicking mouse to test uiohook');
            console.log('🔍 [DEBUG] Example trigger: "ai: hello"');
        }
        catch (error) {
            console.error('❌ Failed to start uiohook:', error);
            console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
            console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack');
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
     * Handle key press events from uiohook
     */
    handleKeyPress(event) {
        if (!this.enabled)
            return;
        // Get the character from the key event
        const char = this.getCharFromEvent(event);
        if (!char) {
            console.log('🔍 [DEBUG] No char from event:', event);
            return;
        }
        // Add to buffer
        this.inputBuffer += char;
        console.log(`🔍 Buffer: "${this.inputBuffer}"`);
        // Limit buffer size
        if (this.inputBuffer.length > this.maxBufferLength) {
            this.inputBuffer = this.inputBuffer.slice(-this.maxBufferLength);
        }
        // Clear existing timeout
        if (this.bufferTimeout) {
            clearTimeout(this.bufferTimeout);
        }
        // Set timeout to check trigger after user stops typing
        this.bufferTimeout = setTimeout(() => {
            console.log('⏱️  Checking triggers...');
            this.checkForTrigger();
            // Clear buffer after check
            this.clearBuffer();
        }, this.debounceMs);
    }
    /**
     * Convert uiohook-napi key event to character
     */
    getCharFromEvent(event) {
        // Skip if modifier keys are pressed (except shift)
        if (event.ctrlKey || event.metaKey || event.altKey) {
            return null;
        }
        // Map keycode to character (basic US keyboard layout)
        const keycode = event.keycode;
        const shift = event.shiftKey;
        // Letters: keycode 30-38 = q,w,e,r,t,y,u,i,o; 16-24 = a,s,d,f,g,h,j,k,l; 44-50 = z,x,c,v,b,n,m
        const keycodeMap = {
            // Top row
            16: ['q', 'Q'], 17: ['w', 'W'], 18: ['e', 'E'], 19: ['r', 'R'], 20: ['t', 'T'],
            21: ['y', 'Y'], 22: ['u', 'U'], 23: ['i', 'I'], 24: ['o', 'O'], 25: ['p', 'P'],
            // Middle row
            30: ['a', 'A'], 31: ['s', 'S'], 32: ['d', 'D'], 33: ['f', 'F'], 34: ['g', 'G'],
            35: ['h', 'H'], 36: ['j', 'J'], 37: ['k', 'K'], 38: ['l', 'L'],
            // Bottom row
            44: ['z', 'Z'], 45: ['x', 'X'], 46: ['c', 'C'], 47: ['v', 'V'], 48: ['b', 'B'],
            49: ['n', 'N'], 50: ['m', 'M'],
            // Numbers
            2: ['1', '!'], 3: ['2', '@'], 4: ['3', '#'], 5: ['4', '$'], 6: ['5', '%'],
            7: ['6', '^'], 8: ['7', '&'], 9: ['8', '*'], 10: ['9', '('], 11: ['0', ')'],
            // Symbols
            12: ['-', '_'], 13: ['=', '+'], 26: ['[', '{'], 27: [']', '}'],
            39: [';', ':'], 40: ['\'', '"'], 41: ['`', '~'], 43: ['\\', '|'],
            51: [',', '<'], 52: ['.', '>'], 53: ['/', '?'],
            57: [' ', ' '], // Space
        };
        if (keycodeMap[keycode]) {
            const char = shift ? keycodeMap[keycode][1] : keycodeMap[keycode][0];
            console.log(`⌨️  "${char}"`);
            return char;
        }
        return null;
    }
    /**
     * Check if buffer contains any trigger patterns
     */
    checkForTrigger() {
        const pluginManager = (0, pluginManager_1.getPluginManager)();
        // Try to match the entire buffer first
        let triggerMatch = pluginManager.matchTrigger(this.inputBuffer);
        // If no match, try to find trigger pattern within the buffer (last 100 chars)
        if (!triggerMatch && this.inputBuffer.length > 3) {
            const recentChars = this.inputBuffer.slice(-100);
            triggerMatch = pluginManager.matchTrigger(recentChars);
        }
        if (triggerMatch) {
            console.log(`🎯 ✅ TRIGGER MATCHED: ${triggerMatch.pluginName}`);
            console.log(`📝 Input: "${triggerMatch.input}"`);
            // Emit trigger matched event
            this.emit('trigger-matched', triggerMatch);
        }
        else {
            console.log('❌ No trigger found');
        }
    }
    /**
     * Stop monitoring
     */
    stop() {
        if (!this.enabled)
            return;
        this.enabled = false;
        // Stop uiohook
        if (uiohook && this.ioHookStarted) {
            try {
                uiohook.stop();
                this.ioHookStarted = false;
                console.log('🛑 uiohook stopped');
            }
            catch (error) {
                console.error('Error stopping uiohook:', error);
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
