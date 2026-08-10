"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Link } from "@/i18n/routing";
import { Bell, LogOut, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { useAdminData } from "./AdminDataContext";

export function AdminHeader() {
  const { data: session } = useSession();
  const { sync, syncing, loading, error, lastSynced, activities } = useAdminData();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Kattintás a panelen kívülre, illetve Escape bezárja az értesítéseket
  useEffect(() => {
    if (!notificationsOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotificationsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [notificationsOpen]);

  const isBusy = syncing || loading;
  const recent = activities.slice(0, 4);

  return (
    <header className="h-16 bg-[#0F1420]/90 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left side: Status indicators */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/sync"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
            error
              ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
              : isBusy
              ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              error ? "bg-rose-400" : isBusy ? "bg-amber-400 animate-ping" : "bg-emerald-400 animate-pulse"
            }`}
          ></span>
          Google Sheets CRM Sync:{" "}
          {error ? "Hiba" : isBusy ? "Szinkronizálás…" : "Aktív"}
        </Link>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          Zárt Google OAuth Rendszer
        </span>
      </div>

      {/* Right side: Actions, Notifications, User Profile & Logout */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => sync(true)}
          disabled={isBusy}
          title="CRM adatok frissítése a Google Sheets-ből"
          aria-label="CRM adatok frissítése"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isBusy ? "animate-spin text-amber-400" : ""}`} />
        </button>

        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen((prev) => !prev)}
            title="Értesítések"
            aria-label="Értesítések"
            aria-expanded={notificationsOpen}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all relative"
          >
            <Bell className="w-4 h-4" />
            <span
              className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                error ? "bg-rose-400" : "bg-amber-400"
              }`}
            ></span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#0F1420] border border-slate-800 shadow-2xl overflow-hidden z-40">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-100">Rendszerértesítések</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {lastSynced ? `Sync: ${lastSynced}` : "Nincs sync"}
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {error ? (
                  <div className="px-4 py-3 flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-rose-300">Google Sheets kapcsolati hiba</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 break-words">{error}</p>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-3 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-300">Élő adatkapcsolat rendben</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {activities.length} partner adatsor betöltve a CRM táblákból.
                      </p>
                    </div>
                  </div>
                )}

                {recent.map((act) => (
                  <div key={act.id} className="px-4 py-3">
                    <p className="text-xs font-semibold text-slate-200 truncate">{act.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {act.status} • {act.topic}
                    </p>
                  </div>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
                <Link
                  href="/admin/leads"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-[11px] font-semibold text-amber-300 hover:text-amber-200"
                >
                  Összes lead megtekintése
                </Link>
                <button
                  onClick={() => {
                    setNotificationsOpen(false);
                    void sync(true);
                  }}
                  disabled={isBusy}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isBusy ? "animate-spin" : ""}`} />
                  Frissítés
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-800 mx-1"></div>

        {/* User Session Info Badge */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800/90 py-1.5 px-3 rounded-xl">
          <Link href="/admin/settings" className="flex items-center gap-3 group" title="Beállítások">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- külső Google avatar URL, nem statikus asset
              <img
                src={session.user.image}
                alt={session.user.name || "User Avatar"}
                className="w-7 h-7 rounded-full border border-amber-500/40"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400 text-xs">
                {session?.user?.name ? session.user.name.charAt(0) : "A"}
              </div>
            )}

            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-200 leading-tight group-hover:text-white transition-colors">
                {session?.user?.name || "Adminisztrátor"}
              </p>
              <p className="text-[10px] text-amber-400/90 leading-tight">
                {session?.user?.email || "Zárt Hozzáférés"}
              </p>
            </div>
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: "/api/auth/signin" })}
            title="Kijelentkezés"
            aria-label="Kijelentkezés"
            className="ml-1 p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
