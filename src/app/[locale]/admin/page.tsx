"use client";

import { CrmTable } from "./components/CrmTable";
import { ErrorBanner, PageHeader } from "./components/PageHeader";
import { LeadChart } from "./components/LeadChart";
import { StatCards } from "./components/StatCards";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Vezetői Műszerfal & CRM Szinkron"
        subtitle="Szigorú Google Sheets API élő adatkapcsolat • Homola Mentor KFT"
      />

      <ErrorBanner />

      <StatCards />

      <LeadChart />

      <CrmTable
        title="Részletes Tárgyaláskövető & Partner Adattár"
        subtitle="Kattints egy partner sorára az eddigi reakciók és a tárgyalási idővonal kibontásához"
      />
    </div>
  );
}
