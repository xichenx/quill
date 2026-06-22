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
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  if (!searchOpen) return null;

  return (
    <div className="search-panel animate-slide-in-right flex w-72 shrink-0 flex-col border-l border-zinc-200/60 bg-white dark:border-zinc-700/30 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-200/60 px-4 py-3 dark:border-zinc-700/30">
        <Search size={15} className="text-zinc-400" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          搜索
        </span>
        <button
          onClick={closeSearch}
          title="关闭 (Esc)"
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-surface-hover hover:text-zinc-600 dark:hover:bg-surface-dark-hover dark:hover:text-zinc-300"
        >
          <X size={15} />
        </button>
      </div>

      {/* Search input area */}
      <div className="border-b border-zinc-200/60 p-4 dark:border-zinc-700/30">
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200/60 bg-surface px-3 py-1.5 transition-all duration-150 focus-within:border-accent-400 focus-within:ring-2 focus-within:ring-accent-100 dark:border-zinc-700/50 dark:bg-surface-dark-alt dark:focus-within:border-accent-500 dark:focus-within:ring-accent-900/50">
          <Search size={14} className="text-zinc-400" />
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
            className="h-8 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-zinc-400"
          />
          <button
            title="区分大小写"
            onClick={toggleCaseSensitive}
            className={
              "flex h-6 w-6 items-center justify-center rounded-lg transition-all " +
              (searchCaseSensitive
                ? "bg-accent-100 text-accent-600 shadow-sm dark:bg-accent-900/50 dark:text-accent-300"
                : "text-zinc-400 hover:bg-surface-hover hover:text-zinc-600 dark:hover:bg-surface-dark-hover")
            }
          >
            <CaseSensitive size={14} />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={runSearch}
            disabled={!searchQuery.trim()}
            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent-600 text-sm font-semibold text-white shadow-md shadow-accent-600/20 transition-all duration-150 hover:bg-accent-700 hover:shadow-lg hover:shadow-accent-600/25 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
          >
            {searchLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              "搜索"
            )}
          </button>
          <button
            title="上一个 (Shift+Enter)"
            onClick={prevMatch}
            disabled={!searchResults.length}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200/60 text-zinc-500 transition-all hover:bg-surface-hover hover:text-zinc-700 disabled:opacity-30 dark:border-zinc-700/50 dark:hover:bg-surface-dark-hover dark:hover:text-zinc-300"
          >
            <ChevronUp size={15} />
          </button>
          <button
            title="下一个 (Enter)"
            onClick={nextMatch}
            disabled={!searchResults.length}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200/60 text-zinc-500 transition-all hover:bg-surface-hover hover:text-zinc-700 disabled:opacity-30 dark:border-zinc-700/50 dark:hover:bg-surface-dark-hover dark:hover:text-zinc-300"
          >
            <ChevronDown size={15} />
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!searchLoading && searchQuery && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400">
                {searchResults.length
                  ? `${searchActive >= 0 ? searchActive + 1 : "–"} / ${searchResults.length} 个结果`
                  : "未找到匹配项"}
              </span>
            </div>
          </div>
        )}
        {searchResults.length === 0 && !searchLoading && searchQuery && (
          <div className="flex flex-col items-center gap-3 px-4 py-16">
            <div className="rounded-xl bg-surface-alt p-3 dark:bg-surface-dark-alt">
              <Search size={24} className="text-zinc-300 dark:text-zinc-600" />
            </div>
            <p className="text-xs font-medium text-zinc-400">没有找到匹配项</p>
          </div>
        )}
        <div className="space-y-0.5 px-2 pb-3">
          {searchResults.map((r, i) => (
            <button
              key={i}
              onClick={() => gotoResult(i)}
              className={
                "block w-full rounded-xl px-3 py-2.5 text-left transition-all duration-150 " +
                (i === searchActive
                  ? "bg-accent-100/70 shadow-sm dark:bg-accent-900/30"
                  : "hover:bg-surface-hover dark:hover:bg-surface-dark-hover")
              }
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-400">
                  第 {r.page} 页
                </span>
                {i === searchActive && (
                  <span className="rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    当前
                  </span>
                )}
              </div>
              <div className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                {r.snippet}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
