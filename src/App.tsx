import { useCallback, useEffect, useState } from "react";
import { useViewer } from "./store/viewer";
import { openPdfDialog, readPdfPath, fileToOpened } from "./lib/files";
import { toast } from "./components/Toast";
import { ToastContainer } from "./components/Toast";
import MenuBar from "./components/MenuBar";
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
      toast(`打开 PDF 失败: ${e}`, "error");
    }
  }, [openFile]);

  const openRecent = useCallback(
    async (path: string) => {
      try {
        await openFile(await readPdfPath(path));
      } catch (e) {
        toast(`无法打开最近文件: ${e}`, "error");
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
      if (mod && e.key.toLowerCase() === "p") {
        e.preventDefault();
        window.print();
        return;
      }
      if (e.key === "Escape") {
        closeSearch();
        return;
      }
      if (e.key === "F11") {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
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
      {/* Menu bar row */}
      <MenuBar onOpen={openViaDialog} onOpenRecent={openRecent} />
      {hasDocs ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1">
            <Sidebar />
            <div className="flex min-h-0 flex-1 flex-col">
              <TabBar onOpen={openViaDialog} />
              <Viewer />
            </div>
            <SearchPanel />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <Home
            dragging={dragging}
            onOpen={openViaDialog}
            onOpenRecent={openRecent}
          />
        </div>
      )}

      <StatusBar />
      <ToastContainer />
    </div>
  );
}

export default App;
