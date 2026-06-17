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
const SCALE_STEP = 0.2;
const DEFAULT_SCALE = 1.25;
const RECENTS_KEY = "quill.recents";
const THEME_KEY = "quill.theme";
const MAX_RECENTS = 12;

export type FitMode = "custom" | "width" | "page";
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
  setScale: (s: number) => void;
  setFitScale: (s: number) => void;
  setFitMode: (m: FitMode) => void;
  rotateCW: () => void;

  toggleSidebar: () => void;
  setSidebarTab: (t: SidebarTab) => void;
  toggleBookmark: () => void;
  removeBookmark: (page: number) => void;

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
      const docState: DocState = {
        id,
        doc,
        path: file.path,
        name: file.name,
        numPages: doc.numPages,
        pageNum: 1,
        scale: DEFAULT_SCALE,
        fitMode: "width",
        rotation: 0,
        outline: [],
        bookmarks: [],
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
    setScale: (s) => patchActive({ scale: clampScale(s), fitMode: "custom" }),
    setFitScale: (s) => patchActive({ scale: clampScale(s) }),
    setFitMode: (m) => patchActive({ fitMode: m }),
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
      patchActive({
        bookmarks: exists
          ? a.bookmarks.filter((b) => b.page !== a.pageNum)
          : [...a.bookmarks, { page: a.pageNum, label: `第 ${a.pageNum} 页` }].sort(
              (x, y) => x.page - y.page,
            ),
      });
    },
    removeBookmark: (page) => {
      const a = active();
      if (a) patchActive({ bookmarks: a.bookmarks.filter((b) => b.page !== page) });
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
