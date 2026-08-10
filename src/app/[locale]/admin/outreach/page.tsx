"use client";

import { Mail, Send, TrendingUp, XCircle } from "lucide-react";
import { CrmTable } from "../components/CrmTable";
import { ErrorBanner, PageHeader } from "../components/PageHeader";
import { useAdminData } from "../AdminDataContext";

export default function AdminOutreachPage() {
  const { stats, loading } = useAdminData();

  const tiles = [
    {
      label: "Kiküldött Megkeresések",
      value: stats.sentOutreach,
      icon: Send,
      tone: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Aktív Tárgyalás Lett Belőle",
      value: stats.activeNegotiations,
      icon: TrendingUp,
      tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Visszapattant / Elutasítva",
      value: stats.rejected,
      icon: XCircle,
      tone: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Megkeresések"
        subtitle="Kiküldött kiajánlók, outreach kampányok és a rájuk érkezett reakciók"
      />

      <ErrorBanner />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div
              key={tile.label}
              className="bg-[#0F1420]/80 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-xl shadow-xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {tile.label}
                </span>
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${tile.tone}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              {loading ? (
                <div className="h-9 w-20 bg-slate-800/80 animate-pulse rounded-lg mt-4"></div>
              ) : (
                <span className="text-3xl font-black text-slate-100 block mt-4">{tile.value}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-[#0F1420]/80 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-xl shadow-xl flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
          <Mail className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-400 leading-relaxed">
          A lenti lista alapból a <span className="text-amber-300 font-semibold">kiküldött / outreach</span>{" "}
          státuszú sorokra szűr. A státusz szűrőt <span className="text-slate-200">„Összes Státusz”</span>-ra
          állítva a teljes adattár is megtekinthető. Egy partner sorát kinyitva megjelennek a hozzá tartozó
          élő Gmail előzmények is.
        </div>
      </div>

      <CrmTable
        title="Kiküldött Megkeresések Követése"
        subtitle="Outreach státuszú partnerek és a rájuk érkezett utolsó reakciók"
        defaultStatusFilter="kiküld"
        emptyMessage="Jelenleg nincs kiküldött státuszú megkeresés. Állítsd a státusz szűrőt „Összes Státusz”-ra a teljes listához."
      />
    </div>
  );
}
