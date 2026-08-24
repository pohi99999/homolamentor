"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, MapPin, RefreshCw, Search, Tag, User } from "lucide-react";
import { DEMAND_STATUSES, type DemandRow, type DemandStatus } from "@/app/api/demand-sync/route";

const STATUS_STYLES: Record<string, string> = {
  Új: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Kapcsolatba lépve": "bg-amber-500/10 text-amber-300 border-amber-500/20",
  Lezárva: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};
const FALLBACK_STATUS_STYLE = "bg-slate-800 text-slate-300 border-slate-700";

export function DemandTable() {
  const [entries, setEntries] = useState<DemandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demand-sync");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ismeretlen hiba");
      setEntries(data.entries || []);
      setNotice(data.notice || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updateStatus = async (row: DemandRow, nextStatus: DemandStatus) => {
    if (nextStatus === row.status) return;
    const previousStatus = row.status;
    setStatusError(null);
    setUpdatingId(row.id);
    setEntries((prev) => prev.map((e) => (e.id === row.id ? { ...e, status: nextStatus } : e)));

    try {
      const res = await fetch("/api/demand-sync", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ismeretlen hiba");
    } catch (err) {
      // Roll back the optimistic update — the sheet write failed, so the UI
      // must not keep showing a status that was never actually saved.
      setEntries((prev) => prev.map((e) => (e.id === row.id ? { ...e, status: previousStatus } : e)));
      setStatusError(err instanceof Error ? err.message : "Nem sikerült frissíteni az állapotot.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = entries.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      term === "" ||
      e.query.toLowerCase().includes(term) ||
      e.interestedName.toLowerCase().includes(term) ||
      e.interestedEmail.toLowerCase().includes(term) ||
      e.category.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-[#0F1420]/80 border border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100">
            Kereslet-találatok
            {!loading && (
              <span className="ml-2 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {filtered.length} / {entries.length}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Az ingatlan-kereső AI-találataira jelzett érdeklődések
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Keresés kifejezés, név, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <button
            onClick={() => void load()}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 transition-colors disabled:opacity-50"
            title="Frissítés"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {notice && (
        <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs">
          {notice}
        </div>
      )}
      {statusError && (
        <div className="px-6 py-3 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs">
          {statusError}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/60 border-b border-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">Dátum</th>
              <th className="py-3.5 px-4">Keresési kifejezés</th>
              <th className="py-3.5 px-4">Találat</th>
              <th className="py-3.5 px-4">Érdeklődő</th>
              <th className="py-3.5 px-4">Nyelv</th>
              <th className="py-3.5 px-4">Állapot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-400 mx-auto" />
                </td>
              </tr>
            ) : filtered.length > 0 ? (
              filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-800/30">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{e.date}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-100">{e.query}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-300 mb-1">
                      <Tag className="w-3 h-3" />
                      {e.category}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3" />
                      {e.locationHint} {e.priceRange && `• ${e.priceRange}`}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <User className="w-3 h-3 text-slate-500" />
                      {e.interestedName}
                    </div>
                    <a
                      href={`mailto:${e.interestedEmail}`}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-white text-[11px] font-mono"
                    >
                      <Mail className="w-3 h-3" />
                      {e.interestedEmail}
                    </a>
                  </td>
                  <td className="py-3.5 px-4 uppercase text-[11px] text-slate-400">{e.locale}</td>
                  <td className="py-3.5 px-4">
                    <div className="relative inline-block">
                      <select
                        value={e.status}
                        disabled={updatingId === e.id}
                        onChange={(ev) => void updateStatus(e, ev.target.value as DemandStatus)}
                        className={`appearance-none pl-2.5 pr-6 py-1 rounded-full text-[11px] font-semibold border cursor-pointer disabled:opacity-50 disabled:cursor-wait focus:outline-none ${
                          STATUS_STYLES[e.status] || FALLBACK_STATUS_STYLE
                        }`}
                      >
                        {!DEMAND_STATUSES.includes(e.status as DemandStatus) && (
                          <option value={e.status}>{e.status}</option>
                        )}
                        {DEMAND_STATUSES.map((s) => (
                          <option key={s} value={s} className="bg-slate-900 text-slate-200">
                            {s}
                          </option>
                        ))}
                      </select>
                      {updatingId === e.id && (
                        <Loader2 className="w-3 h-3 animate-spin absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                  {error ? "Nem sikerült betölteni az adatsorokat." : "Még nincs rögzített kereslet-találat."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
