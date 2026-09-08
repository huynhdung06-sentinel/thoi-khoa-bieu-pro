// Version & Auto-Refresh Cache Manager
// Helps automatically purge browser cache & service workers when code changes are pushed

// Unique build timestamp generated at runtime/module load
export const APP_BUILD_TIMESTAMP = '2026-09-07T20:30:00';
const STORAGE_BUILD_KEY = 'vulang_app_build_version';

/**
 * Clears old browser service workers & Caches API
 */
export async function purgeStaleBrowserCaches(): Promise<void> {
  try {
    // 1. Unregister any existing service workers that might cache old JS bundles
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    // 2. Clear Caches API
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
  } catch (err) {
    console.warn('[CacheManager] Error purging stale caches:', err);
  }
}

/**
 * Checks if the current running version matches the stored version.
 * If a new build is detected, purges cache and optionally reloads.
 */
export function checkAndUpdateAppVersion(): boolean {
  try {
    const lastVersion = localStorage.getItem(STORAGE_BUILD_KEY);
    
    if (!lastVersion || lastVersion !== APP_BUILD_TIMESTAMP) {
      console.log(`[VersionManager] New build detected: ${APP_BUILD_TIMESTAMP} (was ${lastVersion || 'none'}). Purging cache...`);
      localStorage.setItem(STORAGE_BUILD_KEY, APP_BUILD_TIMESTAMP);
      
      // Asynchronously purge stale caches
      purgeStaleBrowserCaches();
      
      return true; // Version changed
    }
  } catch (err) {
    console.warn('[VersionManager] Could not access localStorage:', err);
  }
  return false;
}

/**
 * Force reload current page bypassing browser cache
 */
export function forceReloadApp(): void {
  purgeStaleBrowserCaches().then(() => {
    window.location.reload();
  });
}
