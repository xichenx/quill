import { useEffect, useState } from "react";
import {
  PanelLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  StretchHorizontal,
  Maximize2,
  RotateCw,
  Bookmark,
  Search,
  Sun,
  Moon,
  FolderOpen,
  GripVertical,
} from "lucide-react";
import { useViewer, useActiveDoc } from "../store/viewer";

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
        "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-30 " +
        (active
          ? "bg-accent-100 text-accent-700 shadow-sm dark:bg-accent-900/40 dark:text-accent-300"
          : "text-zinc-500 hover:bg-surface-hover hover:text-zinc-700 active:scale-95 dark:text-zinc-400 dark:hover:bg-surface-dark-hover dark:hover:text-zinc-200")
      }
    >
      {children}
    </button>
  );
}

function ToolGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-zinc-200/60 bg-white/60 p-0.5 shadow-sm backdrop-blur dark:border-zinc-700/50 dark:bg-zinc-800/50">
      {children}
    </div>
  );
}

function ToolDivider() {
  return <GripVertical size={12} className="mx-1 text-zinc-300 dark:text-zinc-600" />;
}

export default function Toolbar({ onOpen }: { onOpen: () => void }) {
  const active = useActiveDoc();
  const {
    theme,
    goToPage,
    nextPage,
    prevPage,
    zoomIn,
    zoomOut,
    setFitMode,
    rotateCW,
    toggleSidebar,
    toggleBookmark,
    openSearch,
    toggleTheme,
  } = useViewer();

  const doc = !!active;
  const pageNum = active?.pageNum ?? 0;
  const numPages = active?.numPages ?? 0;
  const scale = active?.scale ?? 1;
  const fitMode = active?.fitMode ?? "custom";
  const bookmarked = !!active?.bookmarks.some((b) => b.page === pageNum);

  const [pageInput, setPageInput] = useState(String(pageNum));
  useEffect(() => setPageInput(String(pageNum)), [pageNum]);

  function commitPage() {
    const n = parseInt(pageInput, 10);
    if (!Number.isNaN(n)) goToPage(n);
    else setPageInput(String(pageNum));
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-200/60 bg-white/90 px-3 backdrop-blur-xl dark:border-zinc-700/30 dark:bg-zinc-900/90">
      {/* Brand */}
      <div className="mr-1 flex items-center gap-2">
        <IconButton title="侧栏" onClick={toggleSidebar}>
          <PanelLeft size={18} />
        </IconButton>
        <span className="text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
          Quill
        </span>
      </div>

      <ToolDivider />

      {/* Page navigation */}
      <ToolGroup>
        <IconButton title="上一页 (←)" onClick={prevPage} disabled={!doc || pageNum <= 1}>
          <ChevronLeft size={17} />
        </IconButton>
        <div className="flex items-center gap-1 px-1">
          <input
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={commitPage}
            onKeyDown={(e) => e.key === "Enter" && commitPage()}
            disabled={!doc}
            className="h-7 w-12 rounded-lg border-0 bg-transparent text-center text-sm font-medium tabular-nums text-zinc-700 outline-none ring-1 ring-inset ring-zinc-200/60 transition-shadow focus:ring-2 focus:ring-accent-400 disabled:opacity-40 dark:text-zinc-200 dark:ring-zinc-700/50 dark:focus:ring-accent-500"
          />
          <span className="text-xs font-medium text-zinc-400">/ {numPages || "–"}</span>
        </div>
        <IconButton
          title="下一页 (→)"
          onClick={nextPage}
          disabled={!doc || pageNum >= numPages}
        >
          <ChevronRight size={17} />
        </IconButton>
      </ToolGroup>

      {/* Zoom */}
      <ToolGroup>
        <IconButton title="缩小 (Ctrl+-)" onClick={zoomOut} disabled={!doc}>
          <ZoomOut size={16} />
        </IconButton>
        <span className="w-12 text-center text-xs font-semibold tabular-nums text-zinc-600 dark:text-zinc-300">
          {Math.round(scale * 100)}%
        </span>
        <IconButton title="放大 (Ctrl+=)" onClick={zoomIn} disabled={!doc}>
          <ZoomIn size={16} />
        </IconButton>
        <IconButton
          title="适应宽度"
          onClick={() => setFitMode("width")}
          disabled={!doc}
          active={fitMode === "width"}
        >
          <StretchHorizontal size={15} />
        </IconButton>
        <IconButton
          title="适应页面"
          onClick={() => setFitMode("page")}
          disabled={!doc}
          active={fitMode === "page"}
        >
          <Maximize2 size={15} />
        </IconButton>
      </ToolGroup>

      {/* Tools */}
      <ToolGroup>
        <IconButton title="旋转 90°" onClick={rotateCW} disabled={!doc}>
          <RotateCw size={16} />
        </IconButton>
        <IconButton
          title="书签当前页 (Ctrl+B)"
          onClick={toggleBookmark}
          disabled={!doc}
          active={bookmarked}
        >
          <Bookmark size={16} />
        </IconButton>
        <IconButton title="搜索 (Ctrl+F)" onClick={openSearch} disabled={!doc}>
          <Search size={16} />
        </IconButton>
      </ToolGroup>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-1">
        <IconButton title="切换主题" onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </IconButton>
        <button
          onClick={onOpen}
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-xl bg-accent-600 px-3.5 text-sm font-semibold text-white shadow-md shadow-accent-600/25 transition-all duration-150 hover:bg-accent-700 hover:shadow-lg hover:shadow-accent-600/30 active:scale-[0.97]"
        >
          <FolderOpen size={15} />
          打开
        </button>
      </div>
    </header>
  );
}
