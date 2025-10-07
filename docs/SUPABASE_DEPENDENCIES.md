# Supabase 集成依赖

## 📦 需要安装的依赖包

### 1. Supabase 核心包

```bash
npm install @supabase/supabase-js
```

**用途**: Supabase JavaScript 客户端
- 数据库操作
- 认证
- 实时订阅
- 存储

### 2. Next.js Auth Helpers (可选，用于网页端)

```bash
npm install @supabase/auth-helpers-nextjs
```

**用途**: Next.js 认证集成
- 服务端认证
- 中间件保护
- Cookie 管理

### 3. Supabase Auth UI (可选，快速集成登录界面)

```bash
npm install @supabase/auth-ui-react @supabase/auth-ui-shared
```

**用途**: 预构建的认证 UI 组件
- 登录/注册表单
- 密码重置
- OAuth 按钮

## 📋 完整的 package.json 更新

```json
{
  "dependencies": {
    // ... 现有依赖
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/auth-helpers-nextjs": "^0.8.7",
    "@supabase/auth-ui-react": "^0.4.6",
    "@supabase/auth-ui-shared": "^0.1.8"
  },
  "devDependencies": {
    // ... 现有依赖
    "@types/node": "^20",
    "supabase": "^1.127.0"  // Supabase CLI (可选)
  }
}
```

## 🔧 环境变量配置

创建 `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Service Role Key (仅在服务端使用，不要暴露)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

添加到 `.gitignore`:

```bash
# Environment variables
.env.local
.env*.local
```

## 🚀 安装命令

```bash
# 一键安装所有 Supabase 相关依赖
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/auth-ui-react @supabase/auth-ui-shared

# 或使用 pnpm (如果项目使用 pnpm)
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/auth-ui-react @supabase/auth-ui-shared

# 安装 Supabase CLI (全局，用于数据库管理)
npm install -g supabase
```

## 📂 文件结构建议

```
src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Supabase 客户端
│   │   ├── server.ts          # 服务端客户端 (Next.js)
│   │   ├── auth.ts            # 认证相关函数
│   │   ├── storage.ts         # 存储操作
│   │   └── types.ts           # Supabase 类型定义
│   └── storage/
│       ├── storageManager.ts  # 存储管理器
│       └── sync.ts            # 同步逻辑
├── components/
│   └── auth/
│       ├── LoginForm.tsx      # 登录表单
│       ├── SignupForm.tsx     # 注册表单
│       └── AuthProvider.tsx   # 认证上下文
└── hooks/
    ├── useAuth.ts             # 认证 Hook
    ├── useSync.ts             # 同步 Hook
    └── useSupabase.ts         # Supabase Hook
```

## 🔐 TypeScript 类型支持

Supabase 可以自动生成 TypeScript 类型：

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref xxxxxxxxxxxxx

# 生成类型
supabase gen types typescript --project-id xxxxxxxxxxxxx > src/lib/supabase/database.types.ts
```

使用生成的类型：

```typescript
import { Database } from '@/lib/supabase/database.types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 现在有完整的类型支持
const { data } = await supabase
  .from('user_settings')
  .select('*')
  .single();
// data 有完整的类型提示
```

## 📊 版本兼容性

| Package | Version | Node.js | Notes |
|---------|---------|---------|-------|
| @supabase/supabase-js | ^2.39.0 | ≥16 | 主要包 |
| @supabase/auth-helpers-nextjs | ^0.8.7 | ≥16 | Next.js 14+ |
| @supabase/auth-ui-react | ^0.4.6 | ≥16 | React 18+ |

## 🎯 下一步

1. **立即可做**:
   ```bash
   npm install @supabase/supabase-js
   ```

2. **创建 Supabase 项目**:
   - 访问 https://supabase.com
   - 创建新项目
   - 复制 URL 和 Key

3. **运行数据库迁移**:
   - 执行 `docs/SUPABASE_SCHEMA.sql`

4. **实现认证 UI**:
   - 创建登录/注册页面
   - 集成 Auth UI 组件

5. **启用同步**:
   - 使用 StorageManager
   - 配置自动同步

---

**准备好开始了吗？运行以下命令开始集成：**

```bash
npm install @supabase/supabase-js
```
