"use client";

import { useSession, signOut } from "next-auth/react";
import { ShieldCheck, RefreshCw, Bell, LogOut } from "lucide-react";

export function AdminHeader() {
  const { data: session } = useSession();

  return (
    <header className="h-16 bg-[#0F1420]/90 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left side: Status indicators */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Google Sheets CRM Sync: Aktív
        </span>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          Zárt Google OAuth Rendszer
        </span>
      </div>

      {/* Right side: Notifications, User Profile & Logout */}
      <div className="flex items-center gap-4">
        <button
          title="Frissítés"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          title="Értesítések"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400"></span>
        </button>

        <div className="h-6 w-px bg-slate-800 mx-1"></div>

        {/* User Session Info Badge */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800/90 py-1.5 px-3 rounded-xl">
          {session?.user?.image ? (
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
            <p className="text-xs font-semibold text-slate-200 leading-tight">
              {session?.user?.name || "Adminisztrátor"}
            </p>
            <p className="text-[10px] text-amber-400/90 leading-tight">
              {session?.user?.email || "Zárt Hozzáférés"}
            </p>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/api/auth/signin" })}
            title="Kijelentkezés"
            className="ml-1 p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
