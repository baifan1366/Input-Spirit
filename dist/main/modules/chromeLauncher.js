"use strict";
/**
 * Chrome Launcher
 * Launch Chrome browser with Prompt API enabled for AI features
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromeLauncher = void 0;
exports.getChromeLauncher = getChromeLauncher;
exports.cleanupChromeLauncher = cleanupChromeLauncher;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
class ChromeLauncher {
    constructor() {
        this.chromeProcess = null;
        this.wsServer = null; // WebSocket server for communication
        this.chromeClients = new Set();
        // Use a dedicated Chrome profile for the app
        this.userDataDir = path_1.default.join(os_1.default.tmpdir(), 'input-spirit-chrome-profile');
    }
    /**
     * Start WebSocket server for Electron <-> Chrome communication
     */
    async startWSServer() {
        const WebSocket = require('ws');
        const wss = new WebSocket.Server({ port: 3002 });
        wss.on('connection', (ws) => {
            console.log('📡 Chrome client connected to WebSocket');
            this.chromeClients.add(ws);
            ws.on('close', () => {
                console.log('📡 Chrome client disconnected');
                this.chromeClients.delete(ws);
            });
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    console.log('📥 Received from Chrome:', data);
                }
                catch (error) {
                    console.error('Failed to parse WS message:', error);
                }
            });
        });
        this.wsServer = wss;
        console.log('✅ WebSocket server started on port 3002');
    }
    /**
     * Send message to Chrome window
     */
    sendToChrome(message) {
        const payload = JSON.stringify(message);
        this.chromeClients.forEach(client => {
            if (client.readyState === 1) { // OPEN
                client.send(payload);
            }
        });
    }
    /**
     * Get Chrome executable path based on platform
     */
    getChromePath() {
        const platform = os_1.default.platform();
        if (platform === 'win32') {
            // Windows - try multiple locations
            const paths = [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                path_1.default.join(os_1.default.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
                // Chrome Canary
                path_1.default.join(os_1.default.homedir(), 'AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe'),
                // Chrome Dev
                'C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe',
            ];
            // Return first existing path
            const fs = require('fs');
            for (const p of paths) {
                if (fs.existsSync(p)) {
                    console.log(`✅ Found Chrome at: ${p}`);
                    return p;
                }
            }
        }
        else if (platform === 'darwin') {
            // macOS
            return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        }
        else {
            // Linux
            return 'google-chrome';
        }
        throw new Error('Chrome executable not found');
    }
    /**
     * Launch Chrome with AI features enabled
     */
    async launch(url = 'http://localhost:3000') {
        const chromePath = this.getChromePath();
        console.log('🚀 Launching Chrome with AI features...');
        console.log(`📍 Chrome path: ${chromePath}`);
        console.log(`🌐 URL: ${url}`);
        console.log(`📁 Profile: ${this.userDataDir}`);
        const args = [
            // Run as app window (no browser UI)
            `--app=${url}`,
            // Use dedicated profile
            `--user-data-dir=${this.userDataDir}`,
            // Enable Chrome AI features
            '--enable-features=PromptAPI,AIPrompt,Optimization GuideOnDeviceModel',
            '--enable-blink-features=PromptAPI,AIPrompt',
            // Additional helpful flags
            '--disable-web-security', // Allow localhost CORS
            '--disable-features=IsolateOrigins,site-per-process', // Better localhost access
            '--allow-running-insecure-content',
            // Window size
            '--window-size=1200,800',
            // Start maximized (optional)
            // '--start-maximized',
        ];
        try {
            this.chromeProcess = (0, child_process_1.spawn)(chromePath, args, {
                detached: false,
                stdio: 'ignore',
            });
            this.chromeProcess.on('error', (error) => {
                console.error('❌ Chrome process error:', error);
            });
            this.chromeProcess.on('exit', (code) => {
                console.log(`🔴 Chrome process exited with code: ${code}`);
                this.chromeProcess = null;
            });
            console.log('✅ Chrome launched successfully');
            console.log(`💡 Chrome PID: ${this.chromeProcess.pid}`);
        }
        catch (error) {
            console.error('❌ Failed to launch Chrome:', error);
            throw error;
        }
    }
    /**
     * Check if Chrome is running
     */
    isRunning() {
        return this.chromeProcess !== null && !this.chromeProcess.killed;
    }
    /**
     * Kill Chrome process
     */
    kill() {
        if (this.chromeProcess && !this.chromeProcess.killed) {
            console.log('🛑 Killing Chrome process...');
            this.chromeProcess.kill();
            this.chromeProcess = null;
        }
    }
}
exports.ChromeLauncher = ChromeLauncher;
// Singleton
let launcherInstance = null;
function getChromeLauncher() {
    if (!launcherInstance) {
        launcherInstance = new ChromeLauncher();
    }
    return launcherInstance;
}
function cleanupChromeLauncher() {
    if (launcherInstance) {
        launcherInstance.kill();
        launcherInstance = null;
    }
}
