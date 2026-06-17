import { Plus, X, FileText } from "lucide-react";
import { useViewer } from "../store/viewer";

export default function TabBar({ onOpen }: { onOpen: () => void }) {
  const { docs, activeId, setActive, closeDoc } = useViewer();

  if (docs.length === 0) return null;

  return (
    <div className="flex h-9 shrink-0 items-stretch gap-1 border-b border-zinc-200 bg-zinc-100 px-2 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-1 items-stretch gap-1 overflow-x-auto">
        {docs.map((d) => {
          const active = d.id === activeId;
          return (
            <div
              key={d.id}
              onClick={() => setActive(d.id)}
              className={
                "group flex min-w-[120px] max-w-[200px] cursor-pointer items-center gap-2 rounded-t-lg border-b-2 px-3 text-sm transition-colors " +
                (active
                  ? "border-violet-500 bg-white text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  : "border-transparent text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800")
              }
            >
              <FileText size={14} className="shrink-0 opacity-60" />
              <span className="flex-1 truncate">{d.name}</span>
              <button
                title="关闭"
                onClick={(e) => {
                  e.stopPropagation();
                  closeDoc(d.id);
                }}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-400 opacity-0 transition hover:bg-zinc-300/60 group-hover:opacity-100 dark:hover:bg-zinc-700"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
      <button
        title="打开文件"
        onClick={onOpen}
        className="my-1 flex w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-200/70 dark:hover:bg-zinc-800"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}
