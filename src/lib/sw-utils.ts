export const CACHE_NAME = 'friction-journal-v1';

export async function registerSW(base: string): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(`${base}sw.js`, { scope: base });
  } catch (err) {
    console.error('[SW] Registration failed:', err);
    return null;
  }
}
