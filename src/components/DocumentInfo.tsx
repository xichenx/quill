import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, FileText, Info } from "lucide-react";
import { useActiveDoc } from "../store/viewer";
import type { PdfMeta } from "../lib/pdf";

interface FieldProps {
  label: string;
  value: string;
}

function Field({ label, value }: FieldProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="w-20 shrink-0 text-xs font-medium text-zinc-400 dark:text-zinc-500">
        {label}
      </span>
      <span className="flex-1 text-xs font-medium text-zinc-700 break-all dark:text-zinc-200">
        {value}
      </span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function MetaContent({ meta }: { meta: PdfMeta }) {
  return (
    <div className="divide-y divide-zinc-200/60 dark:divide-zinc-700/30">
      <Field label="标题" value={meta.title} />
      <Field label="作者" value={meta.author} />
      <Field label="主题" value={meta.subject} />
      <Field label="关键词" value={meta.keywords} />
      <div className="my-2 h-px bg-zinc-200/60 dark:bg-zinc-700/30" />
      <Field label="创建程序" value={meta.creator} />
      <Field label="PDF 生成器" value={meta.producer} />
      <Field label="PDF 版本" value={meta.pdfVersion} />
      <div className="my-2 h-px bg-zinc-200/60 dark:bg-zinc-700/30" />
      <Field label="页数" value={String(meta.pageCount)} />
      <Field label="页面尺寸" value={meta.pageSize} />
      <Field label="文件大小" value={formatBytes(meta.fileSize)} />
      <div className="my-2 h-px bg-zinc-200/60 dark:bg-zinc-700/30" />
      <Field label="创建时间" value={meta.creationDate} />
      <Field label="修改时间" value={meta.modificationDate} />
    </div>
  );
}

export default function DocumentInfo({ onClose }: { onClose: () => void }) {
  const active = useActiveDoc();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  if (!active) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className="animate-scale-in w-[420px] max-h-[80vh] flex flex-col rounded-2xl border border-zinc-200/80 bg-white shadow-2xl dark:border-zinc-700/50 dark:bg-zinc-900"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-zinc-200/60 px-5 py-4 dark:border-zinc-700/30">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 dark:bg-accent-950/40">
            <Info size={18} className="text-accent-500 dark:text-accent-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FileText size={14} className="shrink-0 text-zinc-400" />
              <p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {active.name}
              </p>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">文档属性</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-surface-hover hover:text-zinc-600 dark:hover:bg-surface-dark-hover dark:hover:text-zinc-300"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {active.meta ? (
            <MetaContent meta={active.meta} />
          ) : (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="h-4 w-32 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-3 w-48 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
              <p className="mt-2 text-xs text-zinc-400">正在加载文档信息…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export function useDocInfo() {
  const [open, setOpen] = useState(false);

  function DocInfoPortal() {
    if (!open) return null;
    return <DocumentInfo onClose={() => setOpen(false)} />;
  }

  return { open: () => setOpen(true), Portal: DocInfoPortal };
}
