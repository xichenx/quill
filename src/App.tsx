import { useCallback, useEffect, useState } from "react";
import { useViewer } from "./store/viewer";
import { openPdfDialog, readPdfPath, fileToOpened } from "./lib/files";
import Toolbar from "./components/Toolbar";
import TabBar from "./components/TabBar";
import Sidebar from "./components/Sidebar";
import Viewer from "./components/Viewer";
import Home from "./components/Home";
import SearchPanel from "./components/SearchPanel";
import StatusBar from "./components/StatusBar";

function App() {
  const {
    docs,
    theme,
    openFile,
    removeRecent,
    nextPage,
    prevPage,
    zoomIn,
    zoomOut,
    openSearch,
    closeSearch,
    toggleBookmark,
    nextMatch,
    prevMatch,
  } = useViewer();
  const [dragging, setDragging] = useState(false);

  const openViaDialog = useCallback(async () => {
    try {
      const f = await openPdfDialog();
      if (f) await openFile(f);
    } catch (e) {
      console.error("打开 PDF 失败:", e);
    }
  }, [openFile]);

  const openRecent = useCallback(
    async (path: string) => {
      try {
        await openFile(await readPdfPath(path));
      } catch (e) {
        console.error(e);
        removeRecent(path);
      }
    },
    [openFile, removeRecent],
  );

  const openDroppedFile = useCallback(
    async (file: File) => {
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        await openFile(await fileToOpened(file));
      }
    },
    [openFile],
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "o") {
        e.preventDefault();
        openViaDialog();
        return;
      }
      if (mod && e.key.toLowerCase() === "f") {
        e.preventDefault();
        openSearch();
        return;
      }
      if (e.key === "Escape") {
        closeSearch();
        return;
      }
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT") return;
      if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleBookmark();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") nextPage();
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") prevPage();
      else if (mod && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        zoomIn();
      } else if (mod && e.key === "-") {
        e.preventDefault();
        zoomOut();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    nextPage,
    prevPage,
    zoomIn,
    zoomOut,
    openSearch,
    closeSearch,
    toggleBookmark,
    openViaDialog,
    nextMatch,
    prevMatch,
  ]);

  const hasDocs = docs.length > 0;

  return (
    <div
      className="flex h-full flex-col bg-surface text-zinc-800 dark:bg-surface-dark dark:text-zinc-200"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) openDroppedFile(f);
      }}
    >
      <Toolbar onOpen={openViaDialog} />
      <TabBar onOpen={openViaDialog} />
      <div className="flex min-h-0 flex-1">
        {hasDocs && <Sidebar />}
        {hasDocs ? (
          <Viewer />
        ) : (
          <Home
            dragging={dragging}
            onOpen={openViaDialog}
            onOpenRecent={openRecent}
          />
        )}
        {hasDocs && <SearchPanel />}
      </div>
      <StatusBar />
    </div>
  );
}

export default App;
