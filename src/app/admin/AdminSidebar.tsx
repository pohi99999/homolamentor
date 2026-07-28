"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Database,
  Mail,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { name: "Műszerfal", href: "/admin", icon: LayoutDashboard },
    { name: "CRM Leadek", href: "/admin/leads", icon: Users },
    { name: "Google Sheets Sync", href: "/admin/sync", icon: Database },
    { name: "Megkeresések", href: "/admin/outreach", icon: Mail },
    { name: "Beállítások", href: "/admin/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0F1420]/95 border-r border-slate-800/80 flex flex-col justify-between p-4 min-h-screen text-slate-200 backdrop-blur-xl">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800/60">
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
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/5"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Session Info */}
      <div className="pt-4 border-t border-slate-800/60">
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl mb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400 text-sm">
            {session?.user?.name ? session.user.name.charAt(0) : "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">
              {session?.user?.name || "Adminisztrátor"}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {session?.user?.email || "Zárt hozzáférés"}
            </p>
          </div>
        </div>

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
