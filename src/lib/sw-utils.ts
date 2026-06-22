export const CACHE_NAME = 'friction-journal-v1';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export async function registerSW(base: string): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register(`${base}sw.js`, { scope: base });
    watchForUpdates(registration);
    return registration;
  } catch (err) {
    console.error('[SW] Registration failed:', err);
    return null;
  }
}

function watchForUpdates(registration: ServiceWorkerRegistration): void {
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  const checkForUpdate = () => registration.update().catch(() => {});
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate();
  });
  setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
}
