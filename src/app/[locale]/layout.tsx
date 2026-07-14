import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import AIChatAssistant from '@/components/AIChatAssistant';


const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "700", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HOMLAMENTOR KFT",
  description: "Prémium szolgáltatások, Zárt Ingatlan Portál és Afrika Inkubátor program.",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  // Megvárjuk a params Promise feloldását Next.js 15+ szabvány szerint
  const { locale } = await params;

  // Ellenőrizzük, hogy a kapott locale támogatott-e
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }


  // Fordítások lekérése szerver oldalon
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${montserrat.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <NextIntlClientProvider messages={messages}>
          {children}
          <AIChatAssistant />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
