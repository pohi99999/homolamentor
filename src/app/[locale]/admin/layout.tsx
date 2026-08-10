import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AdminDataProvider } from "./AdminDataContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminToaster } from "./components/AdminToaster";

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
    <AuthProvider>
      {/*
        Az AdminDataProvider a layoutban él, így az aloldalak közti navigáció
        nem mountolja újra: a CRM adatok és a szinkron állapot megmaradnak,
        és a sidebar Sync gombja minden nézetet egyszerre frissít.
      */}
      <AdminDataProvider>
        <div className="flex w-full min-h-screen bg-[#0B0F17] text-slate-100 font-sans antialiased">
          {/* Sidebar */}
          <AdminSidebar />

          {/* Main Content Container */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0B0F17]">
            {/* Top Header */}
            <AdminHeader />

            {/* Viewport content */}
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
          </div>
        </div>

        {/* Globális toast értesítések (szinkronizáció visszajelzés) */}
        <AdminToaster />
      </AdminDataProvider>
    </AuthProvider>
  );
}
