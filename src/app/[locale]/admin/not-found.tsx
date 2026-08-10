import { Link } from "@/i18n/routing";
import { Compass, LayoutDashboard, Users } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div className="max-w-2xl mx-auto py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="mt-6 text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-amber-200 to-amber-400 bg-clip-text text-transparent">
        Ez az admin nézet nem létezik
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        A megnyitott hivatkozás nem tartozik egyetlen admin modulhoz sem. Válassz az alábbi nézetek közül.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/admin"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
        >
          <LayoutDashboard className="w-4 h-4" />
          Vissza a Műszerfalra
        </Link>
        <Link
          href="/admin/leads"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all"
        >
          <Users className="w-4 h-4 text-amber-400" />
          CRM Leadek
        </Link>
      </div>
    </div>
  );
}
