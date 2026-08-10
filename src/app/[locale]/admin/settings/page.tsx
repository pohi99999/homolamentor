"use client";

import { useCallback, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Activity,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { ErrorBanner, PageHeader } from "../components/PageHeader";
import { SPREADSHEET_URL, useAdminData } from "../AdminDataContext";

type CheckState = "idle" | "running" | "ok" | "fail";

interface EndpointCheck {
  key: string;
  label: string;
  url: string;
  state: CheckState;
  detail?: string;
}

const initialChecks: EndpointCheck[] = [
  { key: "crm", label: "Google Sheets CRM (/api/crm-sync)", url: "/api/crm-sync", state: "idle" },
  {
    key: "gmail",
    label: "Gmail előzmények (/api/gmail-history)",
    url: "/api/gmail-history?email=diagnostics@example.com",
    state: "idle",
  },
];

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const { sheetNames, lastSynced, error } = useAdminData();
  const [checks, setChecks] = useState<EndpointCheck[]>(initialChecks);
  const [running, setRunning] = useState(false);

  const runDiagnostics = useCallback(async () => {
    setRunning(true);
    setChecks((prev) => prev.map((c) => ({ ...c, state: "running" as CheckState, detail: undefined })));

    const results = await Promise.all(
      initialChecks.map(async (check) => {
        try {
          const res = await fetch(check.url, { cache: "no-store" });
          return {
            ...check,
            state: (res.ok ? "ok" : "fail") as CheckState,
            detail: `HTTP ${res.status}`,
          };
        } catch (err: unknown) {
          return {
            ...check,
            state: "fail" as CheckState,
            detail: err instanceof Error ? err.message : String(err),
          };
        }
      })
    );

    setChecks(results);
    setRunning(false);
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Beállítások"
        subtitle="Hozzáférés, csatlakoztatott szolgáltatások és rendszerdiagnosztika"
        showLiveBadge={false}
      />

      <ErrorBanner />

      {/* Fiók */}
      <div className="bg-[#0F1420]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-xl p-6">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          Bejelentkezett Fiók
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Zárt Google OAuth rendszer — csak engedélyezett vállalati fiókok férnek hozzá
        </p>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center gap-3">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- külső Google avatar URL, nem statikus asset
              <img
                src={session.user.image}
                alt={session.user.name || "Avatar"}
                className="w-11 h-11 rounded-full border border-amber-500/40"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400">
                {session?.user?.name ? session.user.name.charAt(0) : "A"}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-slate-100">
                {session?.user?.name || "Adminisztrátor"}
              </p>
              <p className="text-xs text-slate-400">{session?.user?.email || "Zárt hozzáférés"}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/api/auth/signin" })}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Kijelentkezés
          </button>
        </div>
      </div>

      {/* Csatlakoztatott adatforrások */}
      <div className="bg-[#0F1420]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-xl p-6">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-amber-400" />
          Csatlakoztatott Adatforrások
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          A CRM adatok forrásai és aktuális kapcsolati állapotuk
        </p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Google Sheets CRM</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  error
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}
              >
                {error ? "Hiba" : "Aktív"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Master: {sheetNames.master || "—"} • Contacts: {sheetNames.contacts || "—"}
            </p>
            <p className="text-[11px] text-slate-500">
              Utolsó frissítés: {lastSynced || "még nem futott le"}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Link
                href="/admin/sync"
                className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 inline-flex items-center gap-1"
              >
                <Activity className="w-3 h-3" />
                Sync vezérlőpult
              </Link>
              <a
                href={SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Táblázat megnyitása
              </a>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Gmail API előzmények</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Igény szerint
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              A levelezési előzmények akkor töltődnek be, amikor egy partner sorát kinyitod vagy megnyitod
              a részletes panelt.
            </p>
            <Link
              href="/admin/outreach"
              className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 pt-1"
            >
              <Mail className="w-3 h-3" />
              Megkeresések megtekintése
            </Link>
          </div>
        </div>
      </div>

      {/* Diagnosztika */}
      <div className="bg-[#0F1420]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              Rendszerdiagnosztika
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Élő ellenőrzés az admin felület által használt API végpontokra
            </p>
          </div>
          <button
            onClick={runDiagnostics}
            disabled={running}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all disabled:opacity-50"
          >
            {running ? (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            ) : (
              <Activity className="w-4 h-4 text-amber-400" />
            )}
            {running ? "Ellenőrzés fut…" : "Ellenőrzés Indítása"}
          </button>
        </div>

        <div className="mt-5 divide-y divide-slate-800/60 border border-slate-800 rounded-xl overflow-hidden">
          {checks.map((check) => (
            <div
              key={check.key}
              className="px-4 py-3.5 flex items-center justify-between gap-4 bg-slate-900/50 text-xs"
            >
              <span className="text-slate-300 font-medium">{check.label}</span>
              <span className="flex items-center gap-2 shrink-0">
                {check.detail && <span className="font-mono text-[11px] text-slate-500">{check.detail}</span>}
                {check.state === "idle" && <span className="text-[11px] text-slate-500">Nincs lefuttatva</span>}
                {check.state === "running" && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
                {check.state === "ok" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {check.state === "fail" && <XCircle className="w-4 h-4 text-rose-400" />}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
