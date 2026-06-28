import { useEffect, useRef, useState } from "react";
import { Images, List, Bookmark as BookmarkIcon, X, Pencil } from "lucide-react";
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
      className="group flex w-full flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 transition-all duration-150 hover:bg-surface-hover dark:hover:bg-surface-dark-hover"
    >
      <div
        className={
          "overflow-hidden rounded-lg transition-all duration-200 " +
          (active
            ? "shadow-lg ring-2 ring-accent-500 scale-[1.02]"
            : "shadow-sm ring-1 ring-zinc-200/60 group-hover:ring-zinc-300/60 dark:ring-zinc-700/50 dark:group-hover:ring-zinc-600/50")
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
          "text-xs font-semibold tabular-nums transition-colors " +
          (active
            ? "text-accent-600 dark:text-accent-400"
            : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300")
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
    <ul className="space-y-0.5">
      {nodes.map((n, i) => (
        <li key={i}>
          <button
            onClick={() => n.page && onGo(n.page)}
            disabled={!n.page}
            style={{ paddingLeft: 8 + depth * 16 }}
            className={
              "flex w-full items-center justify-between gap-2 rounded-lg py-2 pr-2 text-left text-sm font-medium transition-colors duration-150 disabled:opacity-40 " +
              (n.page === currentPage
                ? "bg-accent-100/60 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300"
                : "text-zinc-600 hover:bg-surface-hover hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-surface-dark-hover dark:hover:text-zinc-200")
            }
          >
            <span className="truncate">{n.title || "(无标题)"}</span>
            {n.page && (
              <span className="shrink-0 text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
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
        "relative flex h-10 flex-1 items-center justify-center transition-colors duration-150 " +
        (active
          ? "text-accent-600 dark:text-accent-400"
          : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300")
      }
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-accent-500" />
      )}
    </button>
  );
}

function BookmarkItem({
  label,
  active,
  onGo,
  onRemove,
  onRename,
}: {
  page?: number;
  label: string;
  active: boolean;
  onGo: () => void;
  onRemove: () => void;
  onRename: (label: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== label) {
      onRename(trimmed);
    } else {
      setEditValue(label);
    }
    setEditing(false);
  };

  return (
    <div
      className="group flex items-center gap-1 rounded-lg pr-1 transition-colors hover:bg-surface-hover dark:hover:bg-surface-dark-hover"
    >
      <button
        onClick={onGo}
        className={
          "flex flex-1 items-center gap-2.5 px-2.5 py-2 text-left text-sm font-medium transition-colors " +
          (active
            ? "text-accent-600 dark:text-accent-400"
            : "text-zinc-600 dark:text-zinc-300")
        }
      >
        <BookmarkIcon size={14} className="shrink-0" />
        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setEditValue(label);
                setEditing(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded border-0 bg-transparent py-0 text-sm font-medium text-zinc-700 outline-none ring-1 ring-accent-400 dark:text-zinc-200 dark:ring-accent-500"
          />
        ) : (
          <span
            className="truncate cursor-text"
            onDoubleClick={() => setEditing(true)}
            title="双击重命名"
          >
            {label}
          </span>
        )}
      </button>
      <button
        title="重命名书签"
        onClick={() => {
          setEditValue(label);
          setEditing(true);
        }}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-zinc-400 opacity-0 transition-all hover:bg-zinc-200 group-hover:opacity-100 dark:hover:bg-zinc-700"
      >
        <Pencil size={12} />
      </button>
      <button
        title="删除书签"
        onClick={onRemove}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-zinc-400 opacity-0 transition-all hover:bg-zinc-200 group-hover:opacity-100 dark:hover:bg-zinc-700"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export default function Sidebar() {
  const active = useActiveDoc();
  const { sidebarOpen, sidebarTab, goToPage, setSidebarTab, removeBookmark, renameBookmark } =
    useViewer();

  if (!sidebarOpen) return null;

  const tabs: { id: SidebarTab; icon: React.ReactNode; label: string }[] = [
    { id: "thumbnails", icon: <Images size={16} />, label: "缩略图" },
    { id: "outline", icon: <List size={16} />, label: "目录" },
    { id: "bookmarks", icon: <BookmarkIcon size={16} />, label: "书签" },
  ];

  return (
    <aside className="sidebar-area animate-slide-in-left flex w-48 shrink-0 flex-col border-r border-zinc-200/60 bg-white dark:border-zinc-700/30 dark:bg-zinc-900">
      {/* Tab header */}
      <div className="flex border-b border-zinc-200/60 dark:border-zinc-700/30">
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

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-1 py-2">
        {!active && (
          <div className="flex flex-col items-center gap-2 px-3 py-12">
            <div className="rounded-xl bg-surface-alt p-3 dark:bg-surface-dark-alt">
              <Images size={24} className="text-zinc-300 dark:text-zinc-600" />
            </div>
            <p className="text-xs font-medium text-zinc-400">打开 PDF 以开始</p>
          </div>
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
              <div className="flex flex-col items-center gap-2 px-3 py-12">
                <div className="rounded-xl bg-surface-alt p-3 dark:bg-surface-dark-alt">
                  <List size={24} className="text-zinc-300 dark:text-zinc-600" />
                </div>
                <p className="text-xs font-medium text-zinc-400">此文档没有目录</p>
              </div>
            )}
          </div>
        )}

        {active && sidebarTab === "bookmarks" && (
          <div className="space-y-0.5 py-1">
            {active.bookmarks.length ? (
              active.bookmarks.map((b) => (
                <BookmarkItem
                  key={b.page}
                  page={b.page}
                  label={b.label}
                  active={b.page === active.pageNum}
                  onGo={() => goToPage(b.page)}
                  onRemove={() => removeBookmark(b.page)}
                  onRename={(label) => renameBookmark(b.page, label)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center gap-2 px-3 py-12">
                <div className="rounded-xl bg-surface-alt p-3 dark:bg-surface-dark-alt">
                  <BookmarkIcon size={24} className="text-zinc-300 dark:text-zinc-600" />
                </div>
                <p className="text-center text-xs font-medium leading-relaxed text-zinc-400">
                  还没有书签
                  <br />
                  <span className="text-zinc-300 dark:text-zinc-600">Ctrl+B 添加当前页</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
