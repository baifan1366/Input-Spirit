# Supabase Integration Guide

## 📋 概述

Input Spirit 使用 Supabase 实现：
- ✅ 用户认证和登录
- ✅ 设置同步（跨设备）
- ✅ 自定义插件云端存储
- ✅ 工作流同步
- ✅ 插件市场

## 🗄️ 数据库架构

### 核心表结构

```
users (扩展 auth.users)
├── user_settings (JSONB 存储完整配置)
├── custom_plugins (用户自定义插件)
├── user_workflows (用户工作流)
└── sync_logs (同步日志)

marketplace_plugins (插件市场)
└── plugin_reviews (插件评价)
```

### 数据流

```
本地 Electron Store ←→ Supabase PostgreSQL
      │                        │
      │                        ├── 设置同步
      │                        ├── 插件同步
      │                        └── 工作流同步
      │
      └── 冲突检测和解决
```

## 🚀 设置步骤

### 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)
2. 创建新项目
3. 记录以下信息：
   - Project URL: `https://xxx.supabase.co`
   - Anon Key: `eyJhbGc...`

### 2. 运行数据库迁移

在 Supabase SQL Editor 中运行：

```bash
# 执行 schema 脚本
cat docs/SUPABASE_SCHEMA.sql
# 复制内容到 Supabase SQL Editor 并执行
```

### 3. 配置环境变量

创建 `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Optional: Custom domain
# NEXT_PUBLIC_SUPABASE_URL=https://api.yourdomain.com
```

### 4. 安装依赖

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 5. 启用认证提供商

在 Supabase Dashboard > Authentication > Providers 中启用：
- ✅ Email/Password
- ✅ Google OAuth (推荐)
- ✅ GitHub OAuth (可选)

## 💻 代码集成

### 创建 Supabase Client

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 用户认证

```typescript
// 登录
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Google OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
});

// 登出
await supabase.auth.signOut();

// 监听认证状态
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // 启用同步
    storageManager.enableSync(session.user.id);
  } else if (event === 'SIGNED_OUT') {
    // 禁用同步
    storageManager.disableSync();
  }
});
```

### 设置同步

```typescript
// 保存设置到 Supabase
async function syncSettings(userId: string, config: AppConfig) {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      config: config,
      synced_at: new Date().toISOString(),
    });

  return { data, error };
}

// 从 Supabase 获取设置
async function fetchSettings(userId: string) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  return { data, error };
}

// 实时订阅设置变化
const subscription = supabase
  .channel('settings-changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'user_settings',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      // 更新本地配置
      storageManager.updateConfig(payload.new.config);
    }
  )
  .subscribe();
```

### 自定义插件管理

```typescript
// 保存插件
async function savePlugin(plugin: CustomPlugin) {
  const { data, error } = await supabase
    .from('custom_plugins')
    .insert({
      user_id: userId,
      name: plugin.name,
      version: plugin.version,
      code: plugin.code,
      enabled: plugin.enabled,
    });

  return { data, error };
}

// 获取所有插件
async function getUserPlugins(userId: string) {
  const { data, error } = await supabase
    .from('custom_plugins')
    .select('*')
    .eq('user_id', userId);

  return { data, error };
}

// 发布到市场
async function publishToMarketplace(pluginId: string) {
  const { data, error } = await supabase
    .from('custom_plugins')
    .update({ is_public: true })
    .eq('id', pluginId);

  // 同时创建市场条目
  await supabase.from('marketplace_plugins').insert({...});

  return { data, error };
}
```

## 🔄 同步策略

### 冲突解决方案

1. **Last-Write-Wins** (默认)
   - 使用 `updated_at` 时间戳
   - 最新修改优先

2. **Remote Preferred**
   - 服务器数据优先
   - 适合多设备场景

3. **Local Preferred**
   - 本地数据优先
   - 适合离线场景

4. **Manual Resolution**
   - 显示冲突给用户
   - 让用户选择

### 实现示例

```typescript
async function resolveConflict(
  local: AppConfig,
  remote: AppConfig,
  strategy: 'local' | 'remote' | 'latest'
): Promise<AppConfig> {
  switch (strategy) {
    case 'local':
      return local;
    
    case 'remote':
      return remote;
    
    case 'latest':
      const localTime = new Date(local.updated_at).getTime();
      const remoteTime = new Date(remote.updated_at).getTime();
      return localTime > remoteTime ? local : remote;
    
    default:
      return remote;
  }
}
```

## 📊 Row Level Security (RLS)

所有表都启用了 RLS，确保：
- ✅ 用户只能访问自己的数据
- ✅ 公开插件所有人可见
- ✅ 市场插件所有人可浏览

### 测试 RLS

```sql
-- 测试用户只能看到自己的设置
SELECT * FROM user_settings; -- 只返回当前用户的记录

-- 测试公开插件可见性
SELECT * FROM custom_plugins WHERE is_public = true; -- 所有人可见
```

## 🎯 最佳实践

### 1. 性能优化

```typescript
// 使用批量操作
const { data, error } = await supabase
  .from('custom_plugins')
  .upsert(pluginsArray);

// 使用 select 仅获取需要的字段
const { data, error } = await supabase
  .from('user_settings')
  .select('config')
  .single();
```

### 2. 错误处理

```typescript
try {
  const { data, error } = await supabase.from('user_settings').select();
  
  if (error) throw error;
  
  return data;
} catch (error) {
  console.error('Supabase error:', error);
  // 降级到本地存储
  return await getLocalConfig();
}
```

### 3. 离线支持

```typescript
// 检测网络状态
if (navigator.onLine) {
  await syncWithSupabase();
} else {
  // 使用本地存储
  await saveToLocal();
}

// 网络恢复时自动同步
window.addEventListener('online', () => {
  syncWithSupabase();
});
```

## 🔐 安全建议

1. **不要在客户端存储敏感密钥**
   ```typescript
   // ❌ 错误
   const supabase = createClient(url, SERVICE_ROLE_KEY);
   
   // ✅ 正确
   const supabase = createClient(url, ANON_KEY);
   ```

2. **使用环境变量**
   ```bash
   # .env.local (不要提交到 git)
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. **启用 RLS**
   - 所有表都必须启用 RLS
   - 测试所有权限策略

4. **验证用户输入**
   ```typescript
   // 验证插件代码
   if (!isValidPluginCode(code)) {
     throw new Error('Invalid plugin code');
   }
   ```

## 📈 监控和调试

### Supabase Dashboard

- **Database** → 查看表数据
- **Authentication** → 查看用户
- **Logs** → 查看查询日志
- **API Docs** → 自动生成的 API 文档

### 本地日志

```typescript
// 启用 Supabase 日志
const supabase = createClient(url, key, {
  global: {
    fetch: (...args) => {
      console.log('Supabase request:', args);
      return fetch(...args);
    },
  },
});
```

## 🚀 部署检查清单

- [ ] 数据库 schema 已部署
- [ ] RLS 策略已测试
- [ ] 环境变量已配置
- [ ] 认证提供商已启用
- [ ] CORS 设置已配置
- [ ] 备份策略已设置
- [ ] 监控已启用

## 📚 参考资源

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Subscriptions](https://supabase.com/docs/guides/realtime)
- [Storage](https://supabase.com/docs/guides/storage)

---

**最后更新**: 2025-10-07  
**状态**: 架构设计完成，等待实现
