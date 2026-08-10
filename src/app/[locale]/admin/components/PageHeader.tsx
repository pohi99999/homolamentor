"use client";

import React from "react";
import { CheckCircle2, FileSpreadsheet, RefreshCw, ShieldAlert } from "lucide-react";
import { SPREADSHEET_URL, useAdminData } from "../AdminDataContext";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  /** Élő kapcsolat jelvény megjelenítése a cím mellett. */
  showLiveBadge?: boolean;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, showLiveBadge = true, children }: PageHeaderProps) {
  const { loading, syncing, error, sync, sheetNames, lastSynced } = useAdminData();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-amber-200 to-amber-400 bg-clip-text text-transparent">
            {title}
          </h1>
          {showLiveBadge && !error && !loading && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Élő Google API ({sheetNames.master || "Master"})
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400 mt-1">
          {subtitle}
          {lastSynced && (
            <span className="ml-2 text-slate-500">(Utolsó frissítés: {lastSynced})</span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {children}
        <button
          onClick={() => sync(true)}
          disabled={syncing || loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-amber-400 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Szinkronizálás..." : "Szinkronizálás Újra"}
        </button>
        <a
          href={SPREADSHEET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Google Sheet Megnyitása
        </a>
      </div>
    </div>
  );
}

export function ErrorBanner() {
  const { error, syncing, sync } = useAdminData();

  if (!error) return null;

  return (
    <div className="bg-rose-500/10 border border-rose-500/30 p-5 rounded-2xl backdrop-blur-xl shadow-xl flex items-start gap-4">
      <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shrink-0">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
          Google Sheets API Kapcsolódási Hiba
        </h3>
        <p className="text-xs text-rose-200/90 mt-1 font-mono break-all bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/60">
          {error}
        </p>
        <p className="text-[11px] text-slate-400 mt-2">
          Ellenőrizd a Vercel környezeti változóit:{" "}
          <code className="text-amber-300">GOOGLE_SERVICE_ACCOUNT_EMAIL</code> és{" "}
          <code className="text-amber-300">GOOGLE_PRIVATE_KEY</code>.
        </p>
        <button
          onClick={() => sync(true)}
          disabled={syncing}
          className="mt-3 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[11px] font-semibold border border-rose-500/40 inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
          Újrapróbálkozás
        </button>
      </div>
    </div>
  );
}
