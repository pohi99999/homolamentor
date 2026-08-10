import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { isAllowedAdminEmail } from "./adminAccess";

/**
 * Jogosultság-ellenőrzés az admin adat-végpontokhoz (CRM, Gmail előzmények).
 *
 * A `proxy.ts` szándékosan átengedi az összes `/api/*` kérést (az űrlap-
 * végpontoknak nyilvánosnak kell lenniük), ezért az érzékeny végpontok
 * védelméről magának a route handlernek kell gondoskodnia.
 *
 * @returns `null`, ha a kérés engedélyezett; egyébként a kész 401/403 válasz.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Hitelesítés szükséges. Jelentkezz be az admin felületen." },
      { status: 401 }
    );
  }

  if (!isAllowedAdminEmail(session.user.email)) {
    return NextResponse.json(
      { error: "Ehhez az erőforráshoz nincs jogosultságod." },
      { status: 403 }
    );
  }

  return null;
}
