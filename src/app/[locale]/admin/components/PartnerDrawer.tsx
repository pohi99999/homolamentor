"use client";

import { useEffect } from "react";
import {
  Clock,
  ExternalLink,
  Inbox,
  Loader2,
  Mail,
  Phone,
  Send,
  X,
} from "lucide-react";
import { CrmActivity, SPREADSHEET_URL } from "../AdminDataContext";
import { GmailMessage } from "./useGmailHistory";

interface PartnerDrawerProps {
  partner: CrmActivity;
  onClose: () => void;
  gmailMessages: GmailMessage[];
  loadingGmail: boolean;
  gmailError: string | null;
}

export function PartnerDrawer({
  partner,
  onClose,
  gmailMessages,
  loadingGmail,
  gmailError,
}: PartnerDrawerProps) {
  // Escape billentyűvel is zárható legyen a panel (billentyűzetes UX)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${partner.name} részletes tárgyaláskövetés`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#0B0F17] border-l border-slate-800 h-full overflow-y-auto shadow-2xl p-6 space-y-6 flex flex-col justify-between"
      >
        <div>
          {/* Modal Fejléc */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Partner Részletes Tárgyaláskövetés
              </span>
              <h2 className="text-xl font-extrabold text-slate-100 mt-0.5">{partner.name}</h2>
              <p className="text-xs text-slate-400">{partner.company}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Panel bezárása"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Elérhetőségek Kártya */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Telefon</span>
              {partner.phone && partner.phone !== "Nincs megadva" ? (
                <a
                  href={`tel:${partner.phone}`}
                  className="text-xs font-mono font-bold text-amber-300 hover:underline flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  {partner.phone}
                </a>
              ) : (
                <span className="text-xs font-mono text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-600" />
                  Nincs megadva
                </span>
              )}
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">E-mail</span>
              {partner.email && partner.email !== "Nincs email" ? (
                <a
                  href={`mailto:${partner.email}`}
                  className="text-xs font-mono font-bold text-slate-200 hover:underline flex items-center gap-1.5 truncate"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{partner.email}</span>
                </a>
              ) : (
                <span className="text-xs font-mono text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-600" />
                  Nincs email
                </span>
              )}
            </div>
            {partner.website && (
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 col-span-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Weboldal</span>
                <a
                  href={partner.website.startsWith("http") ? partner.website : `https://${partner.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono font-bold text-slate-200 hover:underline flex items-center gap-1.5 truncate"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{partner.website}</span>
                </a>
              </div>
            )}
          </div>

          {/* Tárgyalás Áttekintés Kártya */}
          <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">Tárgyalás Témája:</span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {partner.topic}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">Tárgyalási Státusz:</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {partner.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">Becsült Projekt Érték:</span>
              <span className="text-xs font-bold text-slate-100">{partner.value}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">Kapcsolatfelvétel Dátuma:</span>
              <span className="text-xs font-mono text-slate-300">{partner.date}</span>
            </div>
          </div>

          {/* Idővonal Szekció */}
          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Esemény- és Reakció Idővonal
            </h4>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              <div className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900"></div>
                <div className="text-xs font-bold text-slate-200">Első Kapcsolatfelvétel Megtörtént</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Rögzítve: <span className="font-mono text-slate-300">{partner.date}</span>
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Kiküldött megkeresés a(z) <span className="text-amber-300">{partner.topic}</span> témában.
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-900"></div>
                <div className="text-xs font-bold text-slate-200">Tárgyalási Státusz Frissítés</div>
                <div className="text-xs text-emerald-400 font-semibold mt-0.5">
                  Jelenlegi állapot: {partner.status}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></div>
                <div className="text-xs font-bold text-slate-200">Utolsó Reakció & Visszajelzés</div>
                <div className="mt-2 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
                  {partner.lastReaction}
                </div>
              </div>
            </div>
          </div>

          {/* Élő Levelezési Előzmények (Gmail API) */}
          <div className="mt-8 border-t border-slate-800/80 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                Élő Levelezési Előzmények
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
                {gmailError ||
                  "Nincs közvetlen levelezési előzmény ehhez az e-mail címhez az office.homlamentor@gmail.com fiókban."}
              </div>
            )}
          </div>
        </div>

        {/* Modal Lábléc Gombok */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between gap-3">
          <a
            href={SPREADSHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-800"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            Google Sheet Szerkesztése
          </a>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
}
