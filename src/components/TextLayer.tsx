import { useEffect, useState } from "react";
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
          // Transform from PDF coordinates to viewport coordinates.
          // pdfjs transform: [a, b, c, d, e, f]
          // viewport transform: [sx, 0, 0, sy, tx, ty]  (for rotation=0)
          const tx = viewport.transform;
          // Apply viewport transform to the item's own transform
          const b = tx[1] * it.transform[0] + tx[3] * it.transform[1];
          const d = tx[1] * it.transform[2] + tx[3] * it.transform[3];
          const e = tx[0] * it.transform[4] + tx[2] * it.transform[5] + tx[4];
          const f = tx[1] * it.transform[4] + tx[3] * it.transform[5] + tx[5];

          const fontSize = Math.hypot(b, d);
          // Text starts at bottom-left, need to shift up by font height
          const left = e;
          const top = f - fontSize;

          placed.push({
            left,
            top,
            fontSize,
            text: it.str ?? "",
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

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        // Make text color fully transparent so canvas shows through,
        // but selection background remains visible.
        color: "transparent",
        userSelect: "text",
        cursor: "text",
      }}
    >
      {spans.map((s, i) => (
        <span
          key={i}
          className="absolute whitespace-pre leading-none"
          style={{
            left: s.left,
            top: s.top,
            fontSize: s.fontSize,
            fontFamily: "sans-serif",
          }}
        >
          {s.text}
        </span>
      ))}
    </div>
  );
}
