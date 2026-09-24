"use client";

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "@/i18n/routing";

/**
 * A mobil oldalmenü (off-canvas fiók) állapota. A fejléc hamburger gombja nyitja,
 * az oldalmenü zárja (link, X, háttér, Escape). lg (1024 px) felett a menü mindig
 * látszik, ott ez az állapot nem számít -- az asztali nézet változatlan.
 */
interface AdminNavValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** lg felett igaz: ott nincs fiók, a menü statikusan áll. */
  isDesktop: boolean;
}

const AdminNavContext = createContext<AdminNavValue | null>(null);

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeDesktop(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function AdminNavProvider({ children }: { children: React.ReactNode }) {
  // Szerveroldalon asztalinak vesszük: így az asztali HTML pontosan olyan, mint eddig.
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true,
  );
  const pathname = usePathname();
  // A fiók ahhoz az útvonalhoz kötve nyitott, ahol megnyitották: oldalváltáskor
  // (link, vissza gomb) magától zárt, effektus nélkül.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = !isDesktop && openAt === pathname;

  const setOpen = useCallback((next: boolean) => setOpenAt(next ? pathname : null), [pathname]);

  // Nyitott fióknál a háttér nem görget, és Escape zár.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenAt(null);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return <AdminNavContext.Provider value={{ open, setOpen, isDesktop }}>{children}</AdminNavContext.Provider>;
}

export function useAdminNav(): AdminNavValue {
  const ctx = useContext(AdminNavContext);
  if (!ctx) throw new Error("useAdminNav csak az AdminNavProvider alatt használható");
  return ctx;
}
