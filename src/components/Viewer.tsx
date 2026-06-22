import { useCallback, useEffect, useRef } from "react";
import { useViewer, useActiveDoc } from "../store/viewer";
import { getPageBaseSize } from "../lib/pdf";
import PageView from "./PageView";

const PADDING = 56;
const TOP_OFFSET = 120;

export default function Viewer() {
  const active = useActiveDoc();
  const {
    scrollTarget,
    setPage,
    setFitScale,
    searchQuery,
    searchCaseSensitive,
    searchResults,
    searchActive,
  } = useViewer();

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLElement>>(new Map());
  const rafRef = useRef<number | null>(null);

  const docId = active?.id ?? null;
  const fitMode = active?.fitMode ?? "custom";
  const scale = active?.scale ?? 1;
  const rotation = active?.rotation ?? 0;

  const registerRef = useCallback((page: number, el: HTMLElement | null) => {
    if (el) pageRefs.current.set(page, el);
    else pageRefs.current.delete(page);
  }, []);

  // Fit-to-width / fit-to-page scale, based on the current page size.
  useEffect(() => {
    if (!active || fitMode === "custom" || !containerRef.current) return;
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
      className="flex flex-1 flex-col items-center gap-6 overflow-auto bg-surface-alt px-8 py-10 dark:bg-surface-dark-alt"
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
