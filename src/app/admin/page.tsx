"use client";

import { useState } from "react";
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

// Mockup chart adatok
const chartData = [
  { month: "Jan", leadek: 24, megkeresesek: 18, konverzio: 6 },
  { month: "Feb", leadek: 35, megkeresesek: 28, konverzio: 10 },
  { month: "Már", leadek: 48, megkeresesek: 36, konverzio: 14 },
  { month: "Ápr", leadek: 62, megkeresesek: 45, konverzio: 18 },
  { month: "Máj", leadek: 85, megkeresesek: 58, konverzio: 22 },
  { month: "Jún", leadek: 110, megkeresesek: 74, konverzio: 28 },
  { month: "Júl", leadek: 148, megkeresesek: 92, konverzio: 36 },
];

// Mockup utolsó CRM aktivitások adatai
const recentActivities = [
  {
    id: "1",
    name: "Kovács Péter",
    company: "Balaton Luxury Real Estate Kft.",
    email: "p.kovacs@balatonluxury.hu",
    status: "Aktív Tárgyalás",
    statusColor: "emerald",
    value: "12 500 000 Ft",
    date: "Ma, 10:45",
    type: "Ingatlan Portál",
  },
  {
    id: "2",
    name: "Nagy István",
    company: "Solar Tech Solutions Group",
    email: "istvan.nagy@solartech.hu",
    status: "Kiküldött Megkeresés",
    statusColor: "amber",
    value: "8 200 000 Ft",
    date: "Tegnap, 16:30",
    type: "B2B Mentorálás",
  },
  {
    id: "3",
    name: "Dr. Szabó Anna",
    company: "Afri-Invest Capital Ltd.",
    email: "anna.szabo@afri-invest.com",
    status: "Aktív Tárgyalás",
    statusColor: "emerald",
    value: "25 000 000 Ft",
    date: "2026.07.26",
    type: "Afrika Inkubátor",
  },
  {
    id: "4",
    name: "Molnár Tamás",
    company: "Veszprém Ipari Park Kft.",
    email: "tamas.molnar@vipark.hu",
    status: "Új Kapcsolat",
    statusColor: "blue",
    value: "5 000 000 Ft",
    date: "2026.07.25",
    type: "Üzletfejlesztés",
  },
  {
    id: "5",
    name: "Horváth Béla",
    company: "Global Trade Holding",
    email: "bela.horvath@globaltrade.hu",
    status: "Elutasítva",
    statusColor: "rose",
    value: "0 Ft",
    date: "2026.07.22",
    type: "Generális Mentorálás",
  },
];

export default function AdminDashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredActivities = recentActivities.filter(
    (act) =>
      act.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-amber-200 to-amber-400 bg-clip-text text-transparent">
            Vezetői Műszerfal & CRM Szinkron
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Élő kapcsolat a Google Sheets CRM rendszerekkel • Homola Mentor KFT
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Google Sheet Megnyitása
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all">
            <Plus className="w-4 h-4" />
            Új Lead Hozzáadása
          </button>
        </div>
      </div>

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
            <span className="text-3xl font-black text-slate-100">148</span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +14% ezen a héten
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Regisztrált érdeklődők és megkeresések
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
            <span className="text-3xl font-black text-slate-100">92</span>
            <span className="inline-flex items-center text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
              88% válaszarány
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Automatizált & direkt outreach kampányok
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
            <span className="text-3xl font-black text-slate-100">24</span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              45.7M Ft pipeline
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Zárás előtt álló vagy folyamatban lévő ügyletek
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
            <span className="text-3xl font-black text-slate-100">12</span>
            <span className="inline-flex items-center text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              8.1% mulasztás
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Inaktív vagy nem kvalifikált partnerek
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
              Havi lebontású teljesítmény mutatók a Google Sheets adatok alapján
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
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
        </div>
      </div>

      {/* 3. Utolsó CRM Aktivitások Lista / Táblázat */}
      <div className="bg-[#0F1420]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-xl overflow-hidden">
        {/* Lista Fejléc & Kereső */}
        <div className="p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Utolsó CRM Aktivitások
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Valós idejű adatszinkron a Google Sheets CRM táblázatból
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
              {filteredActivities.length > 0 ? (
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
                        {act.company} • {act.email}
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
                      <button className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Nincs a keresésnek megfelelő CRM aktivitás.
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
