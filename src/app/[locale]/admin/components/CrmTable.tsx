"use client";

import React, { useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  FileText,
  Filter,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Tag,
  X,
} from "lucide-react";
import { CrmActivity, useAdminData } from "../AdminDataContext";
import { PartnerDrawer } from "./PartnerDrawer";
import { useGmailHistory } from "./useGmailHistory";

interface CrmTableProps {
  title: string;
  subtitle: string;
  /** Előre beállított státusz szűrő (pl. a Megkeresések nézet "kiküld" értékkel indul). */
  defaultStatusFilter?: string;
  emptyMessage?: string;
}

export function CrmTable({
  title,
  subtitle,
  defaultStatusFilter = "all",
  emptyMessage = "Nincs a megadott szűrőknek megfelelő partner a rendszerben.",
}: CrmTableProps) {
  const { activities, loading, error, syncing, sync } = useAdminData();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(defaultStatusFilter);
  const [topicFilter, setTopicFilter] = useState("all");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<CrmActivity | null>(null);

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

  const {
    messages: gmailMessages,
    loading: loadingGmail,
    error: gmailError,
  } = useGmailHistory(activeEmailForGmail);

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
        statusFilter === "all" || act.status.toLowerCase().includes(statusFilter.toLowerCase());

      const matchesTopic =
        topicFilter === "all" || act.topic.toLowerCase().includes(topicFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesTopic;
    });
  }, [activities, searchTerm, statusFilter, topicFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter(defaultStatusFilter);
    setTopicFilter("all");
  };

  const hasActiveFilters =
    searchTerm !== "" || statusFilter !== defaultStatusFilter || topicFilter !== "all";

  const toggleRowExpand = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  return (
    <>
      <div className="bg-[#0F1420]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-xl overflow-hidden">
        {/* Lista Fejléc & Kereső & Szűrők */}
        <div className="p-6 border-b border-slate-800/80 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                {title}
                {!loading && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {filteredActivities.length} / {activities.length}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
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
                  aria-label="Keresés törlése"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Szűrők sáv */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/60 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold mr-1">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>Szűrők:</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Státusz:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Szűrés státusz szerint"
                className="bg-slate-900 border border-slate-800 text-slate-200 py-1.5 px-3 rounded-lg text-xs focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">Összes Státusz</option>
                <option value="tárgyal">Aktív tárgyalás</option>
                <option value="kiküld">Kiajánló kiküldve / Outreach</option>
                <option value="elutasít">Visszadobva / Elutasítva</option>
                <option value="új">Új megkeresés</option>
                {availableStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Téma / Projekt:</span>
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                aria-label="Szűrés téma szerint"
                className="bg-slate-900 border border-slate-800 text-slate-200 py-1.5 px-3 rounded-lg text-xs focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">Összes Téma</option>
                <option value="Üllő">Üllő csarnok</option>
                <option value="Czimber">Czimber projekt</option>
                <option value="Szolár">Szolár park</option>
                <option value="Afrika">Afrikai projektek</option>
                <option value="Mentorálás">B2B Mentorálás</option>
                {availableTopics.map((top) => (
                  <option key={top} value={top}>
                    {top}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
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
                      <tr
                        onClick={() => toggleRowExpand(act.id)}
                        className={`cursor-pointer transition-colors duration-150 ${
                          isExpanded
                            ? "bg-slate-800/50 border-l-4 border-l-amber-400"
                            : "hover:bg-slate-800/30"
                        }`}
                      >
                        <td className="py-4 px-4 text-slate-500">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-amber-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
                            {act.name}
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            {act.company}
                          </div>
                        </td>

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

                        <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {act.date}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 text-amber-300 border border-slate-700">
                            <Tag className="w-3 h-3 text-amber-400" />
                            {act.topic}
                          </span>
                        </td>

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

                        <td className="py-4 px-4 max-w-xs">
                          <div className="text-slate-300 truncate text-[11px] flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{act.lastReaction}</span>
                          </div>
                        </td>

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
                                    Érték: <span className="text-slate-200 font-bold">{act.value}</span> • Bejegyzés dátuma:{" "}
                                    <span className="text-slate-300 font-mono">{act.date}</span>
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

                              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                                <div className="relative">
                                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900"></div>
                                  <div className="text-xs font-bold text-slate-200">1. Kapcsolatfelvétel Rögzítve</div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    Dátum: <span className="font-mono text-slate-300">{act.date}</span> • Téma:{" "}
                                    <span className="text-amber-300">{act.topic}</span>
                                  </div>
                                </div>

                                <div className="relative">
                                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-900"></div>
                                  <div className="text-xs font-bold text-slate-200">2. Jelenlegi Tárgyalási Státusz</div>
                                  <div className="text-[11px] text-slate-300 mt-0.5">
                                    <span className="font-semibold">{act.status}</span> (Projekt érték: {act.value})
                                  </div>
                                </div>

                                <div className="relative">
                                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></div>
                                  <div className="text-xs font-bold text-slate-200">3. Utolsó Reakció & Jegyzet</div>
                                  <div className="mt-1 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
                                    {act.lastReaction}
                                  </div>
                                </div>
                              </div>

                              {gmailMessages.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-slate-800">
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-2 flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                                    Legutóbbi Gmail Üzenetek ({act.email}):
                                  </div>
                                  <div className="space-y-2">
                                    {gmailMessages.slice(0, 3).map((m) => (
                                      <div
                                        key={m.id}
                                        className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-1"
                                      >
                                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                          <span
                                            className={`font-bold ${
                                              m.direction === "Bejövő" ? "text-emerald-400" : "text-blue-400"
                                            }`}
                                          >
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
                  <td colSpan={8} className="py-12 text-center">
                    <p className="text-slate-500 text-xs">
                      {error ? "Nem sikerült betölteni az adatsorokat." : emptyMessage}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 inline-flex items-center gap-1.5"
                        >
                          <X className="w-3 h-3" />
                          Szűrők Törlése
                        </button>
                      )}
                      <button
                        onClick={() => sync(true)}
                        disabled={syncing}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-semibold border border-amber-500/30 inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
                        Szinkronizálás Újra
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPartner && (
        <PartnerDrawer
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
          gmailMessages={gmailMessages}
          loadingGmail={loadingGmail}
          gmailError={gmailError}
        />
      )}
    </>
  );
}
