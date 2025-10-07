# Supabase 集成实施路线图

## 📋 总览

将 Input Spirit 从纯本地存储升级为支持 Supabase 云端同步的完整方案。

### 核心目标
- ✅ 保持本地优先架构
- ✅ 用户可选择性同步
- ✅ 支持多设备数据同步
- ✅ 插件市场功能
- ✅ 离线优先，在线增强

## 🗓️ 分阶段实施计划

### Phase 1: 基础设施 (1-2周)

#### Week 1: 数据库设计与部署

**任务清单**:
- [ ] 创建 Supabase 项目
- [ ] 执行数据库 schema (`SUPABASE_SCHEMA.sql`)
- [ ] 配置 Row Level Security 策略
- [ ] 测试数据库连接
- [ ] 配置环境变量

**产出**:
- ✅ Supabase 项目已创建
- ✅ 数据库表已部署
- ✅ RLS 策略已测试
- ✅ `.env.local` 配置完成

**验证步骤**:
```sql
-- 测试用户表
SELECT * FROM public.users;

-- 测试 RLS
SELECT * FROM public.user_settings;
```

#### Week 2: 客户端集成

**任务清单**:
- [ ] 安装 Supabase 依赖
- [ ] 创建 Supabase 客户端 (`lib/supabase/client.ts`)
- [ ] 实现 StorageManager 核心逻辑
- [ ] 添加本地与云端同步抽象层
- [ ] 单元测试

**产出**:
- ✅ Supabase 客户端已配置
- ✅ StorageManager 实现完成
- ✅ 基础同步逻辑可用

**代码示例**:
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

---

### Phase 2: 认证系统 (1周)

#### 任务清单
- [ ] 创建登录/注册 UI
- [ ] 实现 Email/Password 认证
- [ ] 集成 Google OAuth
- [ ] 实现认证状态管理
- [ ] 添加用户资料页面

#### 文件创建
```
app/
├── [locale]/
│   ├── login/
│   │   └── page.tsx          # 登录页面
│   ├── signup/
│   │   └── page.tsx          # 注册页面
│   └── profile/
│       └── page.tsx          # 用户资料
├── components/
│   └── auth/
│       ├── AuthProvider.tsx  # 认证上下文
│       ├── LoginForm.tsx     # 登录表单
│       └── ProtectedRoute.tsx # 路由保护
└── hooks/
    └── useAuth.ts            # 认证 Hook
```

#### 产出
- ✅ 用户可以注册/登录
- ✅ OAuth 登录可用
- ✅ 认证状态持久化
- ✅ 受保护路由工作

---

### Phase 3: 设置同步 (1-2周)

#### Week 1: 核心同步逻辑

**任务清单**:
- [ ] 实现配置上传到 Supabase
- [ ] 实现配置从 Supabase 下载
- [ ] 实现冲突检测
- [ ] 实现冲突解决策略
- [ ] 添加同步状态 UI

**同步流程**:
```
1. 用户登录 → 触发初始同步
2. 比较本地与远程配置
3. 如果有冲突 → 应用解决策略
4. 合并配置
5. 更新本地和远程
6. 显示同步状态
```

**实现示例**:
```typescript
async function syncSettings(userId: string) {
  // 1. 获取本地配置
  const localConfig = await getLocalConfig();
  
  // 2. 获取远程配置
  const { data: remoteSettings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  // 3. 检测冲突
  if (hasConflict(localConfig, remoteSettings?.config)) {
    // 4. 解决冲突
    const resolved = resolveConflict(localConfig, remoteSettings.config);
    
    // 5. 更新两端
    await updateLocalConfig(resolved);
    await updateRemoteConfig(userId, resolved);
  }
}
```

#### Week 2: 实时同步

**任务清单**:
- [ ] 实现 Supabase Realtime 订阅
- [ ] 处理多设备同时修改
- [ ] 添加同步冲突 UI
- [ ] 测试多设备场景

**实时订阅**:
```typescript
const subscription = supabase
  .channel('settings-changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'user_settings',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    handleRemoteUpdate(payload.new.config);
  })
  .subscribe();
```

---

### Phase 4: 插件同步 (1周)

#### 任务清单
- [ ] 实现自定义插件上传
- [ ] 实现插件下载和安装
- [ ] 添加插件管理 UI
- [ ] 支持插件版本控制

#### 功能
```typescript
// 上传插件
async function uploadPlugin(plugin: CustomPlugin) {
  const { data, error } = await supabase
    .from('custom_plugins')
    .insert({
      user_id: userId,
      name: plugin.name,
      code: plugin.code,
      enabled: plugin.enabled
    });
}

// 下载用户插件
async function downloadPlugins(userId: string) {
  const { data, error } = await supabase
    .from('custom_plugins')
    .select('*')
    .eq('user_id', userId);
  
  return data;
}
```

---

### Phase 5: 插件市场 (2-3周)

#### Week 1: 市场基础

**任务清单**:
- [ ] 创建插件市场 UI
- [ ] 实现插件搜索和筛选
- [ ] 添加插件详情页
- [ ] 实现插件安装功能

#### Week 2: 社交功能

**任务清单**:
- [ ] 实现插件评分和评论
- [ ] 添加插件下载统计
- [ ] 实现插件举报功能
- [ ] 添加推荐算法

#### Week 3: 打磨

**任务清单**:
- [ ] 优化市场 UI/UX
- [ ] 添加插件分类和标签
- [ ] 实现插件预览功能
- [ ] 性能优化

---

### Phase 6: 工作流同步 (1周)

#### 任务清单
- [ ] 实现工作流上传
- [ ] 实现工作流下载
- [ ] 添加工作流管理 UI
- [ ] 支持工作流分享

---

### Phase 7: 测试与优化 (1-2周)

#### 测试清单
- [ ] 单元测试（90%+ 覆盖率）
- [ ] 集成测试
- [ ] E2E 测试（登录、同步、插件）
- [ ] 多设备同步测试
- [ ] 性能测试
- [ ] 安全审计

#### 优化清单
- [ ] 数据库查询优化
- [ ] 同步算法优化
- [ ] UI 响应速度优化
- [ ] 离线体验优化
- [ ] 错误处理改进

---

## 📊 里程碑

| 里程碑 | 完成时间 | 核心功能 |
|--------|---------|---------|
| M1: 基础设施 | Week 2 | 数据库 + 客户端 |
| M2: 认证 | Week 3 | 登录/注册 |
| M3: 设置同步 | Week 5 | 配置同步 |
| M4: 插件同步 | Week 6 | 插件云端存储 |
| M5: 市场 | Week 9 | 插件市场 |
| M6: 工作流 | Week 10 | 工作流同步 |
| M7: 上线 | Week 12 | 生产就绪 |

---

## 🎯 成功指标

### 技术指标
- [ ] 同步延迟 < 2秒
- [ ] 冲突解决准确率 > 95%
- [ ] 多设备同步成功率 > 99%
- [ ] 数据库查询 < 100ms
- [ ] API 可用性 > 99.9%

### 用户指标
- [ ] 注册转化率 > 30%
- [ ] 同步启用率 > 50%
- [ ] 插件市场使用率 > 20%
- [ ] 用户满意度 > 4.5/5

---

## 🔐 安全检查清单

### 认证安全
- [ ] 密码哈希（bcrypt）
- [ ] JWT Token 安全
- [ ] OAuth 正确配置
- [ ] Session 管理
- [ ] CSRF 保护

### 数据安全
- [ ] RLS 策略完整
- [ ] 输入验证
- [ ] SQL 注入防护
- [ ] XSS 防护
- [ ] 敏感数据加密

### 网络安全
- [ ] HTTPS 强制
- [ ] CORS 正确配置
- [ ] Rate Limiting
- [ ] DDoS 防护

---

## 📝 文档清单

### 用户文档
- [ ] 快速开始指南
- [ ] 同步设置教程
- [ ] 插件创建教程
- [ ] 常见问题解答

### 开发文档
- [ ] API 文档
- [ ] 数据库 Schema 说明
- [ ] 架构设计文档
- [ ] 贡献指南

---

## 🚀 发布策略

### Beta 测试 (Week 10-11)
- 邀请 50-100 用户
- 收集反馈
- 修复关键 Bug
- 优化性能

### 正式发布 (Week 12)
- 公开发布
- 营销推广
- 监控系统
- 用户支持

---

## 💡 未来扩展

### Phase 8+: 高级功能
- [ ] 团队协作（多用户共享配置）
- [ ] 插件版本管理
- [ ] 工作流可视化编辑器
- [ ] AI 推荐系统
- [ ] 移动应用（Capacitor）
- [ ] 插件付费市场

---

## 📞 支持资源

- **技术支持**: Supabase Discord
- **文档**: https://supabase.com/docs
- **示例代码**: https://github.com/supabase/supabase/tree/master/examples
- **社区**: https://github.com/supabase/supabase/discussions

---

**当前状态**: Phase 0 - 架构设计完成 ✅  
**下一步**: 安装 Supabase 依赖，创建项目  
**预计完成**: 12 周后生产就绪
