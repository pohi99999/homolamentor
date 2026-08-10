"use client";

import { Loader2, TrendingUp } from "lucide-react";
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

export function LeadChart() {
  const { loading } = useAdminData();

  return (
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
  );
}
