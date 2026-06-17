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
        "flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-30 " +
        (active
          ? "bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300"
          : "text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-700/60")
      }
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1.5 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />;
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
    <header className="flex h-12 shrink-0 items-center gap-1 border-b border-zinc-200 bg-white/80 px-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
      <IconButton title="侧栏" onClick={toggleSidebar}>
        <PanelLeft size={18} />
      </IconButton>

      <Divider />

      <IconButton title="上一页" onClick={prevPage} disabled={!doc || pageNum <= 1}>
        <ChevronLeft size={18} />
      </IconButton>
      <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-300">
        <input
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          onBlur={commitPage}
          onKeyDown={(e) => e.key === "Enter" && commitPage()}
          disabled={!doc}
          className="h-7 w-12 rounded-md border border-zinc-200 bg-white text-center tabular-nums outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800"
        />
        <span className="text-zinc-400">/ {numPages || "–"}</span>
      </div>
      <IconButton
        title="下一页"
        onClick={nextPage}
        disabled={!doc || pageNum >= numPages}
      >
        <ChevronRight size={18} />
      </IconButton>

      <Divider />

      <IconButton title="缩小" onClick={zoomOut} disabled={!doc}>
        <ZoomOut size={18} />
      </IconButton>
      <span className="w-11 text-center text-sm tabular-nums text-zinc-600 dark:text-zinc-300">
        {Math.round(scale * 100)}%
      </span>
      <IconButton title="放大" onClick={zoomIn} disabled={!doc}>
        <ZoomIn size={18} />
      </IconButton>
      <IconButton
        title="适应宽度"
        onClick={() => setFitMode("width")}
        disabled={!doc}
        active={fitMode === "width"}
      >
        <StretchHorizontal size={18} />
      </IconButton>
      <IconButton
        title="适应页面"
        onClick={() => setFitMode("page")}
        disabled={!doc}
        active={fitMode === "page"}
      >
        <Maximize2 size={17} />
      </IconButton>

      <Divider />

      <IconButton title="旋转" onClick={rotateCW} disabled={!doc}>
        <RotateCw size={17} />
      </IconButton>
      <IconButton
        title="书签当前页"
        onClick={toggleBookmark}
        disabled={!doc}
        active={bookmarked}
      >
        <Bookmark size={17} />
      </IconButton>
      <IconButton title="搜索" onClick={openSearch} disabled={!doc}>
        <Search size={17} />
      </IconButton>

      <div className="ml-auto flex items-center gap-1">
        <IconButton title="切换主题" onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </IconButton>
        <button
          onClick={onOpen}
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-sm font-medium text-white shadow-sm shadow-violet-600/25 transition-all hover:bg-violet-700 active:scale-[0.98]"
        >
          <FolderOpen size={16} />
          打开
        </button>
      </div>
    </header>
  );
}
