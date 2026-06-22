import { FileText, Upload, FolderOpen, X, Clock, Sparkles } from "lucide-react";
import { useViewer } from "../store/viewer";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  return `${d} 天前`;
}

export default function Home({
  dragging,
  onOpen,
  onOpenRecent,
}: {
  dragging: boolean;
  onOpen: () => void;
  onOpenRecent: (path: string) => void;
}) {
  const { recents, removeRecent } = useViewer();

  return (
    <div className="flex flex-1 flex-col items-center overflow-auto bg-surface px-6 py-12 dark:bg-surface-dark">
      <div className="w-full max-w-2xl">
        {/* Hero */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-100 shadow-inner dark:bg-accent-900/30">
            <Sparkles size={28} className="text-accent-600 dark:text-accent-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
            Quill
          </h1>
          <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            轻量 PDF 阅读器 · 简洁、快速、优雅
          </p>
        </div>

        {/* Drop zone */}
        <button
          onClick={onOpen}
          className={
            "mt-8 flex w-full flex-col items-center gap-4 rounded-3xl border-2 border-dashed px-10 py-14 text-center transition-all duration-200 " +
            (dragging
              ? "border-accent-400 bg-accent-50 shadow-lg shadow-accent-200/50 scale-[1.02] dark:border-accent-500 dark:bg-accent-950/30 dark:shadow-accent-900/30"
              : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md dark:border-zinc-700/50 dark:bg-zinc-900 dark:hover:border-zinc-600/50")
          }
        >
          <div
            className={
              "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-200 " +
              (dragging
                ? "bg-accent-200 text-accent-600 dark:bg-accent-800 dark:text-accent-300"
                : "bg-accent-50 text-accent-500 dark:bg-accent-950/40 dark:text-accent-400")
            }
          >
            {dragging ? (
              <Upload size={30} className="animate-bounce" />
            ) : (
              <FolderOpen size={30} />
            )}
          </div>
          <div>
            <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              {dragging ? "松开以打开文件" : "打开 PDF 文件"}
            </p>
            <p className="mt-1.5 text-sm text-zinc-400">
              点击选择文件，或拖拽 PDF 到此处
            </p>
          </div>
        </button>

        {/* Recents */}
        {recents.length > 0 && (
          <div className="mt-12">
            <div className="mb-4 flex items-center gap-2.5">
              <Clock size={15} className="text-zinc-400" />
              <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                最近打开
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {recents.map((r) => (
                <div
                  key={r.path}
                  onClick={() => onOpenRecent(r.path)}
                  className="group relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-zinc-200/60 bg-white p-4 transition-all duration-150 hover:border-accent-300 hover:shadow-lg hover:shadow-accent-100/50 active:scale-[0.98] dark:border-zinc-700/50 dark:bg-zinc-900 dark:hover:border-accent-600 dark:hover:shadow-accent-900/20"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-500 dark:bg-accent-950/40 dark:text-accent-400">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {r.name}
                    </p>
                    <p className="mt-1 text-xs font-medium text-zinc-400">
                      {timeAgo(r.openedAt)}
                    </p>
                  </div>
                  <button
                    title="从列表移除"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecent(r.path);
                    }}
                    className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-lg text-zinc-400 opacity-0 transition-all hover:bg-zinc-200 group-hover:opacity-100 dark:hover:bg-zinc-700"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer hint */}
        <p className="mt-16 text-center text-xs text-zinc-300 dark:text-zinc-600">
          Ctrl+O 打开 · Ctrl+F 搜索 · Ctrl+B 书签 · ← → 翻页
        </p>
      </div>
    </div>
  );
}
