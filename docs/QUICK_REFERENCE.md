# Input Spirit - Quick Reference Guide

## 🎯 Project Overview
**Input Spirit** is an Electron-based desktop AI assistant for the **Google Chrome Built-in AI Challenge 2025** that provides global AI capabilities in any input field using Chrome's Built-in AI APIs (Gemini Nano).

## 📁 Documentation Files

1. **[HACKATHON_REQUIREMENTS.md](./HACKATHON_REQUIREMENTS.md)** - Complete hackathon requirements, prizes, judging criteria
2. **[TECH_STACK.md](./TECH_STACK.md)** - Detailed technology stack documentation
3. **[DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md)** - Development guidelines and best practices
4. **[ELECTRON_API_REFERENCE.md](./ELECTRON_API_REFERENCE.md)** - Electron API usage examples
5. **[README.md](./README.md)** - Full project documentation with architecture

## 🚀 Core Technology Stack

### Primary Technologies
| Technology | Purpose | Priority |
|-----------|---------|----------|
| **Electron** | Desktop app framework | ⭐⭐⭐ |
| **Chrome Web AI APIs** | Offline AI (Gemini Nano) | ⭐⭐⭐ |
| **React + Tailwind** | UI framework | ⭐⭐⭐ |
| **TypeScript** | Type safety | ⭐⭐⭐ |
| **iohook** | Global input monitoring | ⭐⭐⭐ |
| **MCP Protocol** | Context sharing | ⭐⭐ |

### Chrome Built-in AI APIs (MUST USE)
1. **💭 Prompt API** - Multimodal (text, image, audio)
2. **🔤 Proofreader API** - Grammar correction
3. **📄 Summarizer API** - Text summarization
4. **🌐 Translator API** - Multi-language translation
5. **✏️ Writer API** - Content generation
6. **🖊️ Rewriter API** - Content improvement

## 🏗️ Architecture Overview

```
┌─────────────────────────────────┐
│     Electron Main Process       │
│  ┌───────────────────────────┐  │
│  │ Global Input Monitor      │  │
│  │ (iohook)                  │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ Plugin Manager            │  │
│  │ - Load/Execute Plugins    │  │
│  │ - Timeout & Abort Control │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ Workflow Engine           │  │
│  │ - Chain Plugins           │  │
│  │ - Context Passing         │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ Chrome Web AI Adapter     │  │
│  │ - Prompt API              │  │
│  │ - Other AI APIs           │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ MCP Server                │  │
│  │ - Context Sharing         │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
            │
            │ IPC
            ▼
┌─────────────────────────────────┐
│   Electron Renderer Process     │
│  ┌───────────────────────────┐  │
│  │ Overlay Window (React)    │  │
│  │ - AI Response Display     │  │
│  │ - Toast Notifications     │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ Settings UI               │  │
│  │ - Config Management       │  │
│  │ - Plugin Management       │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

## ⚡ Quick Start Commands

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

## 🔑 Key Implementation Points

### 1. Single Instance Lock
```javascript
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) app.quit()
```

### 2. Global Input Monitoring with iohook
```javascript
// Monitor ALL keyboard input globally using iohook
// Works in ANY application - Gmail, VSCode, Discord, etc.
import iohook from 'iohook';

// Listen to every keystroke
iohook.on('keypress', (event) => {
  // Build input buffer
  const char = String.fromCharCode(event.keychar);
  inputBuffer += char;
  
  // Check for trigger patterns: "ai:", "fix:", "translate:"
  const match = detectTrigger(inputBuffer);
  if (match) {
    // Auto-show overlay and execute plugin
    showOverlay();
    executePlugin(match);
  }
});

iohook.start(); // Start global monitoring
```

### 3. Plugin System
```typescript
export interface Plugin {
  name: string
  trigger: RegExp | ((input: string) => boolean)
  run: (ctx: PluginContext) => Promise<any>
  timeoutMs?: number
}
```

### 4. Chrome Web AI Integration
```javascript
// Use Chrome's built-in AI
const response = await ai.generate(prompt, {
  model: 'gemini-nano',
  temperature: 0.7
})
```

### 5. Overlay UI
```javascript
// Show AI response in overlay
overlayWindow.webContents.send('show-response', {
  content: aiResponse,
  actions: ['insert', 'copy', 'regenerate']
})
```

## 📋 MVP Feature Checklist

### Core Features (Must Have)
- [ ] Global input monitoring with trigger detection
- [ ] Overlay UI with AI response display
- [ ] Integration with ≥3 Chrome Web AI APIs
- [ ] Plugin system with ≥3 working plugins
- [ ] Offline functionality (Gemini Nano)
- [ ] Basic configuration UI
- [ ] System tray integration

### Plugins (Priority Order)
1. [ ] **prompt-enhancer** - Optimize user prompts (Prompt API)
2. [ ] **article-writer** - Generate articles (Writer API + Prompt API)
3. [ ] **grammar-checker** - Fix grammar (Proofreader API)
4. [ ] **translator** - Multi-language support (Translator API)
5. [ ] **summarizer** - Text summarization (Summarizer API)

### Advanced Features (Nice to Have)
- [ ] Workflow system with visual editor
- [ ] MCP integration for Claude/Cursor
- [ ] Plugin marketplace
- [ ] Custom hotkeys
- [ ] Multi-language UI

## 🎬 Demo Scenarios

### Scenario 1: Email Writing (Gmail)
1. Open Gmail compose window in browser
2. Type directly in compose field: `ai: write a thank you email to my team`
3. **Overlay automatically appears** with AI-generated email
4. Click "Insert" to paste into Gmail - no copy/paste needed!

### Scenario 2: Code Fix (VSCode)
1. In VSCode, type in any file: `fix: undefined function error in line 42`
2. **Overlay auto-triggers** and AI analyzes the error
3. AI suggests fix immediately
4. Insert solution back to VSCode

### Scenario 3: Translation (Discord/Slack)
1. In Discord chat: `translate: zh->en 谢谢你的帮助`
2. **AI instantly translates** while you type
3. Translated text: "Thank you for your help"
4. Insert into chat

### Scenario 4: Article Writing (Notion)
1. In Notion page: `ai: write introduction paragraph about climate change`
2. **AI generates professional content** on-the-fly
3. Review and insert directly

### Key Feature: Works EVERYWHERE
- ✅ Gmail, Outlook (web & desktop)
- ✅ VSCode, Visual Studio, any IDE
- ✅ Discord, Slack, Teams
- ✅ Notion, Obsidian, Word
- ✅ Facebook, Twitter, Reddit
- ✅ ANY text field in ANY application!

## 🎯 Judging Criteria Alignment

| Criteria | How to Address | Score Target |
|----------|---------------|--------------|
| **Functionality** | Multi-app support, scalable plugin system | 9/10 |
| **Purpose** | Solves "AI everywhere" problem, new web capability | 9/10 |
| **Content** | Modern UI, creative trigger system | 8/10 |
| **User Experience** | Non-invasive overlay, fast feedback | 9/10 |
| **Technical Execution** | Showcase all 6+ Chrome AI APIs | 10/10 |

## 📊 Success Metrics

### Technical
- ✅ Uses ≥3 Chrome Web AI APIs
- ✅ < 2s application launch time
- ✅ < 100ms input detection latency
- ✅ Full offline functionality
- ✅ Plugin system with ≥3 working plugins

### User Experience
- ✅ Works in ≥5 different applications
- ✅ Clear visual feedback for all actions
- ✅ Easy plugin installation
- ✅ Intuitive configuration

### Demo Quality
- ✅ < 3 minute video
- ✅ Clear problem statement
- ✅ Multiple compelling use cases
- ✅ Smooth demonstration without errors

## 🚫 Common Pitfalls to Avoid

1. ❌ **Don't** mock Chrome AI APIs - use real implementation
2. ❌ **Don't** require internet for core features
3. ❌ **Don't** create monolithic code files
4. ❌ **Don't** skip error handling
5. ❌ **Don't** hard-code sensitive data
6. ❌ **Don't** over-engineer MVP features
7. ❌ **Don't** forget to test on fresh system
8. ❌ **Don't** submit without open source license

## 🔗 Essential Links

### Documentation
- [Chrome Built-in AI Early Preview Program](https://developer.chrome.com/docs/ai/join-epp)
- [Chrome AI APIs Documentation](https://developer.chrome.com/docs/ai)
- [Electron Documentation](https://www.electronjs.org/docs/latest/)
- [MCP Protocol](https://modelcontextprotocol.io/)

### Hackathon
- [Challenge Page](https://googlechromeai2025.devpost.com/)
- [Official Rules](https://googlechromeai2025.devpost.com/rules)
- [Submission Requirements](https://googlechromeai2025.devpost.com/details/submission)

### Community
- [Chrome AI Discord](https://discord.gg/chrome-ai)
- [Electron Discord](https://discord.gg/electron)

## 🎯 Development Priority

### Phase 1: Foundation (Week 1-2)
1. Setup Electron project structure
2. Implement global input monitoring
3. Create overlay UI (React + Tailwind)
4. Integrate Chrome Web AI APIs (basic)

### Phase 2: Core Features (Week 3-4)
1. Build plugin system
2. Implement 3+ plugins
3. Add configuration system
4. System tray integration

### Phase 3: Polish (Week 5)
1. UI/UX improvements
2. Error handling & edge cases
3. Performance optimization
4. Documentation

### Phase 4: Demo & Submission (Week 6)
1. Record demo video
2. Prepare GitHub repository
3. Write submission description
4. Test on fresh system
5. Submit to Devpost

## 📝 Submission Checklist

- [ ] Public GitHub repository with MIT license
- [ ] Working demo (easy to run/test)
- [ ] Demo video < 3 minutes (YouTube/Vimeo)
- [ ] Comprehensive README
- [ ] All text/video in English
- [ ] Uses ≥3 Chrome Web AI APIs
- [ ] Clear problem statement in description
- [ ] Testing instructions included
- [ ] Builds successfully on fresh system

## 💡 Pro Tips

1. **Prioritize demo-visible features** - Focus on what shows well in video
2. **Test in real apps** - Gmail, Notion, VSCode, Discord, etc.
3. **Optimize for judging criteria** - Address each criterion explicitly
4. **Keep it simple** - MVP over feature bloat
5. **Document decisions** - Explain architectural choices
6. **Early testing** - Test with Chrome Canary/Dev channel
7. **Backup plan** - Have fallbacks for API availability
8. **Polish UI** - First impressions matter in demo video

---

## 🎬 Quick Command Reference

```bash
# Project setup
pnpm create electron-app input-spirit --template=webpack-typescript
cd input-spirit
pnpm install

# Add dependencies
pnpm add react react-dom
pnpm add -D @types/react @types/react-dom
pnpm add tailwindcss postcss autoprefixer
pnpm add iohook electron-store

# Development
pnpm dev              # Start dev mode
pnpm build           # Build production
pnpm package         # Create distributable
pnpm lint            # Run linter
pnpm test            # Run tests

# Git workflow
git add .
git commit -m "feat: add plugin system"
git push origin main
git tag v1.0.0
```

---

**Last Updated**: 2025-10-07  
**Project Status**: Initial Planning  
**Target**: Google Chrome Built-in AI Challenge 2025  
**Prize Target**: Most Helpful (Web Application or Chrome Extension)
