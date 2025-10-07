/**
 * Clipboard and Text Insertion Module
 * Handles copying to clipboard and inserting text into active window
 */

import { clipboard } from 'electron';
import robot from 'robotjs';

/**
 * Copy text to clipboard
 */
export function copyToClipboard(text: string): void {
  clipboard.writeText(text);
  console.log('✅ Text copied to clipboard');
}

/**
 * Insert text into active window
 * Uses clipboard + paste shortcut for maximum compatibility
 */
export async function insertText(text: string): Promise<boolean> {
  try {
    // 1. Save current clipboard content
    const previousClipboard = clipboard.readText();
    
    // 2. Copy new text to clipboard
    clipboard.writeText(text);
    
    // 3. Wait a moment for clipboard to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 4. Simulate Ctrl+V (Cmd+V on Mac)
    const modifier = process.platform === 'darwin' ? 'command' : 'control';
    
    robot.keyTap('v', [modifier]);
    
    // 5. Wait for paste to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 6. Restore previous clipboard content
    clipboard.writeText(previousClipboard);
    
    console.log('✅ Text inserted successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to insert text:', error);
    return false;
  }
}

/**
 * Type text character by character (slower but more reliable)
 */
export async function typeText(text: string, delayMs: number = 10): Promise<boolean> {
  try {
    for (const char of text) {
      robot.typeString(char);
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    console.log('✅ Text typed successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to type text:', error);
    return false;
  }
}

/**
 * Get current clipboard content
 */
export function getClipboard(): string {
  return clipboard.readText();
}
