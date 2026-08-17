import { NextResponse } from "next/server";
import { google } from "googleapis";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET(request: Request) {
  // Az office.homlamentor@gmail.com postafiók tartalmát olvassa,
  // ezért kizárólag bejelentkezett admin fiók kérheti le.
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const partnerEmail = searchParams.get("email");

  if (!partnerEmail || partnerEmail.trim() === "") {
    return NextResponse.json(
      { error: "Hiányzó 'email' query paraméter." },
      { status: 400 }
    );
  }

  const cleanEmail = partnerEmail.trim().toLowerCase();

  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  let authClient:
    | InstanceType<typeof google.auth.OAuth2>
    | InstanceType<typeof google.auth.JWT>
    | null = null;

  try {
    if (clientId && clientSecret && refreshToken) {
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        "https://developers.google.com/oauthplayground"
      );
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      authClient = oauth2Client;
    } else if (serviceAccountEmail && privateKey) {
      privateKey = privateKey.replace(/\\n/g, "\n");
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }

      // FIGYELEM: ez az ág service account impersonationt (domain-wide
      // delegation) végez, ami KIZÁRÓLAG Google Workspace fiókkal működik —
      // sima @gmail.com címmel soha nem fog. A működő út a fenti OAuth ág,
      // amihez GOOGLE_REFRESH_TOKEN kell. Lásd AGENTS.md 15. tanulság.
      //
      // Az impersonált postafiók env-ből felülírható, mert a kampány levelei
      // a peterpohankapersonal@gmail.com fiókban ülnek (az office cím ahhoz
      // "send mail as"-ként van kötve), nem az office fiókban.
      authClient = new google.auth.JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: [
          "https://www.googleapis.com/auth/gmail.readonly",
          "https://mail.google.com/",
        ],
        subject:
          process.env.GMAIL_IMPERSONATED_USER || "office.homlamentor@gmail.com",
      });
    }

    if (authClient) {
      const gmail = google.gmail({ version: "v1", auth: authClient });
      const queryStr = `to:${cleanEmail} OR from:${cleanEmail}`;

      const listRes = await gmail.users.messages.list({
        userId: "me",
        q: queryStr,
        maxResults: 15,
      });

      const messagesList = listRes.data.messages || [];

      if (messagesList.length > 0) {
        const detailedMessages = await Promise.all(
          messagesList.map(async (msg) => {
            try {
              const msgRes = await gmail.users.messages.get({
                userId: "me",
                id: msg.id!,
                format: "full",
              });

              const headers = msgRes.data.payload?.headers || [];
              const subject =
                headers.find((h) => h.name?.toLowerCase() === "subject")
                  ?.value || "(Nincs tárgy)";
              const rawDate =
                headers.find((h) => h.name?.toLowerCase() === "date")?.value ||
                "";
              const fromStr =
                headers.find((h) => h.name?.toLowerCase() === "from")?.value ||
                "";
              const toStr =
                headers.find((h) => h.name?.toLowerCase() === "to")?.value ||
                "";

              const snippet = msgRes.data.snippet || "";

              const isOutgoing =
                fromStr.toLowerCase().includes("office.homlamentor") ||
                fromStr.toLowerCase().includes("peterpohanka");

              const formattedDate = rawDate
                ? new Date(rawDate).toLocaleString("hu-HU", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Nincs dátum";

              return {
                id: msg.id,
                subject,
                date: formattedDate,
                snippet,
                direction: isOutgoing ? "Elküldött" : "Bejövő",
                from: fromStr,
                to: toStr,
              };
            } catch (itemErr) {
              console.warn(`Hiba a(z) ${msg.id} elérésénél:`, itemErr);
              return null;
            }
          })
        );

        const validMessages = detailedMessages.filter(Boolean);

        return NextResponse.json({
          success: true,
          email: cleanEmail,
          total: validMessages.length,
          messages: validMessages,
          source: "gmail_api_live",
        });
      }
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn("Gmail API élő lekérdezési hiba (fallback aktiválása):", errorMsg);
  }

  // Nincs találat, vagy a Gmail API nem érhető el.
  //
  // KRITIKUS: itt korábban egy fabrikált "fallback" levélpár állt (egy kitalált
  // BEJÖVŐ válasszal: "Érdekel minket a tárgyalási lehetőség..."), amit a UI
  // "Élő Levelezési Előzmények / Gmail API" jelvénnyel, valós adattól
  // megkülönböztethetetlenül jelenített meg. Mivel a dátumai relatívak voltak
  // (most-2 és most-5 nap), mindig frissnek látszott, és MINDEN olyan partnernél
  // megjelent, akinek még nincs valós levelezése — vagyis pont a legfrissebb
  // leadeknél. Ez hamis üzleti jelzés: nem létező partneri érdeklődést mutatott.
  // 2026-08-17-én éles eseten igazolva (Africa50: aznap ment ki az első levél,
  // a dashboard mégis 5 napos kiküldést és 2 napos "érdeklődő választ" mutatott).
  //
  // Üres listát adunk vissza — a PartnerDrawer erre már tartalmaz őszinte üres
  // állapotot ("Nincs közvetlen levelezési előzmény ehhez az e-mail címhez...").
  return NextResponse.json({
    success: true,
    email: cleanEmail,
    total: 0,
    messages: [],
    source: "gmail_api_no_results",
  });
}
