import { memo, useEffect, useRef, useState } from "react";
import {
  renderPage,
  getPageBaseSize,
  getPageMatchBoxes,
  type PdfDocument,
  type MatchBox,
} from "../lib/pdf";
import TextLayer from "./TextLayer";

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
    return () => {
      registerRef(pageNumber, null);
    };
  }, [pageNumber]);

  useEffect(() => {
    if (canvasRef.current) {
      renderPage(doc, pageNumber, canvasRef.current, scale, rotation).catch(
        (e) => console.error(`渲染页面 ${pageNumber} 失败:`, e),
      );
    }
  }, [doc, pageNumber, scale, rotation]);

  useEffect(() => {
    if (!query.trim()) {
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
  }, [doc, pageNumber, query, caseSensitive, scale, rotation]);

  return (
    <div className="flex flex-col items-center">
      <div
        ref={wrapRef}
        className="page-wrapper animate-scale-in relative overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.12)] ring-1 ring-zinc-900/[0.05] transition-shadow duration-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06),0_24px_48px_-16px_rgba(0,0,0,0.16)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),0_16px_40px_-16px_rgba(0,0,0,0.4)] dark:ring-white/[0.06] dark:hover:shadow-[0_2px_12px_rgba(0,0,0,0.3),0_24px_48px_-16px_rgba(0,0,0,0.5)]"
        style={size ? { width: size.w, height: size.h } : { minHeight: 200 }}
      >
        <canvas ref={canvasRef} className="block" />
        {size && (
          <TextLayer
            doc={doc}
            pageNumber={pageNumber}
            scale={scale}
            rotation={rotation}
            width={size.w}
            height={size.h}
          />
        )}
        {boxes.map((occ, oi) =>
          occ.map((b, bi) => (
            <div
              key={`${oi}-${bi}`}
              className={
                "pointer-events-none absolute rounded-[2px] " +
                (oi === activeOrdinal
                  ? "bg-accent-400/50 ring-1 ring-accent-500"
                  : "bg-amber-300/40 ring-1 ring-amber-400/30")
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
      <span className="py-2 text-xs font-semibold tabular-nums text-zinc-400 dark:text-zinc-500">
        {pageNumber}
      </span>
    </div>
  );
}

export default memo(PageView);
