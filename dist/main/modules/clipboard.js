"use strict";
/**
 * Clipboard and Text Insertion Module
 * Handles copying to clipboard and inserting text into active window
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyToClipboard = copyToClipboard;
exports.insertText = insertText;
exports.typeText = typeText;
exports.getClipboard = getClipboard;
const electron_1 = require("electron");
const robotjs_1 = __importDefault(require("robotjs"));
/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
    electron_1.clipboard.writeText(text);
    console.log('✅ Text copied to clipboard');
}
/**
 * Insert text into active window
 * Uses clipboard + paste shortcut for maximum compatibility
 */
async function insertText(text) {
    try {
        // 1. Save current clipboard content
        const previousClipboard = electron_1.clipboard.readText();
        // 2. Copy new text to clipboard
        electron_1.clipboard.writeText(text);
        // 3. Wait a moment for clipboard to update
        await new Promise(resolve => setTimeout(resolve, 100));
        // 4. Simulate Ctrl+V (Cmd+V on Mac)
        const modifier = process.platform === 'darwin' ? 'command' : 'control';
        robotjs_1.default.keyTap('v', [modifier]);
        // 5. Wait for paste to complete
        await new Promise(resolve => setTimeout(resolve, 200));
        // 6. Restore previous clipboard content
        electron_1.clipboard.writeText(previousClipboard);
        console.log('✅ Text inserted successfully');
        return true;
    }
    catch (error) {
        console.error('❌ Failed to insert text:', error);
        return false;
    }
}
/**
 * Type text character by character (slower but more reliable)
 */
async function typeText(text, delayMs = 10) {
    try {
        for (const char of text) {
            robotjs_1.default.typeString(char);
            if (delayMs > 0) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        console.log('✅ Text typed successfully');
        return true;
    }
    catch (error) {
        console.error('❌ Failed to type text:', error);
        return false;
    }
}
/**
 * Get current clipboard content
 */
function getClipboard() {
    return electron_1.clipboard.readText();
}
