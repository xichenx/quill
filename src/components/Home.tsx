import { FileText, Upload, FolderOpen, X, Clock } from "lucide-react";
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
    <div className="flex flex-1 flex-col items-center overflow-auto bg-zinc-100 px-8 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
          Quill
        </h1>
        <p className="mt-1 text-sm text-zinc-400">轻量 PDF 阅读器</p>

        <button
          onClick={onOpen}
          className={
            "mt-6 flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-10 py-12 text-center transition-colors " +
            (dragging
              ? "border-violet-400 bg-violet-50 dark:bg-violet-950/30"
              : "border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900")
          }
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-500 dark:bg-violet-950/40">
            {dragging ? <Upload size={28} /> : <FolderOpen size={28} />}
          </div>
          <div>
            <p className="font-medium text-zinc-800 dark:text-zinc-100">
              {dragging ? "松开以打开" : "打开 PDF 文件"}
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              点击选择,或将文件拖拽到这里
            </p>
          </div>
        </button>

        {recents.length > 0 && (
          <div className="mt-10">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-500">
              <Clock size={15} />
              最近打开
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {recents.map((r) => (
                <div
                  key={r.path}
                  onClick={() => onOpenRecent(r.path)}
                  className="group relative flex cursor-pointer flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 transition-colors hover:border-violet-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-700"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-500 dark:bg-violet-950/40">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
                      {r.name}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {timeAgo(r.openedAt)}
                    </p>
                  </div>
                  <button
                    title="从列表移除"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecent(r.path);
                    }}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded text-zinc-400 opacity-0 transition hover:bg-zinc-200 group-hover:opacity-100 dark:hover:bg-zinc-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
