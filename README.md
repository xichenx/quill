# Quill

<p align="center">
  <img src="generated_icon_1.png" alt="Quill" width="128" />
</p>

<p align="center">
  <strong>A lightweight, fast, and beautiful PDF reader.</strong>
</p>

<!-- README-I18N:START -->

**English** | [汉语](./README.zh.md)

<!-- README-I18N:END -->

---

## Features

- 📖 **High-performance PDF rendering** powered by pdfjs-dist
- 🎨 **Dark mode & light mode** — automatically adapts or manually toggle
- 📑 **Multi-tab reading** — open multiple PDFs side by side
- 🔍 **Full-text search** with match highlighting and navigation
- 🔖 **Thumbnail sidebar** — quick page overview and navigation
- ⌨️ **Rich keyboard shortcuts** for power users
- 🖱️ **Smooth zoom** — Ctrl + wheel for fine control, fit-to-width / fit-to-page
- 🪟 **Frameless window** with custom title bar controls
- 📂 **Recent files** — quickly reopen your last documents
- 🖨️ **Print support**
- 🔄 **Rotate pages** 90° clockwise
- 🏠 **Drag & drop** PDF files onto the window to open

## Tech Stack

| Layer        | Technology                                          |
| ------------ | --------------------------------------------------- |
| Desktop Shell| [Tauri 2](https://tauri.app/)                       |
| Frontend     | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Styling      | [Tailwind CSS 4](https://tailwindcss.com/)          |
| PDF Engine   | [pdfjs-dist 5](https://github.com/nicbarker/pdfjs)  |
| State        | [Zustand](https://zustand.docs.pmnd.rs/)            |
| Icons        | [Lucide React](https://lucide.dev/)                 |

## Download

Go to the [Releases](https://github.com/xichen/Quill/releases) page to download the latest installer for your platform.

| Platform | Package       |
| -------- | ------------- |
| Windows  | `.msi` / `.exe` |
| macOS    | `.dmg`         |
| Linux    | `.deb` / `.AppImage` |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/) toolchain (for Tauri)

### Install Dependencies

```bash
npm install
```

### Run in Development

```bash
npm run tauri dev
```

### Build for Production

```bash
npm run tauri build
```

The built binary will be in `src-tauri/target/release/`.

## Release

Version is managed by Git tags. When you publish a Release on GitHub, the CI workflow automatically writes the tag version back to `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml` before building.

```bash
# 1. Push your code
git push

# 2. Go to GitHub → Releases → Draft a new Release
#    Create a tag (e.g. v0.1.0) and click Publish
#    The CI workflow will:
#      - Write the tag version to all config files
#      - Commit and push the version bump back to main
#      - Build Windows / macOS / Linux installers
#      - Attach them to the Release
```

## Keyboard Shortcuts

| Shortcut          | Action              |
| ----------------- | ------------------- |
| `Ctrl + O`        | Open file           |
| `Ctrl + W`        | Close current tab   |
| `Ctrl + F`        | Search in document  |
| `Ctrl + P`        | Print               |
| `Ctrl + B`        | Toggle sidebar      |
| `Ctrl + =` / `+`  | Zoom in             |
| `Ctrl + -`        | Zoom out            |
| `Ctrl + 0`        | Reset zoom          |
| `Ctrl + G`        | Go to page          |
| `F11`             | Toggle fullscreen   |
| `←` / `→`         | Previous / Next page|
| `Esc`             | Close search panel  |

## Project Structure

```
quill/
├── index.html                  # HTML entry point
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/                        # React frontend
│   ├── main.tsx                # React entry
│   ├── App.tsx                 # Root component & layout
│   ├── components/             # UI components
│   │   ├── MenuBar.tsx         # Custom title bar & menus
│   │   ├── TabBar.tsx          # Multi-tab bar
│   │   ├── Sidebar.tsx         # Thumbnail sidebar
│   │   ├── Viewer.tsx          # PDF renderer
│   │   ├── SearchPanel.tsx     # Full-text search
│   │   ├── StatusBar.tsx       # Bottom status bar
│   │   ├── Home.tsx            # Landing / drag-to-open page
│   │   └── Toast.tsx           # Toast notifications
│   ├── store/
│   │   └── viewer.ts           # Zustand global state
│   └── lib/
│       └── files.ts            # File I/O helpers
├── src-tauri/                  # Tauri (Rust) backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   └── lib.rs              # Tauri commands & plugins
│   └── icons/                  # App icons
└── public/                     # Static assets
```

## License

MIT
