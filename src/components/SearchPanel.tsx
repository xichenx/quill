import { useEffect, useRef } from "react";
import {
  Search,
  X,
  CaseSensitive,
  Loader2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useViewer } from "../store/viewer";

export default function SearchPanel() {
  const {
    searchOpen,
    searchQuery,
    searchCaseSensitive,
    searchResults,
    searchLoading,
    searchActive,
    setSearchQuery,
    toggleCaseSensitive,
    runSearch,
    gotoResult,
    nextMatch,
    prevMatch,
    closeSearch,
  } = useViewer();

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  if (!searchOpen) return null;

  return (
    <div className="flex w-72 shrink-0 flex-col border-l border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          搜索
        </span>
        <button
          onClick={closeSearch}
          title="关闭 (Esc)"
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-700"
        >
          <X size={16} />
        </button>
      </div>

      <div className="border-b border-zinc-200 p-3 dark:border-zinc-800">
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 dark:border-zinc-700 dark:bg-zinc-800">
          <Search size={15} className="text-zinc-400" />
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (searchResults.length) e.shiftKey ? prevMatch() : nextMatch();
                else runSearch();
              }
            }}
            placeholder="输入关键词…"
            className="h-8 flex-1 bg-transparent text-sm outline-none"
          />
          <button
            title="区分大小写"
            onClick={toggleCaseSensitive}
            className={
              "flex h-6 w-6 items-center justify-center rounded " +
              (searchCaseSensitive
                ? "bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300"
                : "text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-700")
            }
          >
            <CaseSensitive size={16} />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={runSearch}
            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-600 text-sm font-medium text-white hover:bg-violet-700"
          >
            {searchLoading ? <Loader2 size={15} className="animate-spin" /> : "搜索"}
          </button>
          <button
            title="上一个 (Shift+Enter)"
            onClick={prevMatch}
            disabled={!searchResults.length}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-200/60 disabled:opacity-30 dark:border-zinc-700 dark:hover:bg-zinc-700"
          >
            <ChevronUp size={16} />
          </button>
          <button
            title="下一个 (Enter)"
            onClick={nextMatch}
            disabled={!searchResults.length}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-200/60 disabled:opacity-30 dark:border-zinc-700 dark:hover:bg-zinc-700"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!searchLoading && searchQuery && (
          <p className="px-3 py-2 text-xs text-zinc-400">
            {searchResults.length
              ? `${searchActive >= 0 ? searchActive + 1 : "–"} / ${searchResults.length} 个结果`
              : "无结果"}
          </p>
        )}
        {searchResults.map((r, i) => (
          <button
            key={i}
            onClick={() => gotoResult(i)}
            className={
              "block w-full border-b border-zinc-100 px-3 py-2 text-left text-xs transition-colors hover:bg-zinc-200/50 dark:border-zinc-800/60 dark:hover:bg-zinc-800 " +
              (i === searchActive ? "bg-violet-50 dark:bg-violet-950/40" : "")
            }
          >
            <div className="mb-0.5 font-medium text-zinc-400">
              第 {r.page} 页
            </div>
            <div className="leading-snug text-zinc-600 dark:text-zinc-300">
              {r.snippet}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
