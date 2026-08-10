"use client";

import {
  CheckCircle2,
  Database,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Table2,
} from "lucide-react";
import { ErrorBanner, PageHeader } from "../components/PageHeader";
import { SPREADSHEET_URL, useAdminData } from "../AdminDataContext";

export default function AdminSyncPage() {
  const { stats, activities, sheetNames, lastSynced, lastSyncedAt, loading, syncing, error, sync } =
    useAdminData();

  const isBusy = loading || syncing;

  const rows = [
    { label: "Master CRM munkalap", value: sheetNames.master || "—", icon: Table2 },
    { label: "Contacts munkalap", value: sheetNames.contacts || "—", icon: Table2 },
    { label: "Betöltött adatsorok", value: String(activities.length), icon: Database },
    { label: "Összes lead (Master + Contacts)", value: String(stats.totalLeads), icon: Database },
    {
      label: "Utolsó sikeres szinkron",
      value: lastSyncedAt
        ? new Date(lastSyncedAt).toLocaleString("hu-HU", { dateStyle: "medium", timeStyle: "medium" })
        : "Még nem futott le",
      icon: RefreshCw,
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Google Sheets Sync"
        subtitle="Élő adatkapcsolat állapota és kézi szinkronizáció a CRM táblákkal"
        showLiveBadge={false}
      />

      <ErrorBanner />

      {/* Sync vezérlőpanel */}
      <div className="bg-[#0F1420]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 ${
                error
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}
            >
              {isBusy ? (
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              ) : error ? (
                <ShieldAlert className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {isBusy
                  ? "Szinkronizálás folyamatban…"
                  : error
                  ? "A szinkronizáció hibára futott"
                  : "Az adatkapcsolat élő és működik"}
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                A gombra kattintva a rendszer meghívja a <code className="text-amber-300">/api/crm-sync</code>{" "}
                végpontot, újraolvassa a Google Sheets CRM táblákat, és az admin felület minden nézete
                azonnal a friss adatokkal frissül.
              </p>
              {lastSynced && !isBusy && (
                <p className="text-[11px] text-slate-500 mt-2">Utolsó frissítés: {lastSynced}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => sync(true)}
              disabled={isBusy}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isBusy ? "animate-spin" : ""}`} />
              {isBusy ? "Szinkronizálás…" : "Szinkronizálás Indítása"}
            </button>
            <a
              href={SPREADSHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              Sheet Megnyitása
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Kapcsolat részletei */}
        <div className="border-t border-slate-800/80 divide-y divide-slate-800/60">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.label}
                className="px-6 py-3.5 flex items-center justify-between gap-4 text-xs hover:bg-slate-900/40 transition-colors"
              >
                <span className="flex items-center gap-2.5 text-slate-400 font-medium">
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  {row.label}
                </span>
                {loading ? (
                  <div className="h-4 w-28 bg-slate-800 animate-pulse rounded"></div>
                ) : (
                  <span className="font-mono font-semibold text-slate-200 text-right">{row.value}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Statisztikai bontás a szinkronizált adatokról */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Összes Lead", value: stats.totalLeads, tone: "text-amber-300" },
          { label: "Kiküldött Megkeresés", value: stats.sentOutreach, tone: "text-blue-400" },
          { label: "Aktív Tárgyalás", value: stats.activeNegotiations, tone: "text-emerald-400" },
          { label: "Elutasítva", value: stats.rejected, tone: "text-rose-400" },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-[#0F1420]/80 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-xl shadow-xl"
          >
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              {item.label}
            </span>
            {loading ? (
              <div className="h-8 w-16 bg-slate-800/80 animate-pulse rounded-lg mt-3"></div>
            ) : (
              <span className={`text-3xl font-black block mt-3 ${item.tone}`}>{item.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
