"use client";

import React from "react";
import { ArrowUpRight, Send, TrendingUp, Users, XCircle } from "lucide-react";
import { useAdminData } from "../AdminDataContext";
import { Link } from "@/i18n/routing";

interface StatCardProps {
  label: string;
  value: number;
  hint: string;
  badge: string;
  badgeClass: string;
  iconClass: string;
  icon: React.ElementType;
  href: string;
  loading: boolean;
  showArrow?: boolean;
}

function StatCard({
  label,
  value,
  hint,
  badge,
  badgeClass,
  iconClass,
  icon: Icon,
  href,
  loading,
  showArrow,
}: StatCardProps) {
  return (
    <Link
      href={href}
      className="bg-[#0F1420]/80 border border-slate-800/80 hover:border-amber-500/30 p-5 rounded-2xl backdrop-blur-xl shadow-xl transition-all duration-300 group block focus:outline-none focus:border-amber-500/50"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${iconClass}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        {loading ? (
          <div className="h-9 w-20 bg-slate-800/80 animate-pulse rounded-lg"></div>
        ) : (
          <span className="text-3xl font-black text-slate-100">{value}</span>
        )}
        <span
          className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md border ${badgeClass}`}
        >
          {showArrow && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
          {badge}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 mt-2 group-hover:text-slate-400 transition-colors">{hint}</p>
    </Link>
  );
}

export function StatCards() {
  const { stats, loading, counts } = useAdminData();

  // A táblázat csak a Master munkalap sorait listázza, ezért ha a Contacts
  // munkalapról is számolunk leadeket, azt tételesen kiírjuk — különben a
  // kártya száma és a listázott sorok száma indokolatlanul eltérne.
  const sourceHint =
    counts.contacts > 0
      ? `${counts.master} sor a Master CRM Vevőlistából + ${counts.contacts} a Contacts munkalapról`
      : "Master CRM Vevőlista adatsorok";

  // A négy kategória összege kevesebb, mint az összes lead: a maradék még
  // egyáltalán nem lett megkeresve. Ez nyitott teendő, ezért kiírjuk.
  const leadHint =
    stats.pending > 0
      ? `${sourceHint} • ebből ${stats.pending} még nincs megkeresve`
      : `${sourceHint} — kattints a teljes listához`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard
        label="Összes Lead"
        value={stats.totalLeads}
        hint={leadHint}
        badge="Élő bejegyzések"
        showArrow
        badgeClass="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        iconClass="bg-amber-500/10 border border-amber-500/20 text-amber-400"
        icon={Users}
        href="/admin/leads"
        loading={loading}
      />
      <StatCard
        label="Kiküldött Megkeresések"
        value={stats.sentOutreach}
        hint="Kiküldött e-mail & piszkozat kampányok — kattints a megkeresésekhez"
        badge="Outreach státusz"
        badgeClass="text-blue-400 bg-blue-500/10 border-blue-500/20"
        iconClass="bg-blue-500/10 border border-blue-500/20 text-blue-400"
        icon={Send}
        href="/admin/outreach"
        loading={loading}
      />
      <StatCard
        label="Aktív Tárgyalások"
        value={stats.activeNegotiations}
        hint="Tárgyalás alatt álló partnerségek — kattints a szűrt listához"
        badge="Folyamatban"
        badgeClass="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        iconClass="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
        icon={TrendingUp}
        href="/admin/leads"
        loading={loading}
      />
      <StatCard
        label="Elutasítva / Archiválva"
        value={stats.rejected}
        hint="Elutasított vagy hibás e-mail leadek — kattints az archívumhoz"
        badge="Archív"
        badgeClass="text-slate-400 bg-slate-800 border-slate-700"
        iconClass="bg-rose-500/10 border border-rose-500/20 text-rose-400"
        icon={XCircle}
        href="/admin/leads"
        loading={loading}
      />
    </div>
  );
}
