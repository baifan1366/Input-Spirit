/**
 * Chrome AI Bridge
 * Creates a bridge between Electron and real Chrome browser for AI execution
 */

import { BrowserWindow, shell } from 'electron';
import http from 'http';

interface AIRequest {
  id: string;
  plugin: string;
  input: string;
  systemPrompt?: string;
}

interface AIResponse {
  id: string;
  success: boolean;
  result?: string;
  error?: string;
}

export class ChromeAIBridge {
  private server: http.Server | null = null;
  private port = 3001;
  private pendingRequests = new Map<string, (response: AIResponse) => void>();
  private chromeWindow: BrowserWindow | null = null;
  private requestQueue: AIRequest[] = [];
  private chromeReady = false;

  /**
   * Start the bridge server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        if (req.method === 'GET' && req.url === '/') {
          // Serve the Chrome AI client page
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(this.getClientHTML());
          return;
        }

        if (req.method === 'GET' && req.url === '/get-requests') {
          // Chrome client polls for pending requests
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ requests: this.requestQueue }));
          return;
        }

        if (req.method === 'POST' && req.url === '/chrome-ready') {
          // Chrome client signals it's ready
          this.chromeReady = true;
          console.log('✅ Chrome AI client is ready');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (req.method === 'POST' && req.url === '/ai-response') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const response: AIResponse = JSON.parse(body);
              console.log(`📥 Received AI response: ${response.id}`);
              
              // Remove from queue
              this.requestQueue = this.requestQueue.filter(r => r.id !== response.id);
              
              // Resolve promise
              const resolver = this.pendingRequests.get(response.id);
              if (resolver) {
                resolver(response);
                this.pendingRequests.delete(response.id);
              }
              
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } catch (error) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: 'Invalid request' }));
            }
          });
          return;
        }

        res.writeHead(404);
        res.end('Not found');
      });

      this.server.listen(this.port, () => {
        console.log(`✅ Chrome AI Bridge server started on port ${this.port}`);
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  /**
   * Open Chrome browser with AI client
   */
  async openChromeClient(): Promise<void> {
    const url = `http://localhost:${this.port}`;
    console.log(`🌐 Opening Chrome AI client: ${url}`);
    console.log(`💡 Please make sure you're using Chrome Canary/Dev with AI features enabled`);
    
    // Open in default browser (should be Chrome)
    await shell.openExternal(url);
  }

  /**
   * Execute AI request
   */
  async executeAI(request: AIRequest): Promise<string> {
    if (!this.chromeReady) {
      throw new Error('Chrome AI client not ready. Please open the Chrome window first.');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(request.id);
        this.requestQueue = this.requestQueue.filter(r => r.id !== request.id);
        reject(new Error('AI request timeout (30s)'));
      }, 30000);

      this.pendingRequests.set(request.id, (response) => {
        clearTimeout(timeout);
        if (response.success && response.result) {
          resolve(response.result);
        } else {
          reject(new Error(response.error || 'AI execution failed'));
        }
      });

      // Add to queue for Chrome client to poll
      this.requestQueue.push(request);
      console.log(`📤 Queued AI request: ${request.id} (plugin: ${request.plugin})`);
    });
  }

  /**
   * Get pending requests (for Chrome client to poll)
   */
  getPendingRequests(): AIRequest[] {
    // In a real implementation, maintain a queue
    return [];
  }

  /**
   * Stop the bridge server
   */
  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    if (this.chromeWindow) {
      this.chromeWindow.close();
      this.chromeWindow = null;
    }
  }

  /**
   * Get HTML for Chrome AI client
   */
  private getClientHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Input Spirit - Chrome AI Client</title>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 30px;
      margin: 20px 0;
    }
    .status {
      padding: 12px 20px;
      border-radius: 8px;
      margin: 10px 0;
      font-weight: 500;
    }
    .success { background: rgba(16, 185, 129, 0.3); }
    .error { background: rgba(239, 68, 68, 0.3); }
    .warning { background: rgba(251, 191, 36, 0.3); }
    .info { background: rgba(59, 130, 246, 0.3); }
    button {
      background: white;
      color: #667eea;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      margin: 5px;
    }
    button:hover { opacity: 0.9; }
    #log {
      background: rgba(0, 0, 0, 0.3);
      padding: 15px;
      border-radius: 8px;
      max-height: 300px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>🤖 Input Spirit - Chrome AI Client</h1>
  
  <div class="card">
    <h2>Status</h2>
    <div id="status" class="status info">Checking Chrome AI availability...</div>
    <div id="capabilities"></div>
  </div>

  <div class="card">
    <h2>Controls</h2>
    <button onclick="checkAI()">Check AI Status</button>
    <button onclick="testAI()">Test AI</button>
  </div>

  <div class="card">
    <h2>Activity Log</h2>
    <div id="log"></div>
  </div>

  <script>
    let aiAvailable = false;
    let aiSession = null;

    function log(message, type = 'info') {
      const logDiv = document.getElementById('log');
      const time = new Date().toLocaleTimeString();
      logDiv.innerHTML += \`<div>[‎\${time}] \${message}</div>\`;
      logDiv.scrollTop = logDiv.scrollHeight;
    }

    async function checkAI() {
      log('Checking Chrome AI availability...');
      
      if (!window.ai?.languageModel) {
        updateStatus('Chrome AI not available. Please use Chrome Canary/Dev with AI features enabled.', 'error');
        log('❌ window.ai.languageModel not found', 'error');
        log('User Agent: ' + navigator.userAgent);
        return false;
      }

      try {
        const capabilities = await window.ai.languageModel.capabilities();
        log('Capabilities: ' + JSON.stringify(capabilities));
        
        if (capabilities.available === 'no') {
          updateStatus('Chrome AI is not available on this system', 'error');
          return false;
        }

        if (capabilities.available === 'after-download') {
          updateStatus('Chrome AI model needs to be downloaded first', 'warning');
          document.getElementById('capabilities').innerHTML = 
            '<p>Please download the AI model in chrome://components</p>';
          return false;
        }

        aiAvailable = true;
        updateStatus('Chrome AI is ready! ✨', 'success');
        document.getElementById('capabilities').innerHTML = 
          \`<p>Temperature: \${capabilities.defaultTemperature}, Max TopK: \${capabilities.maxTopK}</p>\`;
        log('✅ Chrome AI ready');
        
        // Start polling for requests
        startPolling();
        return true;
      } catch (error) {
        updateStatus('Error checking AI: ' + error.message, 'error');
        log('❌ Error: ' + error.message, 'error');
        return false;
      }
    }

    async function testAI() {
      if (!aiAvailable) {
        alert('Please check AI status first');
        return;
      }

      log('Testing AI with a simple prompt...');
      try {
        const session = await window.ai.languageModel.create({
          systemPrompt: 'You are a helpful assistant.',
          temperature: 0.7
        });
        
        const response = await session.prompt('Say hello!');
        log('✅ AI Response: ' + response, 'success');
        alert('AI Test Successful!\\n\\n' + response);
        
        session.destroy();
      } catch (error) {
        log('❌ Test failed: ' + error.message, 'error');
        alert('Test failed: ' + error.message);
      }
    }

    function updateStatus(message, type) {
      const statusDiv = document.getElementById('status');
      statusDiv.textContent = message;
      statusDiv.className = 'status ' + type;
    }

    async function startPolling() {
      log('Started polling for AI requests from Electron');
      
      // Notify server that Chrome is ready
      try {
        await fetch('http://localhost:3001/chrome-ready', { method: 'POST' });
      } catch (error) {
        log('Failed to notify ready status', 'error');
      }
      
      // Poll for requests every 500ms
      setInterval(async () => {
        try {
          const response = await fetch('http://localhost:3001/get-requests');
          const data = await response.json();
          
          if (data.requests && data.requests.length > 0) {
            for (const request of data.requests) {
              processRequest(request);
            }
          }
        } catch (error) {
          // Silently fail
        }
      }, 500);
    }

    async function processRequest(request) {
      log(\`Processing request: \${request.id}\`);
      
      try {
        // Create AI session
        const session = await window.ai.languageModel.create({
          systemPrompt: request.systemPrompt || 'You are a helpful assistant.',
          temperature: 0.7
        });
        
        // Extract query from input
        const match = request.input.match(/^[a-z]+:\\s*(.+)/i);
        const query = match ? match[1] : request.input;
        
        log(\`Sending to AI: "\${query}"\`);
        const result = await session.prompt(query);
        log(\`✅ Got response (\${result.length} chars)\`, 'success');
        
        session.destroy();
        
        // Send response back to Electron
        await fetch('http://localhost:3001/ai-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: request.id,
            success: true,
            result: result
          })
        });
        
      } catch (error) {
        log(\`❌ Error: \${error.message}\`, 'error');
        
        // Send error back
        await fetch('http://localhost:3001/ai-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: request.id,
            success: false,
            error: error.message
          })
        });
      }
    }

    // Check AI on load
    window.addEventListener('load', () => {
      setTimeout(checkAI, 500);
    });
  </script>
</body>
</html>
    `;
  }
}

// Singleton
let bridgeInstance: ChromeAIBridge | null = null;

export function getChromeAIBridge(): ChromeAIBridge {
  if (!bridgeInstance) {
    bridgeInstance = new ChromeAIBridge();
  }
  return bridgeInstance;
}

export function cleanupChromeAIBridge(): void {
  if (bridgeInstance) {
    bridgeInstance.stop();
    bridgeInstance = null;
  }
}
