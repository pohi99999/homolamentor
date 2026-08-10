"use client";

import { CheckCircle2, Loader2, ShieldAlert, X } from "lucide-react";
import { useAdminData } from "../AdminDataContext";

const toneStyles: Record<string, string> = {
  info: "bg-slate-900/95 border-amber-500/30 text-slate-200",
  success: "bg-slate-900/95 border-emerald-500/40 text-slate-100",
  error: "bg-slate-900/95 border-rose-500/40 text-slate-100",
};

export function AdminToaster() {
  const { toasts, dismissToast } = useAdminData();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3 w-[min(22rem,calc(100vw-3rem))]"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-2xl border backdrop-blur-xl shadow-2xl p-4 flex items-start gap-3 ${
            toneStyles[toast.tone]
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {toast.tone === "info" && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
            {toast.tone === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.tone === "error" && <ShieldAlert className="w-4 h-4 text-rose-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold">{toast.title}</p>
            {toast.message && (
              <p className="text-[11px] text-slate-400 mt-0.5 break-words">{toast.message}</p>
            )}
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            aria-label="Értesítés bezárása"
            className="shrink-0 p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
