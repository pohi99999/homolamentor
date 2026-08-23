"use client";

import { PageHeader } from "../components/PageHeader";
import { DemandTable } from "../components/DemandTable";

export default function AdminDemandPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Kereslet"
        subtitle="Az ingatlan-kereső AI-találataira érkezett érdeklődések — innen indítható a kapcsolatfelvétel a hirdetővel/forrással"
      />
      <DemandTable />
    </div>
  );
}
