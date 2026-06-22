import { create } from "zustand";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";

type ToastType = "error" | "success" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: ToastItem[];
  toast: (message: string, type?: ToastType) => void;
  dismiss: (id: number) => void;
}

let toastId = 0;

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  toast: (message, type = "info") => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

const iconMap = {
  error: AlertCircle,
  success: CheckCircle,
  info: Info,
};

const colorMap = {
  error: "border-red-400/40 bg-red-50 text-red-800 dark:border-red-700/40 dark:bg-red-950 dark:text-red-200",
  success: "border-emerald-400/40 bg-emerald-50 text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-950 dark:text-emerald-200",
  info: "border-accent-400/40 bg-accent-50 text-accent-800 dark:border-accent-700/40 dark:bg-accent-950 dark:text-accent-200",
};

export function ToastContainer() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon = iconMap[t.type];
        return (
          <div
            key={t.id}
            className={
              "pointer-events-auto animate-slide-in-right flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur-sm " +
              colorMap[t.type]
            }
          >
            <Icon size={16} className="shrink-0" />
            <span>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-1 shrink-0 rounded-lg p-0.5 opacity-60 transition-opacity hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Hook-friendly helper to call toast outside React components. */
export const toast = (message: string, type: ToastType = "info") => {
  useToast.getState().toast(message, type);
};
