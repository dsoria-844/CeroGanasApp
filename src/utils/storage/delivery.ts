import { safeGet, safeSet, STORAGE_KEYS } from './persistence';

export type DeliveryApp = 'pedidosya' | 'rappi' | 'google';

export function loadDefaultDeliveryApp(): DeliveryApp {
  const saved = safeGet<string>(STORAGE_KEYS.DEFAULT_DELIVERY_APP, 'pedidosya');
  if (saved === 'pedidosya' || saved === 'rappi' || saved === 'google') {
    return saved as DeliveryApp;
  }
  return 'pedidosya';
}

export function saveDefaultDeliveryApp(app: DeliveryApp): void {
  safeSet(STORAGE_KEYS.DEFAULT_DELIVERY_APP, app);
}

export function getDeliverySearchUrl(dishName: string): string {
  const app = loadDefaultDeliveryApp();
  const query = encodeURIComponent(dishName);
  if (app === 'pedidosya') {
    return `https://www.pedidosya.com.ar/restaurantes?q=${query}`;
  }
  if (app === 'rappi') {
    return `https://www.rappi.com.ar/search?query=${query}`;
  }
  return `https://www.google.com/search?q=${query}+delivery+pedir`;
}
