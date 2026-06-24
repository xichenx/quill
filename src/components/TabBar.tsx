import { useEffect, useState } from "react";
import {
  Plus,
  X,
  FileText,
  PanelLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  StretchHorizontal,
  Maximize2,
  RotateCw,
  Bookmark,
  Columns,
  Rows,
} from "lucide-react";
import { useViewer, useActiveDoc } from "../store/viewer";

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

export default function TabBar({ onOpen }: { onOpen: () => void }) {
  const store = useViewer;
  const docs = useViewer((s) => s.docs);
  const activeId = useViewer((s) => s.activeId);

  const active = useActiveDoc();
  const {
    goToPage,
    nextPage,
    prevPage,
    zoomIn,
    zoomOut,
    setFitMode,
    setScrollMode,
    rotateCW,
    toggleSidebar,
    toggleBookmark,
  } = useViewer();

  const doc = !!active;
  const pageNum = active?.pageNum ?? 0;
  const numPages = active?.numPages ?? 0;
  const scale = active?.scale ?? 1;
  const fitMode = active?.fitMode ?? "custom";
  const scrollMode = active?.scrollMode ?? "paged";
  const bookmarked = !!active?.bookmarks.some((b) => b.page === pageNum);

  const [pageInput, setPageInput] = useState(String(pageNum));
  useEffect(() => setPageInput(String(pageNum)), [pageNum]);

  function commitPage() {
    const n = parseInt(pageInput, 10);
    if (!Number.isNaN(n)) goToPage(n);
    else setPageInput(String(pageNum));
  }

  return (
    <div className="flex h-8 shrink-0 items-center border-b border-zinc-200/60 bg-white/90 pl-2 pr-1 gap-0 backdrop-blur-xl dark:border-zinc-700/30 dark:bg-zinc-900/90">
      {/* Tabs */}
      <div className="flex flex-1 min-w-0 items-center gap-0 overflow-x-auto">
        {docs.map((d) => {
          const active = d.id === activeId;
          return (
            <button
              key={d.id}
              onClick={() => store.getState().setActive(d.id)}
              className={
                "group flex h-8 shrink-0 cursor-pointer items-center gap-1 border-r border-zinc-200/60 px-2.5 text-xs transition-colors dark:border-zinc-700/30 " +
                (active
                  ? "bg-white text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:bg-surface-hover hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-surface-dark-hover dark:hover:text-zinc-300")
              }
            >
              <FileText size={12} className="shrink-0 opacity-50" />
              <span className="flex-1 truncate max-w-[120px]">{d.name}</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  store.getState().closeDoc(d.id);
                }}
                className={
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded transition-all " +
                  (active
                    ? "opacity-0 group-hover:opacity-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    : "opacity-0 group-hover:opacity-100 hover:bg-zinc-300/50 dark:hover:bg-zinc-600")
                }
              >
                <X size={12} />
              </span>
            </button>
          );
        })}
        <button
          title="打开文件"
          onClick={onOpen}
          className="flex h-8 w-7 shrink-0 items-center justify-center text-zinc-400 transition-colors hover:bg-surface-hover hover:text-zinc-600 dark:hover:bg-surface-dark-hover dark:hover:text-zinc-300"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="mx-2 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
      <div className="flex shrink-0 items-center gap-0.5">
        {/* Sidebar toggle */}
        <IconButton title="切换侧栏" onClick={toggleSidebar}>
          <PanelLeft size={14} />
        </IconButton>

        {/* Page navigation */}
        <IconButton title="上一页 (←)" onClick={prevPage} disabled={!doc || pageNum <= 1}>
          <ChevronLeft size={14} />
        </IconButton>
        <input
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          onBlur={commitPage}
          onKeyDown={(e) => e.key === "Enter" && commitPage()}
          disabled={!doc}
          className="h-5 w-9 rounded border-0 bg-transparent text-center text-[11px] font-medium tabular-nums text-zinc-700 outline-none ring-1 ring-inset ring-zinc-200/60 transition-shadow focus:ring-2 focus:ring-accent-400 disabled:opacity-40 dark:text-zinc-200 dark:ring-zinc-700/50 dark:focus:ring-accent-500"
        />
        <span className="text-[11px] font-medium text-zinc-400">/ {numPages || "–"}</span>
        <IconButton
          title="下一页 (→)"
          onClick={nextPage}
          disabled={!doc || pageNum >= numPages}
        >
          <ChevronRight size={14} />
        </IconButton>

        <div className="mx-0.5 h-3 w-px bg-zinc-200 dark:bg-zinc-700" />

        {/* Zoom */}
        <IconButton title="缩小 (Ctrl+- · Ctrl+滚轮微调)" onClick={zoomOut} disabled={!doc}>
          <ZoomOut size={13} />
        </IconButton>
        <span className="w-8 text-center text-[11px] font-semibold tabular-nums text-zinc-600 dark:text-zinc-300">
          {Math.round(scale * 100)}%
        </span>
        <IconButton title="放大 (Ctrl+= · Ctrl+滚轮微调)" onClick={zoomIn} disabled={!doc}>
          <ZoomIn size={13} />
        </IconButton>
        <IconButton
          title="适应宽度"
          onClick={() => setFitMode("width")}
          disabled={!doc}
          active={fitMode === "width"}
        >
          <StretchHorizontal size={13} />
        </IconButton>
        <IconButton
          title="适应页面"
          onClick={() => setFitMode("page")}
          disabled={!doc}
          active={fitMode === "page"}
        >
          <Maximize2 size={13} />
        </IconButton>

        <div className="mx-0.5 h-3 w-px bg-zinc-200 dark:bg-zinc-700" />

        {/* Scroll mode */}
        <IconButton
          title={scrollMode === "continuous" ? "逐页模式" : "连续滚动"}
          onClick={() =>
            setScrollMode(
              scrollMode === "continuous" ? "paged" : "continuous",
            )
          }
          disabled={!doc}
          active={scrollMode === "continuous"}
        >
          {scrollMode === "continuous" ? (
            <Rows size={13} />
          ) : (
            <Columns size={13} />
          )}
        </IconButton>

        <div className="mx-0.5 h-3 w-px bg-zinc-200 dark:bg-zinc-700" />

        {/* Tools */}
        <IconButton title="旋转 90°" onClick={rotateCW} disabled={!doc}>
          <RotateCw size={13} />
        </IconButton>
        <IconButton
          title="书签当前页"
          onClick={toggleBookmark}
          disabled={!doc}
          active={bookmarked}
        >
          <Bookmark size={13} />
        </IconButton>
      </div>
    </div>
  );
}
