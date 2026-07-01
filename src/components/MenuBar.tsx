import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Search, Sun, Moon, Printer, Expand, Shrink, Minus, Square, Copy, XIcon } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useViewer } from "../store/viewer";

// ---- Icon button ----
function IconButton({
  title,
  onClick,
  disabled,
  active,
  children,
}: {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={
        "flex h-6 w-6 items-center justify-center rounded text-xs font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-30 " +
        (active
          ? "bg-accent-100 text-accent-700 shadow-sm dark:bg-accent-900/40 dark:text-accent-300"
          : "text-zinc-500 hover:bg-surface-hover hover:text-zinc-700 active:scale-95 dark:text-zinc-400 dark:hover:bg-surface-dark-hover dark:hover:text-zinc-200")
      }
    >
      {children}
    </button>
  );
}

// ---- Menu bar types and components ----
interface MenuItem {
  label?: string;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
  onClick?: () => void;
  children?: MenuItem[];
}

interface Menu {
  label: string;
  items: MenuItem[];
}

function MenuDropdown({ menu, onClose, anchorRef }: { menu: Menu; onClose: () => void; anchorRef: React.RefObject<HTMLElement | null> }) {
  const [subMenu, setSubMenu] = useState<{ items: MenuItem[] } | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    setPos({ top: rect.bottom + 2, left: rect.left });
    ref.current?.focus();
  }, []);

  const dropdown = (
    <div
      ref={ref}
      tabIndex={-1}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      className="animate-scale-in fixed z-[9999] min-w-[200px] rounded-lg border border-zinc-200/80 bg-white/95 py-1 shadow-xl backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-900/95"
      style={{ top: pos.top, left: pos.left }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) onClose(); }}
    >
      {menu.items.map((item, i) => {
        if (item.separator) return <div key={i} className="my-1 h-px bg-zinc-200/60 dark:bg-zinc-700/50" />;
        return (
          <button
            key={i}
            disabled={item.disabled}
            onClick={() => { if (!item.children) { item.onClick?.(); onClose(); } }}
            onMouseEnter={() => setSubMenu(item.children ? { items: item.children } : null)}
            className="flex w-full items-center gap-4 px-3 py-1.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-30 text-zinc-700 hover:bg-surface-hover dark:text-zinc-200 dark:hover:bg-surface-dark-hover"
          >
            <span className="flex-1">{item.label}</span>
            {item.shortcut && <span className="text-xs text-zinc-400 dark:text-zinc-500">{item.shortcut}</span>}
            {item.children && <ChevronRight size={14} className="text-zinc-400 dark:text-zinc-500" />}
          </button>
        );
      })}
      {subMenu && (
        <div className="absolute left-full top-0 z-50 min-w-[180px] rounded-lg border border-zinc-200/80 bg-white/95 py-1 shadow-xl backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-900/95" style={{ marginLeft: 1 }}>
          {subMenu.items.map((item, i) => {
            if (item.separator) return <div key={i} className="my-1 h-px bg-zinc-200/60 dark:bg-zinc-700/50" />;
            return (
              <button
                key={i}
                disabled={item.disabled}
                onClick={() => { item.onClick?.(); onClose(); }}
                className="flex w-full items-center gap-4 px-3 py-1.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-30 text-zinc-700 hover:bg-surface-hover dark:text-zinc-200 dark:hover:bg-surface-dark-hover"
              >
                <span className="flex-1">{item.label}</span>
                {item.shortcut && <span className="text-xs text-zinc-400 dark:text-zinc-500">{item.shortcut}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return createPortal(dropdown, document.body);
}

export default function MenuBar({ onOpen, onOpenRecent, onShowDocInfo, onCommandPalette }: { onOpen: () => void; onOpenRecent: (path: string) => void; onShowDocInfo: () => void; onCommandPalette: () => void }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const menuAnchorRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const close = useCallback(() => setOpenMenu(null), []);

  useEffect(() => {
    if (!openMenu) return;
    const onClick = (e: MouseEvent) => { if (!barRef.current?.contains(e.target as Node)) setOpenMenu(null); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openMenu]);

  const store = useViewer;
  const recents = useViewer((s) => s.recents);
  const docs = useViewer((s) => s.docs);
  const activeId = useViewer((s) => s.activeId);
  const hasDocs = docs.length > 0;
  const hasActive = activeId !== null;
  const theme = useViewer((s) => s.theme);

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const menus: Menu[] = [
    {
      label: "文件",
      items: [
        { label: "打开文件...", shortcut: "Ctrl+O", onClick: onOpen },
        { separator: true },
        { label: "最近打开", children: recents.length > 0 ? recents.map((r) => ({ label: r.name, onClick: () => onOpenRecent(r.path) })) : [{ label: "无最近文件", disabled: true }] },
        { separator: true },
        { label: "关闭文档", shortcut: "Ctrl+W", disabled: !hasActive, onClick: () => { const s = store.getState(); if (s.activeId) s.closeDoc(s.activeId); } },
        { label: "关闭所有", disabled: !hasDocs, onClick: () => { const s = store.getState(); [...s.docs].forEach((d) => s.closeDoc(d.id)); } },
        { separator: true },
        { label: "文档属性", shortcut: "Ctrl+I", disabled: !hasActive, onClick: onShowDocInfo },
        { separator: true },
        { label: "打印...", shortcut: "Ctrl+P", disabled: !hasDocs, onClick: () => window.print() },
        { separator: true },
        { label: "导出", children: [
          { label: "当前页为 PNG", disabled: !hasActive, onClick: () => store.getState().exportCurrentPage("png") },
          { label: "当前页为 JPEG", disabled: !hasActive, onClick: () => store.getState().exportCurrentPage("jpeg") },
          { separator: true },
          { label: "全部页面为 PNG", disabled: !hasActive, onClick: () => store.getState().exportAllPages("png") },
          { label: "全部页面为 JPEG", disabled: !hasActive, onClick: () => store.getState().exportAllPages("jpeg") },
        ]},
        { separator: true },
        { label: "退出", shortcut: "Alt+F4", onClick: () => window.close() },
      ],
    },
    {
      label: "编辑",
      items: [
        { label: "复制", shortcut: "Ctrl+C", onClick: () => document.execCommand("copy") },
        { label: "全选", shortcut: "Ctrl+A", onClick: () => document.execCommand("selectAll") },
        { separator: true },
        { label: "查找...", shortcut: "Ctrl+F", disabled: !hasDocs, onClick: () => store.getState().openSearch() },
      ],
    },
    {
      label: "查看",
      items: [
        { label: "切换侧栏", shortcut: "Ctrl+B", onClick: () => store.getState().toggleSidebar() },
        { separator: true },
        { label: "放大", shortcut: "Ctrl+=", disabled: !hasDocs, onClick: () => store.getState().zoomIn() },
        { label: "缩小", shortcut: "Ctrl+-", disabled: !hasDocs, onClick: () => store.getState().zoomOut() },
        { label: "适应宽度", disabled: !hasDocs, onClick: () => store.getState().setFitMode("width") },
        { label: "适应页面", disabled: !hasDocs, onClick: () => store.getState().setFitMode("page") },
        { separator: true },
        { label: "连续滚动", disabled: !hasDocs, onClick: () => { const s = store.getState(); const a = s.docs.find((d) => d.id === s.activeId); s.setScrollMode(a?.scrollMode === "continuous" ? "paged" : "continuous"); } },
        { separator: true },
        { label: "旋转 90°", disabled: !hasDocs, onClick: () => store.getState().rotateCW() },
        { separator: true },
        { label: "切换主题", onClick: () => store.getState().toggleTheme() },
        { separator: true },
        { label: "演示模式", shortcut: "F5", disabled: !hasDocs, onClick: () => { const s = store.getState(); s.presentationMode ? s.exitPresentation() : s.enterPresentation(); } },
        { label: "全屏", shortcut: "F11", onClick: () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen() },
      ],
    },
    {
      label: "选择",
      items: [
        { label: "全选", shortcut: "Ctrl+A", onClick: () => document.execCommand("selectAll") },
        { separator: true },
        { label: "下一页", shortcut: "→", disabled: !hasDocs, onClick: () => store.getState().nextPage() },
        { label: "上一页", shortcut: "←", disabled: !hasDocs, onClick: () => store.getState().prevPage() },
        { separator: true },
        { label: "跳转到页...", shortcut: "Ctrl+G", disabled: !hasDocs, onClick: () => { const s = store.getState(); const a = s.docs.find((d) => d.id === s.activeId); if (a) { const p = prompt(`跳转到页 (1-${a.numPages}):`, String(a.pageNum)); if (p) { const n = parseInt(p, 10); if (n >= 1 && n <= a.numPages) s.goToPage(n); } } } },
      ],
    },
    {
      label: "帮助",
      items: [
        { label: "命令面板...", shortcut: "Ctrl+K", onClick: onCommandPalette },
        { separator: true },
        { label: "键盘快捷键", onClick: () => alert("键盘快捷键:\n\nCtrl+O — 打开文件\nCtrl+W — 关闭文档\nCtrl+F — 查找\nCtrl+P — 打印\nCtrl+B — 切换侧栏\nCtrl+= / + — 放大\nCtrl+- — 缩小\nCtrl+G — 跳转到页\nCtrl+K — 命令面板\nCtrl+I — 文档属性\nF5 — 演示模式\nF11 — 全屏\n← → — 上下翻页\nEsc — 关闭搜索 / 退出演示") },
        { separator: true },
        { label: "关于 Quill", onClick: () => alert("Quill PDF 阅读器\n\n基于 Tauri + React + pdfjs\n轻量、快速、美观") },
      ],
    },
  ];

  const [isMaximized, setIsMaximized] = useState(false);
  useEffect(() => {
    const win = getCurrentWindow();
    win.isMaximized().then(setIsMaximized);
    const unlisten = win.onResized(async () => {
      setIsMaximized(await win.isMaximized());
    });
    return () => { unlisten.then((fn) => fn()); };
  }, []);

  function handleMinimize() { getCurrentWindow().minimize(); }
  function handleToggleMaximize() { getCurrentWindow().toggleMaximize(); }
  function handleClose() { getCurrentWindow().close(); }

  return (
    <div ref={barRef} data-tauri-drag-region className="flex h-8 shrink-0 items-center border-b border-zinc-200/60 bg-white/90 pl-2 pr-0 backdrop-blur-xl dark:border-zinc-700/30 dark:bg-zinc-900/90 overflow-visible">
      {/* Logo */}
      <img src="/logo.png" alt="Quill" className="mr-2 shrink-0 h-5 w-5 select-none" />

      {/* Menus */}
      <div className="flex shrink-0 items-center select-none">
        {menus.map((menu) => {
          const anchorRef = { current: menuAnchorRefs.current.get(menu.label) ?? null };
          return (
          <div key={menu.label} className="relative">
            <button
              ref={(el) => { if (el) menuAnchorRefs.current.set(menu.label, el); }}
              onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
              onMouseEnter={() => { if (openMenu) setOpenMenu(menu.label); }}
              className={"rounded px-2.5 py-0.5 text-xs leading-none transition-colors " + (openMenu === menu.label ? "bg-surface-hover text-zinc-800 dark:bg-surface-dark-hover dark:text-zinc-100" : "text-zinc-500 hover:bg-surface-hover hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-surface-dark-hover dark:hover:text-zinc-200")}
            >
              {menu.label}
            </button>
            {openMenu === menu.label && <MenuDropdown menu={menu} onClose={close} anchorRef={anchorRef} />}
          </div>
        )})}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side icons */}
      <IconButton title="搜索 (Ctrl+F)" onClick={() => store.getState().openSearch()} disabled={!hasDocs}>
        <Search size={14} />
      </IconButton>
      <IconButton title="打印 (Ctrl+P)" onClick={() => window.print()} disabled={!hasDocs}>
        <Printer size={14} />
      </IconButton>
      <IconButton title="切换主题" onClick={() => store.getState().toggleTheme()}>
        {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
      </IconButton>
      <IconButton
        title={isFullscreen ? "退出全屏 (F11)" : "全屏 (F11)"}
        onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()}
      >
        {isFullscreen ? <Shrink size={14} /> : <Expand size={14} />}
      </IconButton>

      {/* Window controls */}
      <div className="flex items-center ml-1">
        <button
          title="最小化"
          onClick={handleMinimize}
          className="flex h-8 w-10 items-center justify-center text-zinc-500 transition-colors hover:bg-surface-hover hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-surface-dark-hover dark:hover:text-zinc-200"
        >
          <Minus size={15} />
        </button>
        <button
          title={isMaximized ? "还原" : "最大化"}
          onClick={handleToggleMaximize}
          className="flex h-8 w-10 items-center justify-center text-zinc-500 transition-colors hover:bg-surface-hover hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-surface-dark-hover dark:hover:text-zinc-200"
        >
          {isMaximized ? <Copy size={13} /> : <Square size={13} />}
        </button>
        <button
          title="关闭"
          onClick={handleClose}
          className="flex h-8 w-10 items-center justify-center text-zinc-500 transition-colors hover:bg-red-500 hover:text-white"
        >
          <XIcon size={15} />
        </button>
      </div>
    </div>
  );
}
