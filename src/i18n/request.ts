import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // Megvárjuk a locale értéket, mivel ez egy Promise lehet
  let locale = await requestLocale;

  // Ha nincs megadva locale, vagy nem támogatott, akkor az alapértelmezettet használjuk
  if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
    locale = routing.defaultLocale;
  }


  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
