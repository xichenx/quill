import { Plus, X, FileText } from "lucide-react";
import { useViewer } from "../store/viewer";

export default function TabBar({ onOpen }: { onOpen: () => void }) {
  const { docs, activeId, setActive, closeDoc } = useViewer();

  if (docs.length === 0) return null;

  return (
    <div className="flex h-10 shrink-0 items-center gap-1 border-b border-zinc-200/60 bg-surface-alt/80 px-2 backdrop-blur dark:border-zinc-700/30 dark:bg-surface-dark-alt/80">
      <div className="flex flex-1 items-center gap-1 overflow-x-auto">
        {docs.map((d) => {
          const active = d.id === activeId;
          return (
            <button
              key={d.id}
              onClick={() => setActive(d.id)}
              className={
                "group flex min-w-[140px] max-w-[220px] cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 " +
                (active
                  ? "bg-white text-zinc-800 shadow-sm ring-1 ring-zinc-200/60 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700/50"
                  : "text-zinc-500 hover:bg-surface-hover hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-surface-dark-hover dark:hover:text-zinc-300")
              }
            >
              <FileText size={14} className="shrink-0 opacity-50" />
              <span className="flex-1 truncate">{d.name}</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  closeDoc(d.id);
                }}
                className={
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded transition-all " +
                  (active
                    ? "opacity-0 group-hover:opacity-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    : "opacity-0 group-hover:opacity-100 hover:bg-zinc-300/50 dark:hover:bg-zinc-600")
                }
              >
                <X size={12} />
              </span>
            </button>
          );
        })}
      </div>
      <button
        title="打开文件"
        onClick={onOpen}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-all duration-150 hover:bg-surface-hover hover:text-zinc-600 active:scale-95 dark:hover:bg-surface-dark-hover dark:hover:text-zinc-300"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
