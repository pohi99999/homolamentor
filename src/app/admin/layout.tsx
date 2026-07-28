import type { Metadata } from "next";
import "@/app/globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

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
              <AdminHeader />

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
