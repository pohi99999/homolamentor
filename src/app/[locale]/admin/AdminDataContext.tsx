"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface CrmStats {
  totalLeads: number;
  sentOutreach: number;
  activeNegotiations: number;
  rejected: number;
  /** Se nem megkeresett, se nem tárgyalás, se nem elutasított — nyitott teendő. */
  pending: number;
}

export interface CrmActivity {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  status: string;
  statusColor: string;
  value: string;
  date: string;
  topic: string;
  lastReaction: string;
  type: string;
  website: string;
}

export interface CrmChartPoint {
  month: string;
  leadek: number;
  megkeresesek: number;
  konverzio: number;
  ujLeadek: number;
}

export interface CrmCounts {
  master: number;
  contacts: number;
  undated: number;
}

export interface AdminToast {
  id: number;
  tone: "info" | "success" | "error";
  title: string;
  message?: string;
}

interface AdminDataContextValue {
  stats: CrmStats;
  activities: CrmActivity[];
  chartData: CrmChartPoint[];
  counts: CrmCounts;
  sheetNames: { master?: string; contacts?: string };
  lastSynced: string;
  lastSyncedAt: string | null;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  /** Elindítja a /api/crm-sync hívást és frissíti a teljes admin felületet. */
  sync: (manual?: boolean) => Promise<void>;
  toasts: AdminToast[];
  notify: (toast: Omit<AdminToast, "id">) => void;
  dismissToast: (id: number) => void;
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export const SPREADSHEET_URL =
  "https://docs.google.com/spreadsheets/d/1sUFyo5mjohe5kTs2bTNbVvKJLr3_tIF8MxsCETRp4uQ";

const emptyStats: CrmStats = {
  totalLeads: 0,
  sentOutreach: 0,
  activeNegotiations: 0,
  rejected: 0,
  pending: 0,
};

const emptyCounts: CrmCounts = { master: 0, contacts: 0, undated: 0 };

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<CrmStats>(emptyStats);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [chartData, setChartData] = useState<CrmChartPoint[]>([]);
  const [counts, setCounts] = useState<CrmCounts>(emptyCounts);
  const [sheetNames, setSheetNames] = useState<{ master?: string; contacts?: string }>({});
  const [lastSynced, setLastSynced] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<AdminToast[]>([]);

  const toastId = useRef(0);
  const inFlight = useRef(false);
  // Van-e már megjelenített adat: ha igen, a további frissítések nem dobják
  // vissza a felületet skeleton állapotba, csak a spinner jelzi a töltést.
  const hasDataRef = useRef(false);
  const lastSyncMsRef = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (toast: Omit<AdminToast, "id">) => {
      const id = ++toastId.current;
      setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
      window.setTimeout(() => dismissToast(id), toast.tone === "error" ? 8000 : 4500);
    },
    [dismissToast]
  );

  const sync = useCallback(
    async (manual = false) => {
      if (inFlight.current) return;
      inFlight.current = true;

      if (manual || hasDataRef.current) setSyncing(true);
      else setLoading(true);
      setError(null);

      if (manual) {
        notify({ tone: "info", title: "Szinkronizálás folyamatban…", message: "Élő Google Sheets adatok lekérése." });
      }

      try {
        const res = await fetch("/api/crm-sync", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok || data.error) {
          const message =
            res.status === 401 || res.status === 403
              ? "A munkameneted lejárt. Jelentkezz be újra az adatok eléréséhez."
              : data.details || data.error || "Ismeretlen Google API olvasási hiba történt.";
          setError(message);
          notify({ tone: "error", title: "Sikertelen szinkronizáció", message });
        } else {
          setStats(data.stats ?? emptyStats);
          setActivities(data.activities || []);
          setChartData(data.chartData || []);
          setCounts(data.counts ?? emptyCounts);
          hasDataRef.current = true;
          lastSyncMsRef.current = Date.now();
          if (data.sheetNames) setSheetNames(data.sheetNames);
          if (data.lastSyncedAt) {
            setLastSyncedAt(data.lastSyncedAt);
            setLastSynced(
              new Date(data.lastSyncedAt).toLocaleTimeString("hu-HU", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            );
          }
          if (manual) {
            notify({
              tone: "success",
              title: "Szinkronizáció kész",
              message: `${data.stats?.totalLeads ?? 0} partner adatsor frissítve a Google Sheets CRM-ből.`,
            });
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Hálózati hiba a szinkronizáció során: ${msg}`);
        notify({ tone: "error", title: "Hálózati hiba", message: msg });
      } finally {
        inFlight.current = false;
        setLoading(false);
        setSyncing(false);
      }
    },
    [notify]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kezdeti betöltés mountoláskor, nincs külső subscribe-olható forrás
    sync(false);
  }, [sync]);

  // Ha a fül visszakerül előtérbe és az adat már elavult, csendben frissítünk.
  // Így a vezetői műszerfal nem mutat órákkal korábbi állapotot anélkül, hogy
  // folyamatosan pollozná a Google API-t.
  useEffect(() => {
    const STALE_AFTER_MS = 3 * 60 * 1000;

    const refreshIfStale = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastSyncMsRef.current < STALE_AFTER_MS) return;
      void sync(false);
    };

    document.addEventListener("visibilitychange", refreshIfStale);
    window.addEventListener("focus", refreshIfStale);
    return () => {
      document.removeEventListener("visibilitychange", refreshIfStale);
      window.removeEventListener("focus", refreshIfStale);
    };
  }, [sync]);

  const value = useMemo<AdminDataContextValue>(
    () => ({
      stats,
      activities,
      chartData,
      counts,
      sheetNames,
      lastSynced,
      lastSyncedAt,
      loading,
      syncing,
      error,
      sync,
      toasts,
      notify,
      dismissToast,
    }),
    [
      stats,
      activities,
      chartData,
      counts,
      sheetNames,
      lastSynced,
      lastSyncedAt,
      loading,
      syncing,
      error,
      sync,
      toasts,
      notify,
      dismissToast,
    ]
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) {
    throw new Error("useAdminData csak az AdminDataProvider fán belül használható.");
  }
  return ctx;
}
