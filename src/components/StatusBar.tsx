import { FileText, ChevronRight } from "lucide-react";
import { useActiveDoc, useViewer } from "../store/viewer";

export default function StatusBar() {
  const active = useActiveDoc();
  const { docs } = useViewer();

  return (
    <footer className="status-bar flex h-8 shrink-0 items-center gap-3 border-t border-zinc-200/60 bg-white/90 px-4 text-xs backdrop-blur-xl dark:border-zinc-700/30 dark:bg-zinc-900/90">
      {active ? (
        <>
          <div className="flex items-center gap-2">
            <FileText size={12} className="text-zinc-400" />
            <span className="max-w-[200px] truncate font-medium text-zinc-600 dark:text-zinc-300">
              {active.name}
            </span>
          </div>
          {docs.length > 1 && (
            <span className="flex items-center gap-0.5 text-zinc-300 dark:text-zinc-600">
              <ChevronRight size={10} />
              <span className="tabular-nums">{docs.length} 个标签</span>
            </span>
          )}
          <span className="ml-auto flex items-center gap-2">
            <span className="rounded-lg bg-surface-alt px-2 py-0.5 font-semibold tabular-nums text-zinc-500 dark:bg-surface-dark-alt dark:text-zinc-400">
              第 {active.pageNum} / {active.numPages} 页
            </span>
            <span className="rounded-lg bg-surface-alt px-2 py-0.5 font-semibold tabular-nums text-zinc-500 dark:bg-surface-dark-alt dark:text-zinc-400">
              {Math.round(active.scale * 100)}%
            </span>
            {active.rotation !== 0 && (
              <span className="rounded-lg bg-amber-100 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {active.rotation}°
              </span>
            )}
          </span>
        </>
      ) : (
        <span className="ml-auto font-medium text-zinc-400 dark:text-zinc-500">
          就绪 — Ctrl+O 打开文件
        </span>
      )}
    </footer>
  );
}
