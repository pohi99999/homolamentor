import type { Metadata } from "next";
import "@/app/globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AdminSidebar } from "./AdminSidebar";
import { ShieldCheck, RefreshCw, Bell } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Dashboard | HOMOLA MENTOR KFT",
  description: "Zárt vezetői vezérlőpult és Google Sheets CRM szinkronizáció.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu" className="h-full bg-[#0B0F17] text-slate-100 antialiased dark">
      <body className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-row">
        <AuthProvider>
          <div className="flex w-full min-h-screen bg-[#0B0F17]">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content Container */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0B0F17]">
              {/* Top Header */}
              <header className="h-16 bg-[#0F1420]/80 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Google Sheets CRM Sync: Aktív
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Zárt Rendszer (NextAuth)
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <button className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all relative">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400"></span>
                  </button>
                </div>
              </header>

              {/* Viewport content */}
              <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
