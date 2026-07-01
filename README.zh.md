# Quill

<p align="center">
  <img src="generated_icon_1.png" alt="Quill" width="128" />
</p>

<p align="center">
  <strong>轻量、快速、美观的 PDF 阅读器。</strong>
</p>

<!-- README-I18N:START -->

[English](./README.md) | **汉语**

<!-- README-I18N:END -->

---

## 功能特性

- 📖 **高性能 PDF 渲染**，基于 pdfjs-dist 引擎
- 🎨 **深色/浅色模式** — 自动适配或手动切换
- 📑 **多标签页阅读** — 同时打开多个 PDF 文档
- 🔍 **全文搜索**，支持高亮匹配和结果导航
- 🔖 **缩略图侧栏** — 快速预览和跳转页面
- ⌨️ **丰富的快捷键**，提升操作效率
- 🖱️ **流畅缩放** — Ctrl + 滚轮精细调节，适应宽度 / 适应页面
- 🪟 **无边框窗口**，自定义标题栏控件
- 📂 **最近文件** — 快速重新打开之前的文档
- 🖨️ **打印支持**
- 🔄 **页面旋转** 90° 顺时针
- 🎬 **演示模式** — 无干扰全屏阅读，浮动工具栏自动隐藏
- 📋 **文档属性** — 查看 PDF 元数据（标题、作者、页面尺寸、文件大小等）
- ⚡ **命令面板** — 通过 `Ctrl+K` 快速搜索并执行任何操作
- 🏠 **拖放打开** — 将 PDF 文件拖入窗口即可阅读

## 技术栈

| 层级           | 技术                                                  |
| -------------- | ----------------------------------------------------- |
| 桌面框架       | [Tauri 2](https://tauri.app/)                         |
| 前端           | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| 样式           | [Tailwind CSS 4](https://tailwindcss.com/)            |
| PDF 引擎       | [pdfjs-dist 5](https://github.com/nicbarker/pdfjs)    |
| 状态管理       | [Zustand](https://zustand.docs.pmnd.rs/)              |
| 图标库         | [Lucide React](https://lucide.dev/)                   |

## 下载安装

前往 [Releases](https://github.com/xichen/Quill/releases) 页面下载最新版本安装包。

| 平台     | 安装包格式          |
| -------- | ------------------- |
| Windows  | `.msi` / `.exe`     |
| macOS    | `.dmg`              |
| Linux    | `.deb` / `.AppImage` |

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/) 工具链（Tauri 需要）

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm run tauri dev
```

### 构建生产版本

```bash
npm run tauri build
```

构建产物位于 `src-tauri/target/release/` 目录。

## 发版流程

版本号由 Git tag 管理。在 GitHub 上发布 Release 时，CI 工作流会自动将 tag 版本号回写到 `package.json`、`src-tauri/tauri.conf.json` 和 `src-tauri/Cargo.toml`，然后构建打包。

```bash
# 1. 推送代码
git push

# 2. 在 GitHub 上进入 Releases → Draft a new Release
#    创建标签（如 v0.1.0）并点击 Publish
#    CI 工作流将自动：
#      - 将 tag 版本号写入所有配置文件
#      - 提交版本号变更并推回 main 分支
#      - 构建 Windows / macOS / Linux 安装包
#      - 上传安装包到 Release
```

## 快捷键

| 快捷键             | 操作             |
| ------------------ | ---------------- |
| `Ctrl + O`         | 打开文件         |
| `Ctrl + W`         | 关闭当前标签页   |
| `Ctrl + F`         | 搜索文档内容     |
| `Ctrl + P`         | 打印             |
| `Ctrl + B`         | 切换侧栏         |
| `Ctrl + =` / `+`   | 放大             |
| `Ctrl + -`         | 缩小             |
| `Ctrl + 0`         | 重置缩放         |
| `Ctrl + G`         | 跳转到指定页     |
| `Ctrl + I`         | 文档属性         |
| `Ctrl + K`         | 命令面板         |
| `F5`               | 演示模式         |
| `F11`              | 切换全屏         |
| `←` / `→`          | 上一页 / 下一页  |
| `Esc`              | 关闭搜索 / 退出演示 |

## 项目结构

```
quill/
├── index.html                  # HTML 入口
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/                        # React 前端
│   ├── main.tsx                # React 入口
│   ├── App.tsx                 # 根组件与布局
│   ├── components/             # UI 组件
│   │   ├── MenuBar.tsx         # 自定义标题栏与菜单
│   │   ├── TabBar.tsx          # 多标签页栏
│   │   ├── Sidebar.tsx         # 缩略图侧栏
│   │   ├── Viewer.tsx          # PDF 渲染器
│   │   ├── SearchPanel.tsx     # 全文搜索面板
│   │   ├── StatusBar.tsx       # 底部状态栏
│   │   ├── Home.tsx            # 首页 / 拖放打开页面
│   │   ├── PresentationBar.tsx # 演示模式浮动工具栏
│   │   ├── DocumentInfo.tsx    # 文档属性面板
│   │   ├── CommandPalette.tsx  # 命令面板
│   │   └── Toast.tsx           # Toast 通知
│   ├── store/
│   │   └── viewer.ts           # Zustand 全局状态
│   └── lib/
│       └── files.ts            # 文件 I/O 工具
├── src-tauri/                  # Tauri (Rust) 后端
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   └── lib.rs              # Tauri 命令与插件
│   └── icons/                  # 应用图标
└── public/                     # 静态资源
```

## 许可证

MIT
