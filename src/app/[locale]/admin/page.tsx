"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  Send,
  TrendingUp,
  XCircle,
  Clock,
  ArrowUpRight,
  Filter,
  Search,
  ExternalLink,
  FileSpreadsheet,
  RefreshCw,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Tag,
  X,
  Building2,
  Eye,
  FileText,
  Inbox,
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
  phone: string;
  email: string;
  status: string;
  statusColor: string;
  value: string;
  date: string;
  topic: string;
  lastReaction: string;
  type: string;
  website: string;
}

interface GmailMessage {
  id: string;
  subject: string;
  date: string;
  snippet: string;
  direction: string;
  from?: string;
  to?: string;
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<CrmActivity | null>(null);

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

  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [loadingGmail, setLoadingGmail] = useState(false);
  const [gmailError, setGmailError] = useState<string | null>(null);

  const activeEmailForGmail = useMemo(() => {
    if (selectedPartner?.email && selectedPartner.email !== "Nincs email") {
      return selectedPartner.email;
    }
    if (expandedRowId) {
      const activePartner = activities.find((a) => a.id === expandedRowId);
      if (activePartner?.email && activePartner.email !== "Nincs email") {
        return activePartner.email;
      }
    }
    return null;
  }, [selectedPartner, expandedRowId, activities]);

  useEffect(() => {
    if (!activeEmailForGmail) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting derived state when the selection clears, not a render-loop
      setGmailMessages([]);
      return;
    }

    let isMounted = true;
    setLoadingGmail(true);
    setGmailError(null);

    fetch(`/api/gmail-history?email=${encodeURIComponent(activeEmailForGmail)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.messages) {
          setGmailMessages(data.messages);
        } else {
          setGmailMessages([]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Gmail history fetch error:", err);
        setGmailError("Nem sikerült betölteni az e-mail előzményeket.");
      })
      .finally(() => {
        if (isMounted) setLoadingGmail(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeEmailForGmail]);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount, no external data source to subscribe to instead
    fetchCrmData();
  }, [fetchCrmData]);

  const toggleRowExpand = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  // Dinamikus téma és státusz opciók kinyerése a betöltött adatokból
  const availableTopics = useMemo(() => {
    const topics = new Set<string>();
    activities.forEach((a) => {
      if (a.topic && a.topic !== "Nincs adat") topics.add(a.topic);
    });
    return Array.from(topics);
  }, [activities]);

  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>();
    activities.forEach((a) => {
      if (a.status && a.status !== "Nincs adat") statuses.add(a.status);
    });
    return Array.from(statuses);
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === "" ||
        act.name.toLowerCase().includes(searchLower) ||
        act.company.toLowerCase().includes(searchLower) ||
        act.email.toLowerCase().includes(searchLower) ||
        act.phone.toLowerCase().includes(searchLower) ||
        act.topic.toLowerCase().includes(searchLower) ||
        act.lastReaction.toLowerCase().includes(searchLower) ||
        act.status.toLowerCase().includes(searchLower);

      const matchesStatus =
        statusFilter === "all" ||
        act.status.toLowerCase().includes(statusFilter.toLowerCase());

      const matchesTopic =
        topicFilter === "all" ||
        act.topic.toLowerCase().includes(topicFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesTopic;
    });
  }, [activities, searchTerm, statusFilter, topicFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTopicFilter("all");
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
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
              Ellenőrizd a Vercel környezeti változóit: <code className="text-amber-300">GOOGLE_SERVICE_ACCOUNT_EMAIL</code> és <code className="text-amber-300">GOOGLE_PRIVATE_KEY</code>.
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

      {/* 2. Grafikon Szekció */}
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

        <div className="h-64 w-full">
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

      {/* 3. Utolsó CRM Aktivitások Lista / Kibővített Részletes Táblázat */}
      <div className="bg-[#0F1420]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-xl overflow-hidden">
        {/* Lista Fejléc & Kereső & Szűrők */}
        <div className="p-6 border-b border-slate-800/80 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Részletes Tárgyaláskövető & Partner Adattár
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Kattints egy partner sorára az eddigi reakciók és a tárgyalási idővonal kibontásához
              </p>
            </div>

            {/* Kereső mező */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Keresés név, cég, email, tel, téma..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Szűrők sáv (Státusz és Téma szerinti szűrés) */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/60 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold mr-1">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>Szűrők:</span>
            </div>

            {/* Státusz szűrő dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Státusz:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 py-1.5 px-3 rounded-lg text-xs focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">Összes Státusz</option>
                <option value="tárgyal">Aktív tárgyalás</option>
                <option value="kiküld">Kiajánló kiküldve / Outreach</option>
                <option value="elutasít">Visszadobva / Elutasítva</option>
                <option value="új">Új megkeresés</option>
                {availableStatuses.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Téma szűrő dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Téma / Projekt:</span>
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 py-1.5 px-3 rounded-lg text-xs focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">Összes Téma</option>
                <option value="Üllő">Üllő csarnok</option>
                <option value="Czimber">Czimber projekt</option>
                <option value="Szolár">Szolár park</option>
                <option value="Afrika">Afrikai projektek</option>
                <option value="Mentorálás">B2B Mentorálás</option>
                {availableTopics.map((top) => (
                  <option key={top} value={top}>{top}</option>
                ))}
              </select>
            </div>

            {/* Aktív szűrők törlése */}
            {(searchTerm || statusFilter !== "all" || topicFilter !== "all") && (
              <button
                onClick={clearFilters}
                className="ml-auto px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-[11px] font-semibold border border-rose-500/20 flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                Szűrők Törlése
              </button>
            )}
          </div>
        </div>

        {/* CRM Táblázat */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4 w-10"></th>
                <th className="py-3.5 px-4">Megkeresett Neve / Cége</th>
                <th className="py-3.5 px-4">Elérhetőség (Tel / Email)</th>
                <th className="py-3.5 px-4">Dátum</th>
                <th className="py-3.5 px-4">Téma / Projekt</th>
                <th className="py-3.5 px-4">Státusz</th>
                <th className="py-3.5 px-4">Utolsó Reakció</th>
                <th className="py-3.5 px-4 text-right">Részletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-4 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-32 bg-slate-800 rounded mb-1"></div>
                      <div className="h-3 w-24 bg-slate-800/60 rounded"></div>
                    </td>
                    <td className="py-4 px-4"><div className="h-4 w-28 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4"><div className="h-5 w-24 bg-slate-800 rounded-lg"></div></td>
                    <td className="py-4 px-4"><div className="h-5 w-24 bg-slate-800 rounded-full"></div></td>
                    <td className="py-4 px-4"><div className="h-4 w-36 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-4 text-right"><div className="h-6 w-6 bg-slate-800 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredActivities.length > 0 ? (
                filteredActivities.map((act) => {
                  const isExpanded = expandedRowId === act.id;
                  return (
                    <React.Fragment key={act.id}>
                      {/* Fő sor */}
                      <tr
                        onClick={() => toggleRowExpand(act.id)}
                        className={`cursor-pointer transition-colors duration-150 ${
                          isExpanded
                            ? "bg-slate-800/50 border-l-4 border-l-amber-400"
                            : "hover:bg-slate-800/30"
                        }`}
                      >
                        {/* Expand nyíl ikon */}
                        <td className="py-4 px-4 text-slate-500">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-amber-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </td>

                        {/* 1. Megkeresett Neve / Cége */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
                            {act.name}
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            {act.company}
                          </div>
                        </td>

                        {/* 2. Elérhetőség (Tel / Email) */}
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            {act.phone && act.phone !== "Nincs megadva" && (
                              <a
                                href={`tel:${act.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 text-amber-300/90 hover:text-amber-200 text-[11px] font-mono"
                              >
                                <Phone className="w-3 h-3 text-amber-400" />
                                {act.phone}
                              </a>
                            )}
                            {act.email && act.email !== "Nincs email" && (
                              <a
                                href={`mailto:${act.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 text-slate-300 hover:text-white text-[11px] font-mono"
                              >
                                <Mail className="w-3 h-3 text-slate-400" />
                                {act.email}
                              </a>
                            )}
                          </div>
                        </td>

                        {/* 3. Dátum */}
                        <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {act.date}
                          </div>
                        </td>

                        {/* 4. Téma / Projekt */}
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 text-amber-300 border border-slate-700">
                            <Tag className="w-3 h-3 text-amber-400" />
                            {act.topic}
                          </span>
                        </td>

                        {/* 5. Státusz */}
                        <td className="py-4 px-4">
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

                        {/* 6. Utolsó Reakció */}
                        <td className="py-4 px-4 max-w-xs">
                          <div className="text-slate-300 truncate text-[11px] flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{act.lastReaction}</span>
                          </div>
                        </td>

                        {/* 7. Műveletek / Slide-over Modal indító */}
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPartner(act);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold px-2.5"
                            title="Részletes tárgyalási idővonal megnyitása"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            Részletek
                          </button>
                        </td>
                      </tr>

                      {/* Lenyitható Accordion Sor */}
                      {isExpanded && (
                        <tr className="bg-slate-950/60 border-b border-slate-800/80">
                          <td colSpan={8} className="p-6">
                            <div className="bg-[#0B0F17] border border-slate-800 rounded-xl p-5 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                                <div>
                                  <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-amber-400" />
                                    Tárgyalás Részletei: {act.name} ({act.company})
                                  </h3>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    Érték: <span className="text-slate-200 font-bold">{act.value}</span> • Bejegyzés dátuma: <span className="text-slate-300 font-mono">{act.date}</span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setSelectedPartner(act)}
                                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    Teljes Idővonal Modal
                                  </button>
                                </div>
                              </div>

                              {/* Idővonal-szerű nézet az Accordionban */}
                              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                                {/* Idővonal 1. lépés: Megkeresés */}
                                <div className="relative">
                                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900"></div>
                                  <div className="text-xs font-bold text-slate-200">
                                    1. Kapcsolatfelvétel Rögzítve
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    Dátum: <span className="font-mono text-slate-300">{act.date}</span> • Téma: <span className="text-amber-300">{act.topic}</span>
                                  </div>
                                </div>

                                {/* Idővonal 2. lépés: Tárgyalás Státusza */}
                                <div className="relative">
                                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-900"></div>
                                  <div className="text-xs font-bold text-slate-200">
                                    2. Jelenlegi Tárgyalási Státusz
                                  </div>
                                  <div className="text-[11px] text-slate-300 mt-0.5">
                                    <span className="font-semibold">{act.status}</span> (Projekt érték: {act.value})
                                  </div>
                                </div>

                                {/* Idővonal 3. lépés: Utolsó Reakció / Visszajelzés */}
                                <div className="relative">
                                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></div>
                                  <div className="text-xs font-bold text-slate-200">
                                    3. Utolsó Reakció & Jegyzet
                                  </div>
                                  <div className="mt-1 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
                                    {act.lastReaction}
                                  </div>
                                </div>
                              </div>

                              {/* Élő Gmail előzmények az Accordionban */}
                              {gmailMessages.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-slate-800">
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-2 flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                                    Legutóbbi Gmail Üzenetek ({act.email}):
                                  </div>
                                  <div className="space-y-2">
                                    {gmailMessages.slice(0, 3).map((m) => (
                                      <div key={m.id} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-1">
                                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                          <span className={`font-bold ${m.direction === 'Bejövő' ? 'text-emerald-400' : 'text-blue-400'}`}>
                                            [{m.direction}]
                                          </span>
                                          <span>{m.date}</span>
                                        </div>
                                        <div className="font-semibold text-slate-200">{m.subject}</div>
                                        <div className="text-slate-400 text-[11px] truncate">{m.snippet}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    {error
                      ? "Nem sikerült betölteni az adatsorokat."
                      : "Nincs a megadott szűrőknek megfelelő partner a rendszerben."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Modal a Részletes Partner nézethez */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[#0B0F17] border-l border-slate-800 h-full overflow-y-auto shadow-2xl p-6 space-y-6 flex flex-col justify-between">
            <div>
              {/* Modal Fejléc */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Partner Részletes Tárgyaláskövetés
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-100 mt-0.5">
                    {selectedPartner.name}
                  </h2>
                  <p className="text-xs text-slate-400">{selectedPartner.company}</p>
                </div>
                <button
                  onClick={() => setSelectedPartner(null)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Elérhetőségek Kártya */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Telefon</span>
                  <a
                    href={`tel:${selectedPartner.phone}`}
                    className="text-xs font-mono font-bold text-amber-300 hover:underline flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    {selectedPartner.phone}
                  </a>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">E-mail</span>
                  <a
                    href={`mailto:${selectedPartner.email}`}
                    className="text-xs font-mono font-bold text-slate-200 hover:underline flex items-center gap-1.5 truncate"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{selectedPartner.email}</span>
                  </a>
                </div>
                {selectedPartner.website && (
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Weboldal</span>
                    <a
                      href={selectedPartner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono font-bold text-slate-200 hover:underline flex items-center gap-1.5 truncate"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{selectedPartner.website}</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Tárgyalás Áttekintés Kártya */}
              <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Tárgyalás Témája:</span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {selectedPartner.topic}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Tárgyalási Státusz:</span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {selectedPartner.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Becsült Projekt Érték:</span>
                  <span className="text-xs font-bold text-slate-100">{selectedPartner.value}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold">Kapcsolatfelvétel Dátuma:</span>
                  <span className="text-xs font-mono text-slate-300">{selectedPartner.date}</span>
                </div>
              </div>

              {/* Idővonal Szekció */}
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Esemény- és Reakció Idővonal
                </h4>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {/* Node 1 */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900"></div>
                    <div className="text-xs font-bold text-slate-200">
                      Első Kapcsolatfelvétel Megtörtént
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Rögzítve: <span className="font-mono text-slate-300">{selectedPartner.date}</span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1">
                      Kiküldött megkeresés a(z) <span className="text-amber-300">{selectedPartner.topic}</span> témában.
                    </div>
                  </div>

                  {/* Node 2 */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-900"></div>
                    <div className="text-xs font-bold text-slate-200">
                      Tárgyalási Státusz Frissítés
                    </div>
                    <div className="text-xs text-emerald-400 font-semibold mt-0.5">
                      Jelenlegi állapot: {selectedPartner.status}
                    </div>
                  </div>

                  {/* Node 3 */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></div>
                    <div className="text-xs font-bold text-slate-200">
                      Utolsó Reakció & Visszajelzés
                    </div>
                    <div className="mt-2 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
                      {selectedPartner.lastReaction}
                    </div>
                  </div>
                </div>
              </div>

              {/* Élő Levelezési Előzmények Blokkszekció (Gmail API) */}
              <div className="mt-8 border-t border-slate-800/80 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-amber-400" />
                    Élő Levelezési Előzmények (office.homlamentor@gmail.com)
                  </h4>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                    Gmail API
                  </span>
                </div>

                {loadingGmail ? (
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-center gap-3 text-xs text-slate-400">
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>E-mailek szinkronizálása a Gmail API-n keresztül...</span>
                  </div>
                ) : gmailMessages.length > 0 ? (
                  <div className="space-y-3">
                    {gmailMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 hover:border-amber-500/30 transition-all duration-200 shadow-md"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              msg.direction === "Bejövő"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            {msg.direction === "Bejövő" ? (
                              <Inbox className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Send className="w-3 h-3 text-blue-400" />
                            )}
                            {msg.direction}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">{msg.date}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-100">{msg.subject}</div>
                        <div className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 font-sans">
                          {msg.snippet}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-500 text-center">
                    {gmailError || "Nincs közvetlen levelezési előzmény ehhez az e-mail címhez az office.homlamentor@gmail.com fiókban."}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Lábléc Gombok */}
            <div className="border-t border-slate-800 pt-4 flex items-center justify-between gap-3">
              <a
                href="https://docs.google.com/spreadsheets/d/1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-800"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                Google Sheet Szerkesztése
              </a>
              <button
                onClick={() => setSelectedPartner(null)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

