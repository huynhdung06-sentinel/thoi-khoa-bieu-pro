/**
 * Quota-Safe Dual-Engine Storage Manager (IndexedDB + LocalStorage)
 * Prevents DOMException: QuotaExceededError on localStorage.setItem
 * when storing large payloads (e.g. mindmap_school_v2_lessons_bank).
 */

const DB_NAME = 'vulang_app_data_store';
const DB_VERSION = 1;
const STORE_NAME = 'kv_data';

let dbPromise: Promise<IDBDatabase> | null = null;

function initDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

/**
 * Save value to IndexedDB (virtually unlimited capacity)
 */
export async function setIndexedDBItem(key: string, value: any): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`[SafeStorage] IndexedDB setItem failed for key ${key}:`, err);
  }
}

/**
 * Get value from IndexedDB
 */
export async function getIndexedDBItem<T>(key: string): Promise<T | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result !== undefined ? request.result : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`[SafeStorage] IndexedDB getItem failed for key ${key}:`, err);
    return null;
  }
}

/**
 * Strips or truncates heavy base64 URLs or code for LocalStorage fallback
 */
function createLightweightFallback(data: any): any {
  if (!data) return data;
  if (typeof data === 'string') {
    if (data.startsWith('data:') && data.length > 30000) {
      return ''; // Strip huge base64 string for LocalStorage
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => createLightweightFallback(item));
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const k of Object.keys(data)) {
      if ((k === 'embeddedHtmlCode' || k === 'htmlBody') && typeof data[k] === 'string' && data[k].length > 50000) {
        cleaned[k] = '';
      } else {
        cleaned[k] = createLightweightFallback(data[k]);
      }
    }
    return cleaned;
  }
  return data;
}

/**
 * Safe LocalStorage setItem that absorbs QuotaExceededError and falls back gracefully
 */
export function setLocalStorageItemSafe(key: string, value: any): boolean {
  try {
    const jsonString = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, jsonString);
    return true;
  } catch {
    // Catch QuotaExceededError safely
    console.warn(`[SafeStorage] LocalStorage quota exceeded for key "${key}". Saving lightweight fallback.`);
    try {
      if (typeof value !== 'string') {
        const lightweight = createLightweightFallback(value);
        localStorage.setItem(key, JSON.stringify(lightweight));
        return true;
      }
    } catch {
      // Ignore if even lightweight fails
    }
    return false;
  }
}

/**
 * Save item safely to both IndexedDB (full copy) and LocalStorage (with quota guard)
 */
export async function saveSafeItem(key: string, value: any): Promise<void> {
  // 1. Save full data to IndexedDB
  await setIndexedDBItem(key, value);

  // 2. Save to LocalStorage safely (will not throw QuotaExceededError)
  setLocalStorageItemSafe(key, value);
}

/**
 * Get item synchronously from LocalStorage
 */
export function getSafeItemSync<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Get item asynchronously, prioritizing IndexedDB full data, falling back to LocalStorage
 */
export async function getSafeItemAsync<T>(key: string): Promise<T | null> {
  const idbVal = await getIndexedDBItem<T>(key);
  if (idbVal !== null && idbVal !== undefined) {
    return idbVal;
  }
  return getSafeItemSync<T>(key);
}

/**
 * Delete key from IndexedDB
 */
export async function removeIndexedDBItem(key: string): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`[SafeStorage] IndexedDB delete failed for key ${key}:`, err);
  }
}

/**
 * Remove key safely from both IndexedDB and LocalStorage
 */
export async function removeSafeItem(key: string): Promise<void> {
  await removeIndexedDBItem(key);
  try {
    localStorage.removeItem(key);
  } catch {}
}

/**
 * Clear all data associated with a specific profile prefix or child id
 */
export async function clearProfileStorage(profilePrefix: string): Promise<void> {
  // 1. Clear from LocalStorage
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(profilePrefix) || k.includes(`_${profilePrefix}_`) || k.includes(`${profilePrefix}`))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Error clearing localStorage profile keys:', e);
  }

  // 2. Clear from IndexedDB
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const cursorReq = store.openCursor();
    cursorReq.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
      if (cursor) {
        if (typeof cursor.key === 'string' && (cursor.key.startsWith(profilePrefix) || cursor.key.includes(profilePrefix))) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  } catch (err) {
    console.warn('Error clearing IndexedDB profile keys:', err);
  }
}
