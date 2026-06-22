import { useCallback, useEffect, useRef } from "react";
import { useViewer, useActiveDoc } from "../store/viewer";
import { getPageBaseSize } from "../lib/pdf";
import PageView from "./PageView";

const PADDING = 56;
const TOP_OFFSET = 120;
const FINE_STEP = 0.05;

export default function Viewer() {
  const active = useActiveDoc();
  const {
    scrollTarget,
    setPage,
    setFitScale,
    setFitMode,
    searchQuery,
    searchCaseSensitive,
    searchResults,
    searchActive,
  } = useViewer();

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLElement>>(new Map());
  const rafRef = useRef<number | null>(null);
  const hasInitFit = useRef(false);
  const wheelAccRef = useRef(0);

  const docId = active?.id ?? null;
  const fitMode = active?.fitMode ?? "custom";
  const scale = active?.scale ?? 1;
  const rotation = active?.rotation ?? 0;

  // Ctrl+wheel fine zoom — throttled via rAF + accumulator
  // Bind on window with capture to intercept before browser gestures
  useEffect(() => {
    let zoomRaf: number | null = null;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      // Only zoom when the cursor is over the viewer area
      if (!containerRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      wheelAccRef.current += e.deltaY < 0 ? FINE_STEP : -FINE_STEP;

      if (zoomRaf === null) {
        zoomRaf = requestAnimationFrame(() => {
          zoomRaf = null;
          const delta = wheelAccRef.current;
          if (delta === 0) return;
          wheelAccRef.current = 0;
          useViewer.getState().zoomBy(delta);
        });
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
      if (zoomRaf !== null) cancelAnimationFrame(zoomRaf);
    };
  }, [docId]);

  // Global keyboard shortcuts for zoom
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;
      if (isInput) return;

      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+= or Ctrl+NumpadAdd → zoom in
      if (ctrl && (e.key === "=" || e.key === "+" || e.code === "NumpadAdd")) {
        e.preventDefault();
        e.stopPropagation();
        useViewer.getState().zoomIn();
      }
      // Ctrl+- or Ctrl+NumpadSubtract → zoom out
      if (ctrl && (e.key === "-" || e.code === "NumpadSubtract")) {
        e.preventDefault();
        e.stopPropagation();
        useViewer.getState().zoomOut();
      }
      // Ctrl+0 or Ctrl+Numpad0 → reset zoom
      if (ctrl && (e.key === "0" || e.code === "Numpad0")) {
        e.preventDefault();
        e.stopPropagation();
        useViewer.getState().resetZoom();
      }
    };

    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, []);

  const registerRef = useCallback((page: number, el: HTMLElement | null) => {
    if (el) pageRefs.current.set(page, el);
    else pageRefs.current.delete(page);
  }, []);

  // Fit-to-width / fit-to-page scale, based on the current page size.
  useEffect(() => {
    if (!active || !containerRef.current) return;
    if (fitMode === "custom") return;

    let cancelled = false;
    const compute = async () => {
      const base = await getPageBaseSize(active.doc, active.pageNum);
      const rotated = rotation % 180 !== 0;
      const w = rotated ? base.height : base.width;
      const h = rotated ? base.width : base.height;
      const el = containerRef.current;
      if (!el || cancelled) return;
      const availW = el.clientWidth - PADDING;
      const availH = el.clientHeight - PADDING;
      if (availW <= 0 || availH <= 0) return;
      const next =
        fitMode === "width" ? availW / w : Math.min(availW / w, availH / h);
      if (next > 0) setFitScale(next);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(containerRef.current);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId, fitMode, rotation]);

  // Auto-init: switch to fit-width mode on first load
  useEffect(() => {
    if (!active || hasInitFit.current || !containerRef.current) return;
    hasInitFit.current = true;

    // Wait a frame for layout, then compute and switch to fit-width
    const raf = requestAnimationFrame(async () => {
      const el = containerRef.current;
      if (!el || el.clientWidth <= 0) return;
      try {
        const base = await getPageBaseSize(active.doc, active.pageNum);
        const rotated = rotation % 180 !== 0;
        const w = rotated ? base.height : base.width;
        const availW = el.clientWidth - PADDING;
        if (availW <= 0 || w <= 0) return;
        const fitScale = availW / w;
        if (fitScale > 0) {
          setFitScale(fitScale);
          setFitMode("width");
        }
      } catch {
        // ignore
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [docId]);

  // Track the current page as the user scrolls.
  const onScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const container = containerRef.current;
      if (!container) return;
      const top = container.getBoundingClientRect().top;
      const entries = [...pageRefs.current.entries()].sort(
        (a, b) => a[0] - b[0],
      );
      let current = entries[0]?.[0] ?? 1;
      for (const [page, el] of entries) {
        if (el.getBoundingClientRect().top - top <= TOP_OFFSET) current = page;
        else break;
      }
      const a = useViewer.getState();
      const cur = a.docs.find((d) => d.id === a.activeId);
      if (cur && current !== cur.pageNum) setPage(current);
    });
  }, [setPage]);

  // Scroll to a requested page.
  useEffect(() => {
    if (!scrollTarget) return;
    pageRefs.current
      .get(scrollTarget.page)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [scrollTarget]);

  if (!active) return null;

  const activeResult = searchResults[searchActive];

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="viewer-area flex flex-1 flex-col items-center gap-6 overflow-auto bg-surface-alt px-8 py-10 dark:bg-surface-dark-alt"
    >
      {Array.from({ length: active.numPages }, (_, i) => i + 1).map((p) => (
        <PageView
          key={`${active.id}-${p}`}
          doc={active.doc}
          pageNumber={p}
          scale={scale}
          rotation={rotation}
          query={searchQuery}
          caseSensitive={searchCaseSensitive}
          activeOrdinal={
            activeResult && activeResult.page === p
              ? activeResult.ordinal
              : null
          }
          registerRef={registerRef}
        />
      ))}
    </div>
  );
}
