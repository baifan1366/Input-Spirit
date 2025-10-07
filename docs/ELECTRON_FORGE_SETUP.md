# Electron Forge 迁移指南

## ✅ 已完成的更改

### 1. package.json 更新

#### 移除的依赖
- ❌ `electron-builder` - 已移除

#### 新增的依赖
```json
"@electron-forge/cli": "^7.5.0",
"@electron-forge/maker-deb": "^7.5.0",
"@electron-forge/maker-rpm": "^7.5.0",
"@electron-forge/maker-squirrel": "^7.5.0",
"@electron-forge/maker-zip": "^7.5.0",
"@electron-forge/plugin-auto-unpack-natives": "^7.5.0",
"@electron-forge/plugin-fuses": "^7.5.0",
"@electron/fuses": "^1.8.0"
```

#### 更新的脚本
```json
"dev": "npm run build:electron && concurrently \"next dev --turbopack\" \"wait-on http://localhost:3000 && electron-forge start\"",
"start": "electron-forge start",
"package": "npm run build && electron-forge package",
"make": "npm run build && electron-forge make",
"publish": "npm run build && electron-forge publish"
```

### 2. 配置迁移

**从** electron-builder 的 `build` 配置  
**到** Electron Forge 的 `config.forge` 配置

---

## 🚀 安装步骤

### 1. 安装 Electron Forge 依赖

```bash
npm install --save-dev @electron-forge/cli \
  @electron-forge/maker-deb \
  @electron-forge/maker-rpm \
  @electron-forge/maker-squirrel \
  @electron-forge/maker-zip \
  @electron-forge/plugin-auto-unpack-natives \
  @electron-forge/plugin-fuses \
  @electron/fuses
```

或者直接：

```bash
npm install
```

### 2. 验证安装

```bash
npx electron-forge --version
```

---

## 📦 打包配置

### Makers (打包器)

Electron Forge 配置了以下打包器：

#### Windows
- **Squirrel** - 创建 `.exe` 安装程序
  ```json
  {
    "name": "@electron-forge/maker-squirrel",
    "config": {
      "name": "InputSpirit"
    }
  }
  ```

#### macOS
- **ZIP** - 创建 `.zip` 压缩包
  ```json
  {
    "name": "@electron-forge/maker-zip",
    "platforms": ["darwin"]
  }
  ```

#### Linux
- **DEB** - Debian/Ubuntu 包
- **RPM** - RedHat/Fedora 包
  ```json
  {
    "name": "@electron-forge/maker-deb",
    "config": {}
  },
  {
    "name": "@electron-forge/maker-rpm",
    "config": {}
  }
  ```

---

## 🎯 使用命令

### 开发模式

```bash
# 启动开发环境
npm run dev

# 或者单独启动 Electron
npm start
```

### 打包应用

```bash
# 打包应用（不创建安装程序）
npm run package

# 创建平台特定的安装程序
npm run make

# 发布应用
npm run publish
```

### 平台特定打包

```bash
# Windows
npm run make -- --platform=win32

# macOS
npm run make -- --platform=darwin

# Linux
npm run make -- --platform=linux
```

---

## 📁 输出目录

Electron Forge 的输出目录结构：

```
out/
├── make/                    # 安装程序
│   ├── squirrel.windows/   # Windows 安装程序
│   ├── zip/                # macOS 压缩包
│   ├── deb/                # Debian 包
│   └── rpm/                # RPM 包
└── InputSpirit-win32-x64/  # 打包的应用
```

---

## ⚙️ 配置说明

### packagerConfig

```json
{
  "asar": true,              // 打包成 asar 文件
  "name": "InputSpirit",     // 应用名称
  "executableName": "input-spirit",  // 可执行文件名
  "icon": "./public/icon"    // 图标路径（不含扩展名）
}
```

### Plugins

#### 1. auto-unpack-natives
自动解包原生模块（如 robotjs）

#### 2. fuses
Electron Fuses 安全配置：
- ✅ `runAsNode`: false - 禁用 Node.js 集成
- ✅ `enableCookieEncryption`: true - 启用 Cookie 加密
- ✅ `onlyLoadAppFromAsar`: true - 仅从 asar 加载

---

## 🔧 自定义配置

### 添加更多 Makers

```bash
# 安装 AppImage maker (Linux)
npm install --save-dev @electron-forge/maker-appimage

# 安装 DMG maker (macOS)
npm install --save-dev @electron-forge/maker-dmg
```

然后在 `package.json` 中添加：

```json
{
  "name": "@electron-forge/maker-appimage",
  "config": {}
}
```

### 自定义图标

确保有以下图标文件：
- Windows: `public/icon.ico`
- macOS: `public/icon.icns`
- Linux: `public/icon.png`

---

## 🐛 常见问题

### Q: robotjs 打包失败？

A: 使用 `auto-unpack-natives` 插件会自动处理。如果还有问题：

```json
"packagerConfig": {
  "asar": {
    "unpack": "**/node_modules/robotjs/**/*"
  }
}
```

### Q: 打包后应用无法启动？

A: 检查：
1. `main` 字段指向正确的入口文件
2. 所有依赖都在 `dependencies` 而不是 `devDependencies`
3. 运行 `npm run build:electron` 编译 TypeScript

### Q: 如何签名应用？

A: Windows 签名：

```json
"packagerConfig": {
  "win32metadata": {
    "CompanyName": "Your Company",
    "FileDescription": "Input Spirit"
  }
}
```

macOS 签名：

```bash
# 需要 Apple Developer 证书
npm install --save-dev @electron-forge/publisher-github
```

---

## 📊 迁移对比

| 功能 | electron-builder | Electron Forge |
|------|------------------|----------------|
| 打包命令 | `electron-builder` | `electron-forge make` |
| 配置位置 | `build` | `config.forge` |
| Windows | NSIS | Squirrel |
| macOS | DMG | ZIP/DMG |
| Linux | AppImage/deb/rpm | deb/rpm/AppImage |
| 自动更新 | 内置 | 需要额外配置 |

---

## ✅ 检查清单

迁移完成后检查：

- [ ] 删除 `node_modules` 和 `package-lock.json`
- [ ] 运行 `npm install`
- [ ] 运行 `npm run dev` 测试开发环境
- [ ] 运行 `npm run make` 测试打包
- [ ] 测试打包后的应用是否正常运行
- [ ] 检查应用图标是否正确
- [ ] 测试自动更新（如果需要）

---

## 📚 参考资源

- [Electron Forge 官方文档](https://www.electronforge.io/)
- [Makers 列表](https://www.electronforge.io/config/makers)
- [Plugins 文档](https://www.electronforge.io/config/plugins)
- [打包配置](https://www.electronforge.io/config/configuration)

---

**迁移完成！** 🎉

现在可以使用 `npm run make` 来打包应用了。
