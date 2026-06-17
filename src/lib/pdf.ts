import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export type PdfDocument = pdfjsLib.PDFDocumentProxy;

export async function loadPdf(data: ArrayBuffer): Promise<PdfDocument> {
  return pdfjsLib.getDocument({ data }).promise;
}

export async function getPageBaseSize(
  doc: PdfDocument,
  pageNumber: number,
): Promise<{ width: number; height: number }> {
  const page = await doc.getPage(pageNumber);
  const v = page.getViewport({ scale: 1 });
  return { width: v.width, height: v.height };
}

export async function renderPage(
  doc: PdfDocument,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale = 1.5,
  rotation = 0,
): Promise<void> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale, rotation });
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
}

export interface OutlineNode {
  title: string;
  page: number | null;
  children: OutlineNode[];
}

async function resolveDestPage(
  doc: PdfDocument,
  dest: unknown,
): Promise<number | null> {
  try {
    let explicit = dest;
    if (typeof dest === "string") explicit = await doc.getDestination(dest);
    if (!Array.isArray(explicit) || explicit[0] == null) return null;
    const index = await doc.getPageIndex(explicit[0]);
    return index + 1;
  } catch {
    return null;
  }
}

export async function getOutline(doc: PdfDocument): Promise<OutlineNode[]> {
  const raw = await doc.getOutline();
  if (!raw) return [];
  const walk = async (items: typeof raw): Promise<OutlineNode[]> =>
    Promise.all(
      items.map(async (it) => ({
        title: it.title,
        page: await resolveDestPage(doc, it.dest),
        children: it.items?.length ? await walk(it.items) : [],
      })),
    );
  return walk(raw);
}

export interface SearchMatch {
  page: number;
  ordinal: number;
  snippet: string;
}

interface ItemRange {
  start: number;
  end: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function joinText(items: any[]): { text: string; ranges: ItemRange[] } {
  let text = "";
  const ranges: ItemRange[] = [];
  for (const it of items) {
    if (!("str" in it)) continue;
    const s: string = it.str ?? "";
    const start = text.length;
    text += s;
    ranges.push({ start, end: text.length, item: it });
    text += " ";
  }
  return { text, ranges };
}

export async function searchPdf(
  doc: PdfDocument,
  query: string,
  caseSensitive = false,
): Promise<SearchMatch[]> {
  const q = caseSensitive ? query : query.toLowerCase();
  if (!q.trim()) return [];
  const matches: SearchMatch[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const { text } = joinText(tc.items);
    const hay = caseSensitive ? text : text.toLowerCase();
    let idx = hay.indexOf(q);
    let ordinal = 0;
    while (idx !== -1) {
      const start = Math.max(0, idx - 32);
      const end = Math.min(text.length, idx + q.length + 32);
      matches.push({
        page: p,
        ordinal,
        snippet:
          (start > 0 ? "…" : "") +
          text.slice(start, end).trim() +
          (end < text.length ? "…" : ""),
      });
      ordinal++;
      if (matches.length >= 800) return matches;
      idx = hay.indexOf(q, idx + q.length);
    }
  }
  return matches;
}

export interface MatchBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function itemBox(item: any, viewport: any): MatchBox | null {
  if (!item.transform) return null;
  const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
  const fontHeight = Math.hypot(tx[2], tx[3]);
  return {
    left: tx[4],
    top: tx[5] - fontHeight,
    width: (item.width ?? 0) * viewport.scale,
    height: fontHeight,
  };
}

// Returns one entry per match occurrence (in reading order); each entry is the
// set of item boxes the match spans. Highlight disabled while rotated.
export async function getPageMatchBoxes(
  doc: PdfDocument,
  pageNumber: number,
  query: string,
  caseSensitive: boolean,
  scale: number,
  rotation: number,
): Promise<MatchBox[][]> {
  if (!query.trim() || rotation % 360 !== 0) return [];
  const page = await doc.getPage(pageNumber);
  const tc = await page.getTextContent();
  const { text, ranges } = joinText(tc.items);
  const viewport = page.getViewport({ scale, rotation });
  const q = caseSensitive ? query : query.toLowerCase();
  const hay = caseSensitive ? text : text.toLowerCase();
  const result: MatchBox[][] = [];
  let idx = hay.indexOf(q);
  while (idx !== -1) {
    const mStart = idx;
    const mEnd = idx + q.length;
    const boxes: MatchBox[] = [];
    for (const r of ranges) {
      if (r.end <= mStart || r.start >= mEnd) continue;
      const box = itemBox(r.item, viewport);
      if (box) boxes.push(box);
    }
    result.push(boxes);
    idx = hay.indexOf(q, mEnd);
  }
  return result;
}

export async function renderThumbnail(
  doc: PdfDocument,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  width: number,
): Promise<void> {
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const scale = width / base.width;
  const viewport = page.getViewport({ scale });
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
}
