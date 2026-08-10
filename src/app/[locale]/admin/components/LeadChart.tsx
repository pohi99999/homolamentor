"use client";

import { Info, Loader2, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAdminData } from "../AdminDataContext";

export function LeadChart() {
  const { loading, chartData, counts } = useAdminData();

  // Egyetlen adatpontból nem rajzolható ki értelmes trendvonal.
  const hasTrend = chartData.length >= 2;

  return (
    <div className="bg-[#0F1420]/80 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            B2B Lead Növekedés és Konverziós Trendek
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Halmozott állomány a CRM-ben rögzített kapcsolatfelvételi dátumok alapján
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
            Összes Lead
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400 ml-3">
            <span className="w-3 h-3 rounded-full bg-blue-400 inline-block"></span>
            Megkeresés
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400 ml-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
            Tárgyalás
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-900/40 rounded-xl">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        ) : hasTrend ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLeadek" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorMegkeresesek" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorKonverzio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
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
                name="Összes Lead (halmozott)"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorLeadek)"
              />
              <Area
                type="monotone"
                dataKey="megkeresesek"
                name="Kiküldött Megkeresés"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorMegkeresesek)"
              />
              <Area
                type="monotone"
                dataKey="konverzio"
                name="Aktív Tárgyalás"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorKonverzio)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-900/40 rounded-xl text-center px-6">
            <Info className="w-6 h-6 text-slate-500" />
            <p className="text-xs text-slate-400 max-w-md">
              {chartData.length === 1
                ? "Egyetlen hónapból még nem rajzolható trendvonal — a görbe a második hónap adatainak rögzítése után jelenik meg."
                : "Nincs értelmezhető kapcsolatfelvételi dátum a CRM-ben, ezért nem rajzolható ki trend."}
            </p>
          </div>
        )}
      </div>

      {!loading && counts.undated > 0 && (
        <p className="text-[11px] text-slate-500 mt-4 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-600" />
          {counts.undated} olyan lead van, amelynél nincs rögzítve kapcsolatfelvételi dátum — ezek nem
          szerepelnek a grafikonon, de a statisztikai kártyákban igen.
        </p>
      )}
    </div>
  );
}
