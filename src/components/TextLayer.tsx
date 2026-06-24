import { useEffect, useRef, useState } from "react";
import type { PdfDocument } from "../lib/pdf";

interface TextItem {
  str: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: number[];
  width: number;
  height: number;
}

interface PlacedSpan {
  left: number;
  top: number;
  fontSize: number;
  text: string;
  width: number;
  height: number;
}

export default function TextLayer({
  doc,
  pageNumber,
  scale,
  rotation,
}: {
  doc: PdfDocument;
  pageNumber: number;
  scale: number;
  rotation: number;
  width: number;
  height: number;
}) {
  const [spans, setSpans] = useState<PlacedSpan[]>([]);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const page = await doc.getPage(pageNumber);
        const tc = await page.getTextContent();
        const viewport = page.getViewport({ scale, rotation });
        const items = tc.items.filter((it) => (it as TextItem).str?.trim());

        const placed: PlacedSpan[] = [];
        for (const raw of items) {
          if (cancelled) return;
          const it = raw as TextItem;
          if (!it.transform) continue;
          // pdfjs text item uses its own transform matrix relative to the page.
          // viewport.transform converts page coords → screen coords.
          // To get the final position, we apply viewport.transform to the
          // item's translation (e, f).
          const tx = viewport.transform;
          // Combine: T_viewport * T_item for the translation part
          const left = tx[0] * it.transform[4] + tx[2] * it.transform[5] + tx[4];
          const top = tx[1] * it.transform[4] + tx[3] * it.transform[5] + tx[5];

          // Font size from the scale of the item's matrix after viewport transform
          const b = tx[0] * it.transform[1] + tx[2] * it.transform[3];
          const d = tx[1] * it.transform[1] + tx[3] * it.transform[3];
          const fontSize = Math.hypot(b, d);

          // Text baseline is at (left, top); shift up by font size to get
          // the top of the bounding box (PDF Y axis points up, screen Y points down)
          const textTop = top - fontSize;

          // Approximate width from the item's own width field, scaled
          const a = tx[0] * it.transform[0] + tx[2] * it.transform[2];
          const c = tx[1] * it.transform[0] + tx[3] * it.transform[2];
          const scaleX = Math.hypot(a, c);
          const textWidth = (it.width || 0) * scaleX;
          const textHeight = fontSize;

          placed.push({
            left,
            top: textTop,
            fontSize,
            text: it.str ?? "",
            width: textWidth,
            height: textHeight,
          });
        }

        if (!cancelled) setSpans(placed);
      } catch {
        // silently fail — text layer is non-critical
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber, scale, rotation]);

  // Handle Ctrl+C to copy selected text
  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;

    const onCopy = (e: ClipboardEvent) => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      // Only intercept if the selection is within this text layer
      if (!el.contains(sel.anchorNode)) return;

      const text = sel.toString().trim();
      if (!text) return;

      e.preventDefault();
      e.clipboardData?.setData("text/plain", text);
    };

    el.addEventListener("copy", onCopy);
    return () => el.removeEventListener("copy", onCopy);
  }, [pageNumber]);

  return (
    <div
      ref={layerRef}
      className="absolute inset-0 overflow-hidden select-text"
      style={{
        color: "transparent",
        cursor: "text",
        pointerEvents: "auto",
        lineHeight: 1,
      }}
    >
      {spans.map((s, i) => (
        <span
          key={i}
          className="absolute whitespace-pre leading-none select-text"
          style={{
            left: s.left,
            top: s.top,
            fontSize: s.fontSize,
            fontFamily: "sans-serif",
            width: s.width || undefined,
            height: s.height || undefined,
          }}
        >
          {s.text}
        </span>
      ))}
    </div>
  );
}
