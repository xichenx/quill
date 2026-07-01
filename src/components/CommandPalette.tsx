import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  FileText,
  FilePlus,
  FileX,
  ZoomIn,
  ZoomOut,
  Maximize,
  Bookmark,
  RotateCw,
  Moon,
  Sun,
  Printer,
  Download,
  Keyboard,
  PanelLeft,
  ScrollText,
  Eye,
  Info,
} from "lucide-react";
import { useViewer } from "../store/viewer";

interface Command {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  disabled?: boolean;
  icon: React.ReactNode;
  action: () => void;
}

const ICON_CLS = "text-zinc-400 dark:text-zinc-500";

export default function CommandPalette({
  onClose,
  onShowDocInfo,
}: {
  onClose: () => void;
  onShowDocInfo: () => void;
}) {
  const store = useViewer;
  const docs = useViewer((s) => s.docs);
  const activeId = useViewer((s) => s.activeId);
  const hasDocs = docs.length > 0;
  const hasActive = activeId !== null;
  const theme = useViewer((s) => s.theme);

  const commands: Command[] = useMemo(
    () => [
      {
        id: "open",
        label: "打开文件",
        category: "文件",
        shortcut: "Ctrl+O",
        icon: <FilePlus size={16} className={ICON_CLS} />,
        action: onClose, // will be overridden via onOpen prop concept — handled differently
      },
      {
        id: "close",
        label: "关闭文档",
        category: "文件",
        shortcut: "Ctrl+W",
        icon: <FileX size={16} className={ICON_CLS} />,
        action: () => {
          const s = store.getState();
          if (s.activeId) s.closeDoc(s.activeId);
        },
        disabled: !hasActive,
      },
      {
        id: "close-all",
        label: "关闭所有文档",
        category: "文件",
        icon: <FileX size={16} className={ICON_CLS} />,
        action: () => {
          const s = store.getState();
          [...s.docs].forEach((d) => s.closeDoc(d.id));
        },
        disabled: !hasDocs,
      },
      {
        id: "doc-info",
        label: "文档属性",
        category: "文件",
        shortcut: "Ctrl+I",
        icon: <Info size={16} className={ICON_CLS} />,
        action: () => onShowDocInfo(),
        disabled: !hasActive,
      },
      {
        id: "print",
        label: "打印",
        category: "文件",
        shortcut: "Ctrl+P",
        icon: <Printer size={16} className={ICON_CLS} />,
        action: () => window.print(),
        disabled: !hasDocs,
      },
      {
        id: "export-page-png",
        label: "导出当前页为 PNG",
        category: "文件",
        icon: <Download size={16} className={ICON_CLS} />,
        action: () => store.getState().exportCurrentPage("png"),
        disabled: !hasActive,
      },
      {
        id: "export-all-png",
        label: "导出全部页面为 PNG",
        category: "文件",
        icon: <Download size={16} className={ICON_CLS} />,
        action: () => store.getState().exportAllPages("png"),
        disabled: !hasActive,
      },
      {
        id: "search",
        label: "查找",
        category: "编辑",
        shortcut: "Ctrl+F",
        icon: <Search size={16} className={ICON_CLS} />,
        action: () => store.getState().openSearch(),
        disabled: !hasDocs,
      },
      {
        id: "copy",
        label: "复制",
        category: "编辑",
        shortcut: "Ctrl+C",
        icon: <FileText size={16} className={ICON_CLS} />,
        action: () => document.execCommand("copy"),
      },
      {
        id: "zoom-in",
        label: "放大",
        category: "查看",
        shortcut: "Ctrl+=",
        icon: <ZoomIn size={16} className={ICON_CLS} />,
        action: () => store.getState().zoomIn(),
        disabled: !hasDocs,
      },
      {
        id: "zoom-out",
        label: "缩小",
        category: "查看",
        shortcut: "Ctrl+-",
        icon: <ZoomOut size={16} className={ICON_CLS} />,
        action: () => store.getState().zoomOut(),
        disabled: !hasDocs,
      },
      {
        id: "fit-width",
        label: "适应宽度",
        category: "查看",
        icon: <Maximize size={16} className={ICON_CLS} />,
        action: () => store.getState().setFitMode("width"),
        disabled: !hasDocs,
      },
      {
        id: "fit-page",
        label: "适应页面",
        category: "查看",
        icon: <Maximize size={16} className={ICON_CLS} />,
        action: () => store.getState().setFitMode("page"),
        disabled: !hasDocs,
      },
      {
        id: "continuous",
        label: "切换连续滚动",
        category: "查看",
        icon: <ScrollText size={16} className={ICON_CLS} />,
        action: () => {
          const s = store.getState();
          const a = s.docs.find((d) => d.id === s.activeId);
          s.setScrollMode(a?.scrollMode === "continuous" ? "paged" : "continuous");
        },
        disabled: !hasDocs,
      },
      {
        id: "rotate",
        label: "旋转 90°",
        category: "查看",
        icon: <RotateCw size={16} className={ICON_CLS} />,
        action: () => store.getState().rotateCW(),
        disabled: !hasDocs,
      },
      {
        id: "toggle-sidebar",
        label: "切换侧栏",
        category: "查看",
        shortcut: "Ctrl+B",
        icon: <PanelLeft size={16} className={ICON_CLS} />,
        action: () => store.getState().toggleSidebar(),
      },
      {
        id: "toggle-theme",
        label: "切换主题",
        category: "查看",
        icon: theme === "dark" ? <Sun size={16} className={ICON_CLS} /> : <Moon size={16} className={ICON_CLS} />,
        action: () => store.getState().toggleTheme(),
      },
      {
        id: "presentation",
        label: "演示模式",
        category: "查看",
        shortcut: "F5",
        icon: <Eye size={16} className={ICON_CLS} />,
        action: () => {
          const s = store.getState();
          s.presentationMode ? s.exitPresentation() : s.enterPresentation();
        },
        disabled: !hasDocs,
      },
      {
        id: "fullscreen",
        label: "全屏",
        category: "查看",
        shortcut: "F11",
        icon: <Maximize size={16} className={ICON_CLS} />,
        action: () =>
          document.fullscreenElement
            ? document.exitFullscreen()
            : document.documentElement.requestFullscreen(),
      },
      {
        id: "bookmark",
        label: "添加/移除书签",
        category: "导航",
        shortcut: "Ctrl+B",
        icon: <Bookmark size={16} className={ICON_CLS} />,
        action: () => store.getState().toggleBookmark(),
        disabled: !hasActive,
      },
      {
        id: "next-page",
        label: "下一页",
        category: "导航",
        shortcut: "→",
        icon: <FileText size={16} className={ICON_CLS} />,
        action: () => store.getState().nextPage(),
        disabled: !hasDocs,
      },
      {
        id: "prev-page",
        label: "上一页",
        category: "导航",
        shortcut: "←",
        icon: <FileText size={16} className={ICON_CLS} />,
        action: () => store.getState().prevPage(),
        disabled: !hasDocs,
      },
      {
        id: "goto-page",
        label: "跳转到页",
        category: "导航",
        shortcut: "Ctrl+G",
        icon: <FileText size={16} className={ICON_CLS} />,
        action: () => {
          const s = store.getState();
          const a = s.docs.find((d) => d.id === s.activeId);
          if (a) {
            const p = prompt(`跳转到页 (1-${a.numPages}):`, String(a.pageNum));
            if (p) {
              const n = parseInt(p, 10);
              if (n >= 1 && n <= a.numPages) s.goToPage(n);
            }
          }
        },
        disabled: !hasDocs,
      },
      {
        id: "shortcuts",
        label: "键盘快捷键参考",
        category: "帮助",
        icon: <Keyboard size={16} className={ICON_CLS} />,
        action: () =>
          alert(
            "键盘快捷键:\n\nCtrl+O — 打开文件\nCtrl+W — 关闭文档\nCtrl+F — 查找\nCtrl+P — 打印\nCtrl+B — 切换侧栏\nCtrl+= / + — 放大\nCtrl+- — 缩小\nCtrl+G — 跳转到页\nCtrl+K — 命令面板\nCtrl+I — 文档属性\nF5 — 演示模式\nF11 — 全屏\n← → — 上下翻页\nEsc — 关闭搜索 / 退出演示",
          ),
      },
    ],
    [hasDocs, hasActive, theme],
  );

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands.filter((c) => !c.disabled);
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        !c.disabled &&
        (c.label.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.shortcut && c.shortcut.toLowerCase().includes(q))),
    );
  }, [commands, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Reset active index when filter changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const execute = useCallback(
    (cmd: Command) => {
      cmd.action();
      onClose();
    },
    [onClose],
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) execute(filtered[activeIndex]);
      return;
    }
  }

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Group commands by category
  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const cmd of filtered) {
      const list = map.get(cmd.category) || [];
      list.push(cmd);
      map.set(cmd.category, list);
    }
    return map;
  }, [filtered]);

  const backdrop = (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center bg-black/30 pt-[15vh] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg animate-scale-in rounded-xl border border-zinc-200/80 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-900/95">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-zinc-200/60 px-4 py-3 dark:border-zinc-700/50">
          <Search size={18} className="shrink-0 text-zinc-400 dark:text-zinc-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="输入命令名称搜索..."
            className="flex-1 border-0 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-200 dark:placeholder:text-zinc-500"
          />
          <kbd className="hidden rounded-md border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 sm:inline dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-500">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-72 overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <Keyboard size={24} className="text-zinc-300 dark:text-zinc-600" />
              <p className="text-xs text-zinc-400">没有匹配的命令</p>
            </div>
          ) : (
            Array.from(grouped.entries()).map(([category, cmds]) => (
              <div key={category} className="mb-1">
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {category}
                </div>
                {cmds.map((cmd) => {
                  const globalIndex = filtered.indexOf(cmd);
                  const isActive = globalIndex === activeIndex;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => execute(cmd)}
                      onMouseEnter={() => setActiveIndex(globalIndex)}
                      className={
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-75 " +
                        (isActive
                          ? "bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300"
                          : "text-zinc-700 hover:bg-surface-hover dark:text-zinc-300 dark:hover:bg-surface-dark-hover")
                      }
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-alt dark:bg-surface-dark-alt">
                        {cmd.icon}
                      </span>
                      <span className="flex-1 font-medium">{cmd.label}</span>
                      {cmd.shortcut && (
                        <kbd className="rounded-md border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-500">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-zinc-200/60 px-4 py-2 dark:border-zinc-700/50">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
            <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5 font-medium dark:border-zinc-600 dark:bg-zinc-800">↑↓</kbd>{" "}
            导航
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
            <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5 font-medium dark:border-zinc-600 dark:bg-zinc-800">Enter</kbd>{" "}
            执行
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
            <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5 font-medium dark:border-zinc-600 dark:bg-zinc-800">Esc</kbd>{" "}
            关闭
          </span>
        </div>
      </div>
    </div>
  );

  return createPortal(backdrop, document.body);
}
