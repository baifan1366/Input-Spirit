# Input Spirit - 快速开始指南

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发模式

```bash
npm run dev
```

这会同时启动：
- Next.js 开发服务器 (http://localhost:3000)
- Electron 应用

## 📋 核心功能

### 本地功能（无需配置）

#### ✅ 已实现
- **AI 插件系统** - 5个内置插件
  - AI Assistant (ai:)
  - Prompt Enhancer (prompt:)
  - Grammar Checker (fix:)
  - Translator (translate:)
  - Article Writer (write:)
- **Overlay 浮层** - Ctrl+Shift+Space 唤起
- **设置管理** - 本地持久化存储
- **系统托盘** - 最小化到托盘
- **多语言** - 中文/英文

### 云端功能（需要 Supabase 配置）

#### 🔧 可选配置
- **用户认证** - Email/Google/GitHub 登录
- **设置同步** - 多设备配置同步
- **自定义插件云存储**
- **插件市场**（开发中）
- **工作流云同步**（开发中）

## 🎯 基础使用

### 1. 打开 Overlay

按下 `Ctrl+Shift+Space` 在任何地方唤起 AI Overlay

### 2. 使用插件

在 Overlay 输入框中输入命令：

```
ai: what is quantum computing?
```

```
fix: I has went to the store yesterday
```

```
translate: en->zh Hello, how are you?
```

```
write: the future of AI
```

```
prompt: write a story
```

### 3. 查看结果

AI 会处理你的请求并在 Overlay 中显示结果，你可以：
- 📋 **复制** - 复制到剪贴板
- 📤 **插入** - 插入到活动窗口（开发中）
- 🔄 **重新生成** - 重新执行命令

## ⚙️ 配置 Supabase（可选）

如果你想启用云端同步功能：

### 步骤 1: 创建 Supabase 项目

1. 访问 https://supabase.com
2. 创建新项目
3. 等待项目初始化完成

### 步骤 2: 运行数据库迁移

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `docs/SUPABASE_SCHEMA.sql` 的内容
4. 粘贴并执行

### 步骤 3: 配置环境变量

```bash
# 1. 复制模板文件
cp env.template .env.local

# 2. 编辑 .env.local
# 填入你的 Supabase URL 和 Anon Key
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 步骤 4: 启用 OAuth（可选）

在 Supabase Dashboard → Authentication → Providers 中启用：
- ✅ Google
- ✅ GitHub

### 步骤 5: 重启应用

```bash
npm run dev
```

## 🔑 使用认证

### 注册/登录

1. 访问 http://localhost:3000/en/auth
2. 使用 Email 或 OAuth 登录
3. 登录后自动启用云端同步

### 查看同步状态

1. 访问设置页面 http://localhost:3000/en/settings
2. 右上角显示用户信息和同步状态

## 📂 项目结构

```
Input-Spirit/
├── main/                    # Electron 主进程
│   ├── modules/            # 核心模块
│   │   ├── chromeAI.ts    # Chrome AI 适配器
│   │   ├── pluginManager.ts
│   │   ├── configManager.ts
│   │   └── storageManager.ts
│   ├── plugins/            # 内置插件
│   │   ├── aiAssistant.ts
│   │   ├── promptEnhancer.ts
│   │   ├── grammarChecker.ts
│   │   ├── translator.ts
│   │   └── articleWriter.ts
│   └── types/              # TypeScript 类型
├── app/                     # Next.js 应用
│   ├── [locale]/
│   │   ├── page.tsx       # 主页
│   │   ├── auth/          # 登录页面
│   │   ├── settings/      # 设置页面
│   │   └── overlay/       # Overlay 页面
├── lib/                     # 工具库
│   └── supabase/          # Supabase 集成
│       ├── client.ts
│       ├── auth.ts
│       └── sync.ts
├── hooks/                   # React Hooks
│   └── useAuth.ts
└── docs/                    # 文档
    ├── SUPABASE_SCHEMA.sql
    ├── SUPABASE_INTEGRATION.md
    └── MVP_SETUP.md
```

## 🔧 开发命令

```bash
# 启动开发模式
npm run dev

# 编译 Electron 主进程
npm run build:electron

# 构建生产版本
npm run build

# 打包应用
npm run make
```

## 🐛 常见问题

### Q: Overlay 不显示？

A: 检查：
1. 是否按下 `Ctrl+Shift+Space`
2. Electron 是否正常运行
3. 查看控制台错误

### Q: Chrome AI 不可用？

A: Chrome Built-in AI 需要：
1. Chrome Canary 或 Dev 版本
2. 启用实验性功能
3. 加入 Early Preview Program

详见：`docs/MVP_SETUP.md`

### Q: Supabase 同步失败？

A: 检查：
1. `.env.local` 配置是否正确
2. 数据库是否已运行迁移
3. 网络连接是否正常

### Q: TypeScript 报错？

A: 尝试：
```bash
# 重新编译
npm run build:electron

# 重启 VS Code TypeScript 服务器
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

## 📖 更多文档

- **完整文档**: [README.md](../README.md)
- **技术栈**: [TECH_STACK.md](./TECH_STACK.md)
- **开发规范**: [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md)
- **项目路线图**: [PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md)
- **Supabase 集成**: [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md)
- **MVP 设置**: [MVP_SETUP.md](./MVP_SETUP.md)

## 🎯 下一步

### 初学者
1. ✅ 启动应用体验基础功能
2. ✅ 尝试不同的 AI 插件命令
3. ✅ 浏览设置页面

### 进阶用户
1. 🔧 配置 Supabase 启用云端同步
2. 💡 创建自定义插件
3. 📱 测试多设备同步

### 开发者
1. 📚 阅读技术文档
2. 🔍 查看源代码
3. 🚀 贡献代码

## 💬 支持

遇到问题？

1. 查看 [常见问题](#-常见问题)
2. 查阅完整文档
3. 提交 Issue

## 🎉 开始使用

```bash
npm run dev
```

按下 `Ctrl+Shift+Space` 开始你的 AI 之旅！

---

**Happy Coding!** 🚀
