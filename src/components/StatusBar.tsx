import { useActiveDoc } from "../store/viewer";

export default function StatusBar() {
  const active = useActiveDoc();

  return (
    <footer className="flex h-7 shrink-0 items-center gap-3 border-t border-zinc-200 bg-white/80 px-3 text-xs text-zinc-500 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
      {active ? (
        <>
          <span className="max-w-[40%] truncate">{active.name}</span>
          <span className="ml-auto tabular-nums">
            第 {active.pageNum} / {active.numPages} 页
          </span>
          <span className="tabular-nums">{Math.round(active.scale * 100)}%</span>
          {active.rotation !== 0 && <span>旋转 {active.rotation}°</span>}
        </>
      ) : (
        <span className="ml-auto">就绪</span>
      )}
    </footer>
  );
}
