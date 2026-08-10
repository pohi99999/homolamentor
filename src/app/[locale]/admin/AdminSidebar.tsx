"use client";

import { Link, usePathname } from "@/i18n/routing";
import { signOut, useSession } from "next-auth/react";
import {
  Building2,
  Database,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Settings,
  Users,
} from "lucide-react";
import { useAdminData } from "./AdminDataContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  /** Ha igaz, a menüpontra kattintva azonnal el is indul a CRM szinkronizáció. */
  triggersSync?: boolean;
}

const navItems: NavItem[] = [
  { name: "Műszerfal", href: "/admin", icon: LayoutDashboard },
  { name: "CRM Leadek", href: "/admin/leads", icon: Users },
  { name: "Google Sheets Sync", href: "/admin/sync", icon: Database, triggersSync: true },
  { name: "Megkeresések", href: "/admin/outreach", icon: Mail },
  { name: "Beállítások", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sync, syncing, loading, activities } = useAdminData();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside className="w-64 bg-[#0F1420]/95 border-r border-slate-800/80 flex flex-col justify-between p-4 min-h-screen text-slate-200 backdrop-blur-xl">
      <div>
        {/* Brand Logo */}
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800/60 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-0.5 shadow-lg shadow-amber-500/10">
            <div className="w-full h-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wide bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
              HOMOLA MENTOR
            </h1>
            <p className="text-[10px] tracking-widest text-slate-400 uppercase font-semibold">
              Executive CRM
            </p>
          </div>
        </Link>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const showSpinner = item.triggersSync && syncing;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  // A Sync menüpont nem csak navigál: azonnal élő adatlekérést is indít.
                  if (item.triggersSync) void sync(true);
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/5"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                }`}
              >
                {showSpinner ? (
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                ) : (
                  <Icon className={`w-4 h-4 ${active ? "text-amber-400" : "text-slate-400"}`} />
                )}
                <span className="flex-1">{item.name}</span>
                {item.href === "/admin/leads" && !loading && activities.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    {activities.length}
                  </span>
                )}
                {item.triggersSync && syncing && (
                  <span className="text-[10px] font-semibold text-amber-400/90">fut…</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Külső link a publikus weboldalra */}
        <div className="mt-6 pt-4 border-t border-slate-800/60">
          <Link
            href="/"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-all duration-200"
          >
            <ExternalLink className="w-4 h-4 text-slate-500" />
            Publikus weboldal
          </Link>
        </div>
      </div>

      {/* Footer / User Session Info */}
      <div className="pt-4 border-t border-slate-800/60">
        <Link
          href="/admin/settings"
          className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/30 p-3 rounded-xl mb-3 flex items-center gap-3 transition-colors"
        >
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- külső Google avatar URL, nem statikus asset
            <img
              src={session.user.image}
              alt={session.user.name || "Avatar"}
              className="w-9 h-9 rounded-full border border-amber-500/40"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400 text-sm">
              {session?.user?.name ? session.user.name.charAt(0) : "A"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">
              {session?.user?.name || "Adminisztrátor"}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {session?.user?.email || "Zárt hozzáférés"}
            </p>
          </div>
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: "/api/auth/signin" })}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Kijelentkezés
        </button>
      </div>
    </aside>
  );
}
