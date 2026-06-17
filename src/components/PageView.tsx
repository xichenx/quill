import { memo, useEffect, useRef, useState } from "react";
import {
  renderPage,
  getPageBaseSize,
  getPageMatchBoxes,
  type PdfDocument,
  type MatchBox,
} from "../lib/pdf";

function PageView({
  doc,
  pageNumber,
  scale,
  rotation,
  query,
  caseSensitive,
  activeOrdinal,
  registerRef,
}: {
  doc: PdfDocument;
  pageNumber: number;
  scale: number;
  rotation: number;
  query: string;
  caseSensitive: boolean;
  activeOrdinal: number | null;
  registerRef: (page: number, el: HTMLElement | null) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const [boxes, setBoxes] = useState<MatchBox[][]>([]);

  // Base size to reserve scroll space before the page renders.
  useEffect(() => {
    let cancelled = false;
    getPageBaseSize(doc, pageNumber).then((b) => {
      if (cancelled) return;
      const rotated = rotation % 180 !== 0;
      const w = (rotated ? b.height : b.width) * scale;
      const h = (rotated ? b.width : b.height) * scale;
      setSize({ w, h });
    });
    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber, scale, rotation]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    registerRef(pageNumber, el);
    const io = new IntersectionObserver(
      (entries) => setVisible(entries[0]?.isIntersecting ?? false),
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      registerRef(pageNumber, null);
    };
  }, [pageNumber]);

  useEffect(() => {
    if (visible && canvasRef.current) {
      renderPage(doc, pageNumber, canvasRef.current, scale, rotation).catch(
        console.error,
      );
    }
  }, [visible, doc, pageNumber, scale, rotation]);

  useEffect(() => {
    if (!visible || !query.trim()) {
      setBoxes([]);
      return;
    }
    let cancelled = false;
    getPageMatchBoxes(doc, pageNumber, query, caseSensitive, scale, rotation)
      .then((b) => !cancelled && setBoxes(b))
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [visible, doc, pageNumber, query, caseSensitive, scale, rotation]);

  return (
    <div className="flex flex-col items-center">
      <div
        ref={wrapRef}
        className="relative overflow-hidden rounded-md bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_12px_32px_-12px_rgba(0,0,0,0.18)] ring-1 ring-zinc-900/[0.06] dark:ring-white/10"
        style={size ? { width: size.w, height: size.h } : { minHeight: 200 }}
      >
        <canvas ref={canvasRef} className="block" />
        {boxes.map((occ, oi) =>
          occ.map((b, bi) => (
            <div
              key={`${oi}-${bi}`}
              className={
                "pointer-events-none absolute rounded-[1px] " +
                (oi === activeOrdinal
                  ? "bg-orange-400/50 ring-1 ring-orange-500"
                  : "bg-yellow-300/40")
              }
              style={{
                left: b.left,
                top: b.top,
                width: b.width,
                height: b.height,
              }}
            />
          )),
        )}
      </div>
      <span className="py-1.5 text-xs tabular-nums text-zinc-400">
        {pageNumber}
      </span>
    </div>
  );
}

export default memo(PageView);
