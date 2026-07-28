"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Send,
  TrendingUp,
  XCircle,
  Clock,
  ArrowUpRight,
  Plus,
  Filter,
  Search,
  ExternalLink,
  FileSpreadsheet,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface CrmStats {
  totalLeads: number;
  sentOutreach: number;
  activeNegotiations: number;
  rejected: number;
}

interface CrmActivity {
  id: string;
  name: string;
  company: string;
  email: string;
  status: string;
  statusColor: string;
  value: string;
  date: string;
  type: string;
}

interface ChartItem {
  month: string;
  leadek: number;
  megkeresesek: number;
  konverzio: number;
}

const defaultChartData: ChartItem[] = [
  { month: "Jan", leadek: 24, megkeresesek: 18, konverzio: 6 },
  { month: "Feb", leadek: 35, megkeresesek: 28, konverzio: 10 },
  { month: "Már", leadek: 48, megkeresesek: 36, konverzio: 14 },
  { month: "Ápr", leadek: 62, megkeresesek: 45, konverzio: 18 },
  { month: "Máj", leadek: 85, megkeresesek: 58, konverzio: 22 },
  { month: "Jún", leadek: 110, megkeresesek: 74, konverzio: 28 },
  { month: "Júl", leadek: 148, megkeresesek: 92, konverzio: 36 },
];

export default function AdminDashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<{ master?: string; contacts?: string }>({});
  const [lastSynced, setLastSynced] = useState<string>("");
  const [stats, setStats] = useState<CrmStats>({
    totalLeads: 0,
    sentOutreach: 0,
    activeNegotiations: 0,
    rejected: 0,
  });
  const [activities, setActivities] = useState<CrmActivity[]>([]);

  const fetchCrmData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setSyncing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/crm-sync");
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.details || data.error || "Ismeretlen Google API olvasási hiba történt.");
      } else {
        setStats(data.stats);
        setActivities(data.activities || []);
        if (data.sheetNames) setSheetNames(data.sheetNames);
        if (data.lastSyncedAt) {
          const formattedTime = new Date(data.lastSyncedAt).toLocaleTimeString("hu-HU", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
          setLastSynced(formattedTime);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Hálózati hiba a szinkronizáció során: ${msg}`);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchCrmData();
  }, [fetchCrmData]);

  const filteredActivities = activities.filter(
    (act) =>
      act.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-amber-200 to-amber-400 bg-clip-text text-transparent">
              Vezetői Műszerfal & CRM Szinkron
            </h1>
            {!error && !loading && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Élő Google API ({sheetNames.master || "Master"})
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Szigorú Google Sheets API élő adatkapcsolat • Homola Mentor KFT
            {lastSynced && <span className="ml-2 text-slate-500">(Utolsó frissítés: {lastSynced})</span>}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCrmData(true)}
            disabled={syncing || loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Szinkronizálás..." : "Szinkronizálás Újra"}
          </button>
          <a
            href="https://docs.google.com/spreadsheets/d/1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Google Sheet Megnyitása
          </a>
        </div>
      </div>

      {/* ERROR ALERT BANNER */}
      {error && (
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
              Ellenőrizd a Vercel környezeti változóit: <code className="text-amber-300">GOOGLE_SERVICE_ACCOUNT_EMAIL</code> és <code className="text-amber-300">GOOGLE_PRIVATE_KEY</code> (ne felejtsd el megosztani a Google Sheet-et a Service Account e-mail címmel).
            </p>
          </div>
        </div>
      )}

      {/* 1. Statisztikai Kártyák Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Kártya 1: Összes Lead */}
        <div className="bg-[#0F1420]/80 border border-slate-800/80 hover:border-amber-500/30 p-5 rounded-2xl backdrop-blur-xl shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Összes Lead
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            {loading ? (
              <div className="h-9 w-20 bg-slate-800/80 animate-pulse rounded-lg"></div>
            ) : (
              <span className="text-3xl font-black text-slate-100">{stats.totalLeads}</span>
            )}
            <span className="inline-flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              Élő bejegyzések
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Master CRM Vevőlista & Contacts adatsorok
          </p>
        </div>

        {/* Kártya 2: Kiküldött Megkeresések */}
        <div className="bg-[#0F1420]/80 border border-slate-800/80 hover:border-amber-500/30 p-5 rounded-2xl backdrop-blur-xl shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Kiküldött Megkeresések
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Send className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            {loading ? (
              <div className="h-9 w-20 bg-slate-800/80 animate-pulse rounded-lg"></div>
            ) : (
              <span className="text-3xl font-black text-slate-100">{stats.sentOutreach}</span>
            )}
            <span className="inline-flex items-center text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
              Outreach státusz
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Kiküldött e-mail & piszkozat kampányok
          </p>
        </div>

        {/* Kártya 3: Aktív Tárgyalások */}
        <div className="bg-[#0F1420]/80 border border-slate-800/80 hover:border-amber-500/30 p-5 rounded-2xl backdrop-blur-xl shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Aktív Tárgyalások
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            {loading ? (
              <div className="h-9 w-20 bg-slate-800/80 animate-pulse rounded-lg"></div>
            ) : (
              <span className="text-3xl font-black text-slate-100">{stats.activeNegotiations}</span>
            )}
            <span className="inline-flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              Folyamatban
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Tárgyalás alatt álló partnerségek
          </p>
        </div>

        {/* Kártya 4: Elutasítva */}
        <div className="bg-[#0F1420]/80 border border-slate-800/80 hover:border-amber-500/30 p-5 rounded-2xl backdrop-blur-xl shadow-xl transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Elutasítva / Archiválva
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            {loading ? (
              <div className="h-9 w-20 bg-slate-800/80 animate-pulse rounded-lg"></div>
            ) : (
              <span className="text-3xl font-black text-slate-100">{stats.rejected}</span>
            )}
            <span className="inline-flex items-center text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              Archív
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Elutasított vagy hibás e-mail leadek
          </p>
        </div>
      </div>

      {/* 2. Grafikon Szekció (Recharts) */}
      <div className="bg-[#0F1420]/80 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              B2B Lead Növekedés és Konverziós Trendek
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Havi lebontású teljesítmény mutatók a Google Sheets CRM adatok alapján
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
              Összes Lead
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 ml-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
              Konverzió
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-900/40 rounded-xl">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={defaultChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLeadek" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorKonverzio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0B0F17",
                    borderColor: "#334155",
                    borderRadius: "0.75rem",
                    color: "#f8fafc",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="leadek"
                  name="Összes Lead"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorLeadek)"
                />
                <Area
                  type="monotone"
                  dataKey="konverzio"
                  name="Konverzió"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorKonverzio)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Utolsó CRM Aktivitások Lista / Táblázat */}
      <div className="bg-[#0F1420]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-xl overflow-hidden">
        {/* Lista Fejléc & Kereső */}
        <div className="p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Legutóbbi CRM Adatsorok
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Valós idejű adatsorok a Master CRM munkalapról
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Keresés név, cég vagy típus alapján..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 w-64"
              />
            </div>
            <button className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Aktiviti Táblázat */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-6">Ügyfél / Cég</th>
                <th className="py-3.5 px-6">Szolgáltatás</th>
                <th className="py-3.5 px-6">Státusz</th>
                <th className="py-3.5 px-6">Projekt Érték</th>
                <th className="py-3.5 px-6">Utolsó Frissítés</th>
                <th className="py-3.5 px-6 text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="h-4 w-32 bg-slate-800 rounded mb-1"></div>
                      <div className="h-3 w-48 bg-slate-800/60 rounded"></div>
                    </td>
                    <td className="py-4 px-6"><div className="h-5 w-24 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-6"><div className="h-5 w-28 bg-slate-800 rounded-full"></div></td>
                    <td className="py-4 px-6"><div className="h-4 w-20 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-6"><div className="h-4 w-16 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-6 text-right"><div className="h-6 w-6 bg-slate-800 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredActivities.length > 0 ? (
                filteredActivities.map((act) => (
                  <tr
                    key={act.id}
                    className="hover:bg-slate-800/30 transition-colors duration-150"
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-100 text-sm">
                        {act.name}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        {act.company} {act.email ? `• ${act.email}` : ""}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {act.type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          act.statusColor === "emerald"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : act.statusColor === "amber"
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                            : act.statusColor === "blue"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            act.statusColor === "emerald"
                              ? "bg-emerald-400"
                              : act.statusColor === "amber"
                              ? "bg-amber-400"
                              : act.statusColor === "blue"
                              ? "bg-blue-400"
                              : "bg-rose-400"
                          }`}
                        ></span>
                        {act.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-200">
                      {act.value}
                    </td>
                    <td className="py-4 px-6 text-slate-400">{act.date}</td>
                    <td className="py-4 px-6 text-right">
                      <a
                        href="https://docs.google.com/spreadsheets/d/1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block p-1.5 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    {error ? "Nem sikerült betölteni az adatsorokat." : "Nincs a keresésnek megfelelő CRM aktivitás."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
