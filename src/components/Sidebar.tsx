import { useEffect, useRef, useState } from "react";
import { Images, List, Bookmark as BookmarkIcon, X } from "lucide-react";
import { useViewer, useActiveDoc, type SidebarTab } from "../store/viewer";
import { renderThumbnail, type PdfDocument, type OutlineNode } from "../lib/pdf";

const THUMB_WIDTH = 130;

function Thumbnail({
  doc,
  page,
  active,
  onClick,
}: {
  doc: PdfDocument;
  page: number;
  active: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !rendered && canvasRef.current) {
          setRendered(true);
          renderThumbnail(doc, page, canvasRef.current, THUMB_WIDTH).catch(
            console.error,
          );
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [doc, page, rendered]);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className="group flex w-full flex-col items-center gap-1.5 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
    >
      <div
        className={
          "overflow-hidden rounded-md ring-1 transition-shadow " +
          (active
            ? "shadow-md ring-2 ring-violet-500"
            : "ring-zinc-200 group-hover:ring-zinc-300 dark:ring-zinc-700")
        }
        style={{ width: THUMB_WIDTH }}
      >
        <canvas
          ref={canvasRef}
          className="block bg-white"
          style={{ width: THUMB_WIDTH, minHeight: 60 }}
        />
      </div>
      <span
        className={
          "text-xs tabular-nums " +
          (active
            ? "font-medium text-violet-600 dark:text-violet-400"
            : "text-zinc-500")
        }
      >
        {page}
      </span>
    </button>
  );
}

function OutlineTree({
  nodes,
  depth,
  onGo,
  currentPage,
}: {
  nodes: OutlineNode[];
  depth: number;
  onGo: (page: number) => void;
  currentPage: number;
}) {
  return (
    <ul>
      {nodes.map((n, i) => (
        <li key={i}>
          <button
            onClick={() => n.page && onGo(n.page)}
            disabled={!n.page}
            style={{ paddingLeft: 8 + depth * 14 }}
            className={
              "flex w-full items-center justify-between gap-2 rounded-md py-1.5 pr-2 text-left text-sm transition-colors hover:bg-zinc-200/60 disabled:opacity-50 dark:hover:bg-zinc-800 " +
              (n.page === currentPage
                ? "text-violet-600 dark:text-violet-400"
                : "text-zinc-700 dark:text-zinc-300")
            }
          >
            <span className="truncate">{n.title || "(无标题)"}</span>
            {n.page && (
              <span className="shrink-0 text-xs tabular-nums text-zinc-400">
                {n.page}
              </span>
            )}
          </button>
          {n.children.length > 0 && (
            <OutlineTree
              nodes={n.children}
              depth={depth + 1}
              onGo={onGo}
              currentPage={currentPage}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

function TabButton({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={
        "flex h-9 flex-1 items-center justify-center transition-colors " +
        (active
          ? "border-b-2 border-violet-500 text-violet-600 dark:text-violet-400"
          : "border-b-2 border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200")
      }
    >
      {children}
    </button>
  );
}

export default function Sidebar() {
  const active = useActiveDoc();
  const { sidebarOpen, sidebarTab, goToPage, setSidebarTab, removeBookmark } =
    useViewer();

  if (!sidebarOpen) return null;

  const tabs: { id: SidebarTab; icon: React.ReactNode; label: string }[] = [
    { id: "thumbnails", icon: <Images size={17} />, label: "缩略图" },
    { id: "outline", icon: <List size={17} />, label: "目录" },
    { id: "bookmarks", icon: <BookmarkIcon size={17} />, label: "书签" },
  ];

  return (
    <aside className="flex w-48 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((t) => (
          <TabButton
            key={t.id}
            title={t.label}
            active={sidebarTab === t.id}
            onClick={() => setSidebarTab(t.id)}
          >
            {t.icon}
          </TabButton>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-1">
        {!active && (
          <p className="px-3 py-6 text-center text-xs text-zinc-400">
            未打开文件
          </p>
        )}

        {active && sidebarTab === "thumbnails" && (
          <div className="pb-3">
            {Array.from({ length: active.numPages }, (_, i) => i + 1).map((p) => (
              <Thumbnail
                key={p}
                doc={active.doc}
                page={p}
                active={p === active.pageNum}
                onClick={() => goToPage(p)}
              />
            ))}
          </div>
        )}

        {active && sidebarTab === "outline" && (
          <div className="py-1">
            {active.outline.length ? (
              <OutlineTree
                nodes={active.outline}
                depth={0}
                onGo={goToPage}
                currentPage={active.pageNum}
              />
            ) : (
              <p className="px-3 py-6 text-center text-xs text-zinc-400">
                此文档没有目录
              </p>
            )}
          </div>
        )}

        {active && sidebarTab === "bookmarks" && (
          <div className="py-1">
            {active.bookmarks.length ? (
              active.bookmarks.map((b) => (
                <div
                  key={b.page}
                  className="group flex items-center gap-1 rounded-md pr-1 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                >
                  <button
                    onClick={() => goToPage(b.page)}
                    className={
                      "flex flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm " +
                      (b.page === active.pageNum
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-zinc-700 dark:text-zinc-300")
                    }
                  >
                    <BookmarkIcon size={14} className="shrink-0" />
                    <span className="truncate">{b.label}</span>
                  </button>
                  <button
                    title="删除书签"
                    onClick={() => removeBookmark(b.page)}
                    className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 opacity-0 transition hover:bg-zinc-300/60 group-hover:opacity-100 dark:hover:bg-zinc-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className="px-3 py-6 text-center text-xs text-zinc-400">
                还没有书签
                <br />
                在工具栏点书签按钮添加当前页
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
