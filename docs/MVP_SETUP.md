# Input Spirit MVP - Setup & Testing Guide

## 📋 项目状态

✅ **已完成的核心模块**

### 后端 (Electron Main Process)
- ✅ Chrome AI 适配器 (`main/modules/chromeAI.ts`)
  - 集成 Chrome Built-in AI APIs (Prompt, Proofreader, Writer, Translator, Summarizer)
  - 使用 BrowserView 访问 window.ai
  
- ✅ 插件管理器 (`main/modules/pluginManager.ts`)
  - 插件注册、执行、超时控制
  - 事件系统
  
- ✅ 输入监控器 (`main/modules/inputMonitor.ts`)
  - 全局快捷键 (Ctrl+Shift+Space)
  - 触发词检测
  
- ✅ 配置管理器 (`main/modules/configManager.ts`)
  - electron-store 持久化
  - 插件启用/禁用
  
- ✅ 5个内置插件
  1. **ai-assistant** - 通用AI助手
  2. **prompt-enhancer** - 提示词优化
  3. **grammar-checker** - 语法检查
  4. **translator** - 多语言翻译
  5. **article-writer** - 文章生成

### 前端 (React + Next.js)
- ✅ Overlay 浮层界面 (`app/overlay/page.tsx`)
  - 输入框 + 结果显示
  - 动画效果 (Framer Motion)
  - 操作按钮 (复制、插入、重新生成)
  
- ✅ Settings 设置界面 (`app/settings/page.tsx`)
  - 插件管理
  - 使用示例展示

### 通信层
- ✅ Preload 脚本 (`main/preload.ts`)
  - 安全的 IPC 通道暴露
  - TypeScript 类型定义

## 🚀 快速启动

### 1. 检查依赖安装状态

```bash
# 查看 package.json 中的依赖
npm list --depth=0
```

应该包含：
- ✅ electron-store
- ✅ framer-motion
- ✅ robotjs (可选，当前未使用)

### 2. 编译 TypeScript

```bash
npm run build:electron
```

这会编译 `main/` 目录下的所有 TypeScript 文件到 `dist/main/`

### 3. 启动开发模式

```bash
npm run dev
```

这会：
1. 启动 Next.js 开发服务器 (http://localhost:3000)
2. 编译 Electron 主进程
3. 启动 Electron 应用

## 🎯 功能测试清单

### 测试 1: 应用启动
- [ ] Electron 窗口成功打开
- [ ] 主窗口显示 Next.js 应用
- [ ] 控制台输出初始化日志
- [ ] 系统托盘图标显示

**预期日志输出：**
```
✅ Main window created
✅ Overlay window created
✅ System tray created
📝 Config loaded
🤖 Chrome AI initialized
📦 5 plugins registered
✅ Input monitor started (Shortcut: Ctrl+Shift+Space)
🎉 Input Spirit is ready!
```

### 测试 2: 快捷键触发
- [ ] 按下 `Ctrl+Shift+Space`
- [ ] Overlay 窗口在屏幕中央显示
- [ ] 输入框自动获得焦点

### 测试 3: AI Assistant 插件
**输入：** `ai: what is machine learning?`

**预期输出：**
- [ ] 显示加载动画
- [ ] 3-5秒后显示AI回复
- [ ] 元数据显示 (处理时间、模型)
- [ ] 操作按钮显示 (复制、插入、重新生成)

### 测试 4: Grammar Checker 插件
**输入：** `fix: I has went to the store yesterday`

**预期输出：**
- [ ] 显示原文和修正后的文本
- [ ] 列出具体的语法错误
- [ ] 提供"插入"和"复制"按钮

### 测试 5: Translator 插件
**输入：** `translate: en->zh Hello, how are you?`

**预期输出：**
- [ ] 显示原文和翻译结果
- [ ] 标注源语言和目标语言
- [ ] 提供操作按钮

### 测试 6: 设置页面
- [ ] 打开设置页面
- [ ] 显示所有5个插件
- [ ] 可以启用/禁用插件
- [ ] 显示使用示例

## ⚠️ 重要注意事项

### Chrome AI API 可用性

**当前实现使用 Chrome 的实验性 AI 功能，需要：**

1. **使用 Chrome Canary 或 Chrome Dev**
   - 下载：https://www.google.com/chrome/canary/
   
2. **启用实验性功能**
   - 打开 `chrome://flags`
   - 搜索并启用：
     - `#optimization-guide-on-device-model`
     - `#prompt-api-for-gemini-nano`
   - 重启浏览器

3. **加入 Early Preview Program**
   - https://developer.chrome.com/docs/ai/join-epp

### 当前限制

1. **Chrome AI 初始化**
   - 如果 Chrome AI APIs 不可用，会输出警告但不会阻止应用启动
   - 需要检查控制台日志确认 AI 是否可用

2. **输入监控**
   - 当前使用全局快捷键而非真正的全局输入监控
   - 用户需要主动按快捷键打开 Overlay
   - Windows 上真正的键盘监听需要管理员权限

3. **插件执行**
   - 超时设置为 8000ms (8秒)
   - 如果AI响应慢，可能触发超时

## 🐛 常见问题排查

### 问题 1: Electron 无法启动

**症状：** `npm run dev` 后没有窗口打开

**检查：**
```bash
# 确认 TypeScript 编译成功
npm run build:electron

# 检查 dist/main/main.js 是否存在
ls dist/main/
```

### 问题 2: Chrome AI 不可用

**症状：** 控制台显示 "Chrome Built-in AI APIs not available"

**解决：**
1. 确认使用 Chrome Canary
2. 检查实验性功能已启用
3. 查看 Chrome 版本是否支持 (需要 127+)

### 问题 3: Overlay 不显示

**症状：** 按快捷键后没有窗口弹出

**检查：**
```javascript
// 在 Electron DevTools Console 中检查
console.log(BrowserWindow.getAllWindows())
// 应该显示 2 个窗口 (main + overlay)
```

### 问题 4: IPC 通信失败

**症状：** 前端点击按钮无反应

**检查：**
1. preload.ts 是否正确加载
2. 在浏览器控制台检查：`window.electronAPI`
3. 查看 Electron 主进程日志

## 📝 开发日志

### 已实现功能
- ✅ 完整的插件系统架构
- ✅ Chrome AI 集成（需要实际环境测试）
- ✅ 5个核心插件
- ✅ Overlay UI 界面
- ✅ 设置管理界面
- ✅ 配置持久化
- ✅ 系统托盘

### 待优化
- ⏳ Chrome AI 真实环境测试
- ⏳ 真正的全局输入监听 (需要原生模块)
- ⏳ 流式响应支持
- ⏳ 更多动画和过渡效果
- ⏳ 错误处理改进
- ⏳ 性能优化

### 下一步计划
1. **测试 Chrome AI 集成**
   - 在支持 AI 的 Chrome 环境中测试
   - 验证所有 AI APIs 是否正常工作
   
2. **UI 优化**
   - 添加更多加载状态
   - 改进错误提示
   - 增加主题切换
   
3. **功能增强**
   - 实现 Workflow 系统
   - 添加 MCP 集成
   - 支持自定义插件

## 🎬 演示脚本准备

### Demo 场景 1: Email 写作 (Gmail)
```
1. 打开 Gmail 新邮件
2. Ctrl+Shift+Space 打开 Overlay
3. 输入: ai: write a thank you email to my team for completing the project
4. 等待 AI 生成
5. 点击"复制"
6. 粘贴到 Gmail
```

### Demo 场景 2: 代码错误修复
```
1. VSCode 中有错误信息
2. 复制错误信息
3. Ctrl+Shift+Space
4. 输入: ai: how to fix this error: [粘贴错误]
5. AI 给出解决方案
6. 复制方案回到 VSCode
```

### Demo 场景 3: 翻译
```
1. 任意应用
2. Ctrl+Shift+Space
3. 输入: translate: zh->en 非常感谢您的帮助
4. 即时翻译
5. 插入结果
```

## 📊 性能指标目标

- ✅ 应用启动时间: < 2秒
- ✅ Overlay 显示延迟: < 100ms
- ⏳ AI 响应时间: < 3秒 (取决于 Chrome AI)
- ✅ 内存占用: < 150MB (空闲)

## 🔗 相关资源

- [Chrome Built-in AI Documentation](https://developer.chrome.com/docs/ai)
- [Electron Documentation](https://www.electronjs.org/docs/latest/)
- [Project Roadmap](./PROJECT_ROADMAP.md)
- [Development Rules](./DEVELOPMENT_RULES.md)
- [Tech Stack](./TECH_STACK.md)

---

**最后更新:** 2025-10-07
**当前状态:** MVP 基础架构完成，等待 Chrome AI 真实环境测试
