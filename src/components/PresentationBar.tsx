import { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  StretchHorizontal,
  Maximize2,
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
        "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-30 " +
        (active
          ? "bg-white/20 text-white"
          : "text-white/70 hover:bg-white/15 hover:text-white active:scale-95")
      }
    >
      {children}
    </button>
  );
}

export default function PresentationBar() {
  const {
    exitPresentation,
    nextPage,
    prevPage,
    zoomIn,
    zoomOut,
    setFitMode,
  } = useViewer();
  const active = useActiveDoc();

  const [visible, setVisible] = useState(false);
  const [hideTimer, setHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const doc = !!active;
  const pageNum = active?.pageNum ?? 0;
  const numPages = active?.numPages ?? 0;
  const scale = active?.scale ?? 1;
  const fitMode = active?.fitMode ?? "custom";

  const show = () => {
    setVisible(true);
    if (hideTimer) clearTimeout(hideTimer);
    const t = setTimeout(() => setVisible(false), 3000);
    setHideTimer(t);
  };

  useEffect(() => {
    show();
    return () => {
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [pageNum]);

  return (
    <>
      {/* Invisible hover zone at bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 h-16"
        onMouseEnter={show}
      />

      {/* Toolbar */}
      <div
        onMouseEnter={show}
        onMouseLeave={() => {
          if (hideTimer) clearTimeout(hideTimer);
          const t = setTimeout(() => setVisible(false), 1500);
          setHideTimer(t);
        }}
        className={
          "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-zinc-900/85 px-3 py-2 shadow-2xl backdrop-blur-xl transition-all duration-300 " +
          (visible
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 pointer-events-none")
        }
      >
        <div className="flex items-center gap-1">
          {/* Exit */}
          <IconButton title="退出演示模式 (Esc)" onClick={exitPresentation}>
            <X size={15} />
          </IconButton>

          <div className="mx-1 h-5 w-px bg-white/15" />

          {/* Page nav */}
          <IconButton title="上一页 (←)" onClick={prevPage} disabled={!doc || pageNum <= 1}>
            <ChevronLeft size={15} />
          </IconButton>
          <span className="min-w-[48px] text-center text-xs font-semibold tabular-nums text-white/80">
            {pageNum} / {numPages || "–"}
          </span>
          <IconButton title="下一页 (→)" onClick={nextPage} disabled={!doc || pageNum >= numPages}>
            <ChevronRight size={15} />
          </IconButton>

          <div className="mx-1 h-5 w-px bg-white/15" />

          {/* Zoom */}
          <IconButton title="缩小" onClick={zoomOut} disabled={!doc}>
            <ZoomOut size={14} />
          </IconButton>
          <span className="min-w-[36px] text-center text-[11px] font-semibold tabular-nums text-white/70">
            {Math.round(scale * 100)}%
          </span>
          <IconButton title="放大" onClick={zoomIn} disabled={!doc}>
            <ZoomIn size={14} />
          </IconButton>

          <div className="mx-1 h-5 w-px bg-white/15" />

          {/* Fit modes */}
          <IconButton
            title="适应宽度"
            onClick={() => setFitMode("width")}
            disabled={!doc}
            active={fitMode === "width"}
          >
            <StretchHorizontal size={14} />
          </IconButton>
          <IconButton
            title="适应页面"
            onClick={() => setFitMode("page")}
            disabled={!doc}
            active={fitMode === "page"}
          >
            <Maximize2 size={14} />
          </IconButton>
        </div>
      </div>
    </>
  );
}
