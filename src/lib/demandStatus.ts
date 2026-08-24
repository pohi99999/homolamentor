// Shared between the demand-sync API route (server, imports `googleapis`)
// and DemandTable.tsx (client component) — kept in its own file so the
// client bundle never has to pull in the route's Node-only dependencies.
export const DEMAND_STATUSES = ["Új", "Kapcsolatba lépve", "Lezárva"] as const;
export type DemandStatus = (typeof DEMAND_STATUSES)[number];
