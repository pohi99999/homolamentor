"use client";

import { CrmTable } from "../components/CrmTable";
import { ErrorBanner, PageHeader } from "../components/PageHeader";
import { StatCards } from "../components/StatCards";

export default function AdminLeadsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="CRM Leadek"
        subtitle="Teljes partner adattár a Master CRM Vevőlistából és a Contacts munkalapból"
      />

      <ErrorBanner />

      <StatCards />

      <CrmTable
        title="Összes Rögzített Lead"
        subtitle="Szűrj státusz, téma vagy szabad szöveg alapján; a sorra kattintva kinyílik a tárgyalási idővonal"
        emptyMessage="Nincs a megadott szűrőknek megfelelő lead a rendszerben."
      />
    </div>
  );
}
