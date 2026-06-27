import { create } from "zustand";
import {
  getOutline,
  searchPdf,
  type PdfDocument,
  type OutlineNode,
  type SearchMatch,
} from "../lib/pdf";
import { loadPdf } from "../lib/pdf";
import { type OpenedFile } from "../lib/files";

const MIN_SCALE = 0.25;
const MAX_SCALE = 5;
const SCALE_STEP = 0.1;
const DEFAULT_SCALE = 1.25;
const RECENTS_KEY = "quill.recents";
const THEME_KEY = "quill.theme";
const BOOKMARKS_KEY = "quill.bookmarks";
const POSITIONS_KEY = "quill.positions";
const MAX_RECENTS = 12;

export type FitMode = "custom" | "width" | "page";
export type ScrollMode = "paged" | "continuous";
export type SidebarTab = "thumbnails" | "outline" | "bookmarks";
export type Theme = "light" | "dark";

export interface Bookmark {
  page: number;
  label: string;
}

export interface RecentFile {
  path: string;
  name: string;
  openedAt: number;
}

export interface DocState {
  id: string;
  doc: PdfDocument;
  path: string | null;
  name: string;
  numPages: number;
  pageNum: number;
  scale: number;
  fitMode: FitMode;
  scrollMode: ScrollMode;
  rotation: number;
  outline: OutlineNode[];
  bookmarks: Bookmark[];
}

interface ScrollTarget {
  page: number;
  nonce: number;
}

interface State {
  docs: DocState[];
  activeId: string | null;

  sidebarOpen: boolean;
  sidebarTab: SidebarTab;
  theme: Theme;
  recents: RecentFile[];

  scrollTarget: ScrollTarget | null;

  searchOpen: boolean;
  searchQuery: string;
  searchCaseSensitive: boolean;
  searchResults: SearchMatch[];
  searchLoading: boolean;
  searchActive: number;

  openFile: (file: OpenedFile) => Promise<void>;
  closeDoc: (id: string) => void;
  setActive: (id: string) => void;
  removeRecent: (path: string) => void;

  setPage: (n: number) => void;
  goToPage: (n: number) => void;
  nextPage: () => void;
  prevPage: () => void;

  zoomIn: () => void;
  zoomOut: () => void;
  zoomBy: (delta: number) => void;
  resetZoom: () => void;
  setScale: (s: number) => void;
  setFitScale: (s: number) => void;
  setFitMode: (m: FitMode) => void;
  setScrollMode: (m: ScrollMode) => void;
  rotateCW: () => void;

  toggleSidebar: () => void;
  setSidebarTab: (t: SidebarTab) => void;
  toggleBookmark: () => void;
  removeBookmark: (page: number) => void;
  renameBookmark: (page: number, label: string) => void;

  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (q: string) => void;
  toggleCaseSensitive: () => void;
  runSearch: () => Promise<void>;
  gotoResult: (index: number) => void;
  nextMatch: () => void;
  prevMatch: () => void;

  toggleTheme: () => void;
}

const clampScale = (s: number) =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(s * 100) / 100));

function loadRecents(): RecentFile[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecents(recents: RecentFile[]) {
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recents));
}

function loadTheme(): Theme {
  return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
}

// Bookmark persistence: keyed by file path.
interface StoredBookmarks {
  [path: string]: Bookmark[];
}

interface StoredPosition {
  pageNum: number;
  scale: number;
  fitMode: FitMode;
  scrollMode: ScrollMode;
  rotation: number;
}

interface StoredPositions {
  [path: string]: StoredPosition;
}

function loadPositions(): StoredPositions {
  try {
    return JSON.parse(localStorage.getItem(POSITIONS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function savePosition(path: string | null, pos: StoredPosition) {
  if (!path) return;
  const all = loadPositions();
  all[path] = pos;
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(all));
}

function loadDocPosition(path: string | null): StoredPosition | null {
  if (!path) return null;
  return loadPositions()[path] ?? null;
}

function loadBookmarks(): StoredBookmarks {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveBookmarks(bookmarks: StoredBookmarks) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

function loadDocBookmarks(path: string | null): Bookmark[] {
  if (!path) return [];
  return loadBookmarks()[path] ?? [];
}

function persistDocBookmarks(path: string | null, bookmarks: Bookmark[]) {
  if (!path) return;
  const all = loadBookmarks();
  all[path] = bookmarks;
  saveBookmarks(all);
}

let idSeq = 0;

export const useViewer = create<State>((set, get) => {
  // Mutate the active doc and trigger a re-render.
  const patchActive = (patch: Partial<DocState>) =>
    set((s) => ({
      docs: s.docs.map((d) =>
        d.id === s.activeId ? { ...d, ...patch } : d,
      ),
    }));

  const active = () => {
    const s = get();
    return s.docs.find((d) => d.id === s.activeId) ?? null;
  };

  return {
    docs: [],
    activeId: null,

    sidebarOpen: true,
    sidebarTab: "thumbnails",
    theme: loadTheme(),
    recents: loadRecents(),

    scrollTarget: null,

    searchOpen: false,
    searchQuery: "",
    searchCaseSensitive: false,
    searchResults: [],
    searchLoading: false,
    searchActive: -1,

    openFile: async (file) => {
      const doc = await loadPdf(file.data);
      const id = `doc-${++idSeq}`;
      const saved = loadDocPosition(file.path);
      const docState: DocState = {
        id,
        doc,
        path: file.path,
        name: file.name,
        numPages: doc.numPages,
        pageNum: saved?.pageNum ?? 1,
        scale: saved?.scale ?? DEFAULT_SCALE,
        fitMode: saved?.fitMode ?? "custom",
        scrollMode: saved?.scrollMode ?? "paged",
        rotation: saved?.rotation ?? 0,
        outline: [],
        bookmarks: loadDocBookmarks(file.path),
      };
      set((s) => {
        let recents = s.recents;
        if (file.path) {
          recents = [
            { path: file.path, name: file.name, openedAt: Date.now() },
            ...s.recents.filter((r) => r.path !== file.path),
          ].slice(0, MAX_RECENTS);
          saveRecents(recents);
        }
        return {
          docs: [...s.docs, docState],
          activeId: id,
          recents,
          searchResults: [],
          searchQuery: "",
          searchActive: -1,
        };
      });
      getOutline(doc)
        .then((outline) =>
          set((s) => ({
            docs: s.docs.map((d) => (d.id === id ? { ...d, outline } : d)),
          })),
        )
        .catch(console.error);
    },

    closeDoc: (id) =>
      set((s) => {
        const docs = s.docs.filter((d) => d.id !== id);
        const closed = s.docs.find((d) => d.id === id);
        if (closed?.path) {
          savePosition(closed.path, {
            pageNum: closed.pageNum,
            scale: closed.scale,
            fitMode: closed.fitMode,
            scrollMode: closed.scrollMode,
            rotation: closed.rotation,
          });
        }
        let activeId = s.activeId;
        if (s.activeId === id) {
          const idx = s.docs.findIndex((d) => d.id === id);
          activeId = docs[idx]?.id ?? docs[idx - 1]?.id ?? docs[0]?.id ?? null;
        }
        return { docs, activeId };
      }),

    setActive: (id) => set({ activeId: id, searchResults: [], searchActive: -1 }),

    removeRecent: (path) =>
      set((s) => {
        const recents = s.recents.filter((r) => r.path !== path);
        saveRecents(recents);
        return { recents };
      }),

    setPage: (n) => {
      const a = active();
      if (!a) return;
      patchActive({ pageNum: Math.min(Math.max(1, n), a.numPages) });
    },
    goToPage: (n) => {
      const a = active();
      if (!a) return;
      const page = Math.min(Math.max(1, n), a.numPages);
      patchActive({ pageNum: page });
      set((s) => ({
        scrollTarget: { page, nonce: (s.scrollTarget?.nonce ?? 0) + 1 },
      }));
    },
    nextPage: () => get().goToPage((active()?.pageNum ?? 1) + 1),
    prevPage: () => get().goToPage((active()?.pageNum ?? 1) - 1),

    zoomIn: () => {
      const a = active();
      if (a) patchActive({ scale: clampScale(a.scale + SCALE_STEP), fitMode: "custom" });
    },
    zoomOut: () => {
      const a = active();
      if (a) patchActive({ scale: clampScale(a.scale - SCALE_STEP), fitMode: "custom" });
    },
    zoomBy: (delta: number) => {
      const a = active();
      if (a) patchActive({ scale: clampScale(a.scale + delta), fitMode: "custom" });
    },
    resetZoom: () => {
      const a = active();
      if (a) patchActive({ scale: DEFAULT_SCALE, fitMode: "custom" });
    },
    setScale: (s) => patchActive({ scale: clampScale(s), fitMode: "custom" }),
    setFitScale: (s) => patchActive({ scale: clampScale(s) }),
    setFitMode: (m) => patchActive({ fitMode: m }),
    setScrollMode: (m) => patchActive({ scrollMode: m }),
    rotateCW: () => {
      const a = active();
      if (a) patchActive({ rotation: (a.rotation + 90) % 360 });
    },

    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    setSidebarTab: (t) => set({ sidebarTab: t }),
    toggleBookmark: () => {
      const a = active();
      if (!a) return;
      const exists = a.bookmarks.some((b) => b.page === a.pageNum);
      const bookmarks = exists
        ? a.bookmarks.filter((b) => b.page !== a.pageNum)
        : [...a.bookmarks, { page: a.pageNum, label: `第 ${a.pageNum} 页` }].sort(
            (x, y) => x.page - y.page,
          );
      patchActive({ bookmarks });
      persistDocBookmarks(a.path, bookmarks);
    },
    removeBookmark: (page) => {
      const a = active();
      if (!a) return;
      const bookmarks = a.bookmarks.filter((b) => b.page !== page);
      patchActive({ bookmarks });
      persistDocBookmarks(a.path, bookmarks);
    },
    renameBookmark: (page, label) => {
      const a = active();
      if (!a) return;
      const bookmarks = a.bookmarks.map((b) =>
        b.page === page ? { ...b, label } : b,
      );
      patchActive({ bookmarks });
      persistDocBookmarks(a.path, bookmarks);
    },

    openSearch: () => set({ searchOpen: true }),
    closeSearch: () => set({ searchOpen: false }),
    setSearchQuery: (q) => set({ searchQuery: q }),
    toggleCaseSensitive: () =>
      set((s) => ({ searchCaseSensitive: !s.searchCaseSensitive })),
    runSearch: async () => {
      const a = active();
      const { searchQuery, searchCaseSensitive } = get();
      if (!a || !searchQuery.trim()) {
        set({ searchResults: [], searchActive: -1 });
        return;
      }
      set({ searchLoading: true });
      try {
        const results = await searchPdf(a.doc, searchQuery, searchCaseSensitive);
        set({ searchResults: results, searchLoading: false, searchActive: -1 });
        if (results.length) get().gotoResult(0);
      } catch (e) {
        console.error(e);
        set({ searchLoading: false });
      }
    },
    gotoResult: (index) => {
      const { searchResults } = get();
      const r = searchResults[index];
      if (!r) return;
      set({ searchActive: index });
      get().goToPage(r.page);
    },
    nextMatch: () => {
      const { searchResults, searchActive } = get();
      if (!searchResults.length) return;
      get().gotoResult((searchActive + 1) % searchResults.length);
    },
    prevMatch: () => {
      const { searchResults, searchActive } = get();
      if (!searchResults.length) return;
      get().gotoResult(
        (searchActive - 1 + searchResults.length) % searchResults.length,
      );
    },

    toggleTheme: () =>
      set((s) => {
        const theme = s.theme === "light" ? "dark" : "light";
        localStorage.setItem(THEME_KEY, theme);
        return { theme };
      }),
  };
});

export const useActiveDoc = () =>
  useViewer((s) => s.docs.find((d) => d.id === s.activeId) ?? null);
