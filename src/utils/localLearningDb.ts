/**
 * Local Learning Database (IndexedDB)
 * Database Name: vulang_learning_db
 * Version: 1
 *
 * Dedicated local persistence layer for:
 * 1. study_records: Atomic storage for student study progress records
 * 2. pending_sync: FIFO mutation queue for offline-first sync
 * 3. sync_meta: Metadata storage (syncVersion, lastSyncedAt, etc.)
 */

export type LocalStudyRecordStatus = 'COMPLETED' | 'NEEDS_REVISION' | 'PENDING';

export interface LocalStudyRecord {
  id: string;
  childId: string;
  lessonId?: string;
  date: string; // YYYY-MM-DD
  status: LocalStudyRecordStatus;
  score?: number;
  completedAt?: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  data: Record<string, unknown>;
}

export interface PendingSyncItem<T = unknown> {
  updateId: string;
  childId: string;
  type: string;
  payload: T;
  createdAt: string; // ISO timestamp
  retryCount: number;
  lastAttemptAt?: string; // ISO timestamp
}

export interface SyncMetaRecord<T = unknown> {
  key: string;
  value: T;
  updatedAt: string; // ISO timestamp
}

export const SYNC_META_KEYS = {
  SYNC_VERSION: 'syncVersion',
  LAST_SYNCED_AT: 'lastSyncedAt',
} as const;

export const DB_NAME = 'vulang_learning_db';
export const DB_VERSION = 1;

export const STORES = {
  STUDY_RECORDS: 'study_records',
  PENDING_SYNC: 'pending_sync',
  SYNC_META: 'sync_meta',
} as const;

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open or upgrade the IndexedDB connection with proper transaction and schema management.
 */
export function openLearningDb(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Store: study_records
      if (!db.objectStoreNames.contains(STORES.STUDY_RECORDS)) {
        const store = db.createObjectStore(STORES.STUDY_RECORDS, { keyPath: 'id' });
        store.createIndex('by_childId', 'childId', { unique: false });
        store.createIndex('by_date', 'date', { unique: false });
        store.createIndex('by_lessonId', 'lessonId', { unique: false });
      }

      // 2. Store: pending_sync
      if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
        const store = db.createObjectStore(STORES.PENDING_SYNC, { keyPath: 'updateId' });
        store.createIndex('by_createdAt', 'createdAt', { unique: false });
      }

      // 3. Store: sync_meta
      if (!db.objectStoreNames.contains(STORES.SYNC_META)) {
        db.createObjectStore(STORES.SYNC_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event: Event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      dbInstance = db;

      db.onclose = () => {
        dbInstance = null;
        dbPromise = null;
      };

      db.onversionchange = () => {
        db.close();
        dbInstance = null;
        dbPromise = null;
      };

      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error('Failed to open database'));
    };

    request.onblocked = () => {
      dbPromise = null;
      reject(new Error('Database opening is blocked by another tab or connection.'));
    };
  });

  return dbPromise;
}

// ============================================================================
// 1. STUDY_RECORDS CRUD HELPERS
// ============================================================================

export async function saveLocalStudyRecord(record: LocalStudyRecord): Promise<void> {
  const db = await openLearningDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORES.STUDY_RECORDS, 'readwrite');
    const store = tx.objectStore(STORES.STUDY_RECORDS);
    const req = store.put(record);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error('Failed to save study record'));
  });
}

export async function getLocalStudyRecord(id: string): Promise<LocalStudyRecord | null> {
  const db = await openLearningDb();
  return new Promise<LocalStudyRecord | null>((resolve, reject) => {
    const tx = db.transaction(STORES.STUDY_RECORDS, 'readonly');
    const store = tx.objectStore(STORES.STUDY_RECORDS);
    const req = store.get(id);

    req.onsuccess = () => {
      resolve((req.result as LocalStudyRecord) || null);
    };
    req.onerror = () => reject(req.error || new Error(`Failed to get study record with id ${id}`));
  });
}

export async function getLocalStudyRecordsByChild(childId: string): Promise<LocalStudyRecord[]> {
  const db = await openLearningDb();
  return new Promise<LocalStudyRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORES.STUDY_RECORDS, 'readonly');
    const store = tx.objectStore(STORES.STUDY_RECORDS);
    const index = store.index('by_childId');
    const req = index.getAll(IDBKeyRange.only(childId));

    req.onsuccess = () => {
      resolve((req.result as LocalStudyRecord[]) || []);
    };
    req.onerror = () => reject(req.error || new Error(`Failed to get study records for child ${childId}`));
  });
}

export async function updateLocalStudyRecord(record: LocalStudyRecord): Promise<void> {
  return saveLocalStudyRecord(record);
}

export async function deleteLocalStudyRecord(id: string): Promise<void> {
  const db = await openLearningDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORES.STUDY_RECORDS, 'readwrite');
    const store = tx.objectStore(STORES.STUDY_RECORDS);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error(`Failed to delete study record with id ${id}`));
  });
}

// ============================================================================
// 2. PENDING_SYNC QUEUE HELPERS
// ============================================================================

export async function enqueuePendingSync<T>(item: PendingSyncItem<T>): Promise<void> {
  const db = await openLearningDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORES.PENDING_SYNC, 'readwrite');
    const store = tx.objectStore(STORES.PENDING_SYNC);
    const req = store.put(item);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error('Failed to enqueue pending sync item'));
  });
}

export async function getPendingSyncQueue(): Promise<PendingSyncItem[]> {
  const db = await openLearningDb();
  return new Promise<PendingSyncItem[]>((resolve, reject) => {
    const tx = db.transaction(STORES.PENDING_SYNC, 'readonly');
    const store = tx.objectStore(STORES.PENDING_SYNC);
    const index = store.index('by_createdAt');
    const req = index.getAll();

    req.onsuccess = () => {
      resolve((req.result as PendingSyncItem[]) || []);
    };
    req.onerror = () => reject(req.error || new Error('Failed to fetch pending sync queue'));
  });
}

export async function getPendingSyncItem(updateId: string): Promise<PendingSyncItem | null> {
  const db = await openLearningDb();
  return new Promise<PendingSyncItem | null>((resolve, reject) => {
    const tx = db.transaction(STORES.PENDING_SYNC, 'readonly');
    const store = tx.objectStore(STORES.PENDING_SYNC);
    const req = store.get(updateId);

    req.onsuccess = () => {
      resolve((req.result as PendingSyncItem) || null);
    };
    req.onerror = () => reject(req.error || new Error(`Failed to get pending sync item with updateId ${updateId}`));
  });
}

export async function removePendingSyncItem(updateId: string): Promise<void> {
  const db = await openLearningDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORES.PENDING_SYNC, 'readwrite');
    const store = tx.objectStore(STORES.PENDING_SYNC);
    const req = store.delete(updateId);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error(`Failed to remove pending sync item with updateId ${updateId}`));
  });
}

export async function incrementPendingSyncRetry(updateId: string): Promise<void> {
  const db = await openLearningDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORES.PENDING_SYNC, 'readwrite');
    const store = tx.objectStore(STORES.PENDING_SYNC);
    const getReq = store.get(updateId);

    getReq.onsuccess = () => {
      const item = getReq.result as PendingSyncItem | undefined;
      if (!item) {
        resolve();
        return;
      }

      item.retryCount = (item.retryCount || 0) + 1;
      item.lastAttemptAt = new Date().toISOString();

      const putReq = store.put(item);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error || new Error(`Failed to update retry count for ${updateId}`));
    };

    getReq.onerror = () => reject(getReq.error || new Error(`Failed to fetch item for retry increment: ${updateId}`));
  });
}

// ============================================================================
// 3. SYNC_META HELPERS
// ============================================================================

export async function getMetaValue<T>(key: string): Promise<T | null> {
  const db = await openLearningDb();
  return new Promise<T | null>((resolve, reject) => {
    const tx = db.transaction(STORES.SYNC_META, 'readonly');
    const store = tx.objectStore(STORES.SYNC_META);
    const req = store.get(key);

    req.onsuccess = () => {
      const record = req.result as SyncMetaRecord<T> | undefined;
      resolve(record ? record.value : null);
    };
    req.onerror = () => reject(req.error || new Error(`Failed to get sync meta for key ${key}`));
  });
}

export async function setMetaValue<T>(key: string, value: T): Promise<void> {
  const db = await openLearningDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORES.SYNC_META, 'readwrite');
    const store = tx.objectStore(STORES.SYNC_META);
    const record: SyncMetaRecord<T> = {
      key,
      value,
      updatedAt: new Date().toISOString(),
    };
    const req = store.put(record);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error(`Failed to set sync meta for key ${key}`));
  });
}

export async function deleteMetaValue(key: string): Promise<void> {
  const db = await openLearningDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORES.SYNC_META, 'readwrite');
    const store = tx.objectStore(STORES.SYNC_META);
    const req = store.delete(key);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error(`Failed to delete sync meta for key ${key}`));
  });
}

export async function getSyncVersion(): Promise<number> {
  const ver = await getMetaValue<number>(SYNC_META_KEYS.SYNC_VERSION);
  return typeof ver === 'number' ? ver : 0;
}

export async function setSyncVersion(version: number): Promise<void> {
  return setMetaValue<number>(SYNC_META_KEYS.SYNC_VERSION, version);
}

export async function getLastSyncedAt(): Promise<string | null> {
  return getMetaValue<string>(SYNC_META_KEYS.LAST_SYNCED_AT);
}

export async function setLastSyncedAt(timestampIso: string): Promise<void> {
  return setMetaValue<string>(SYNC_META_KEYS.LAST_SYNCED_AT, timestampIso);
}

// ============================================================================
// 4. DIAGNOSTIC SELF-TEST WITH SAFE TRY/FINALLY CLEANUP
// ============================================================================

export interface SelfTestResult {
  success: boolean;
  logs: string[];
  error?: string;
}

/**
 * Runs a rigorous 11-step diagnostic self-test.
 * Wrapped in a strict try...finally block to ensure ALL test records
 * are permanently erased from the database regardless of pass/fail status.
 */
export async function runLocalLearningDbSelfTest(): Promise<SelfTestResult> {
  const logs: string[] = [];
  const testStudyRecordId = `__test_sr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const testUpdateId = `__test_upd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const testMetaKey = `__test_meta_${Date.now()}`;
  const testChildId = '__test_child_student_999__';

  let initialSyncVersion = 0;

  try {
    logs.push('1. Opening vulang_learning_db...');
    const db = await openLearningDb();
    logs.push(`Database opened: ${db.name} (v${db.version})`);

    logs.push('2. Verifying presence of required ObjectStores...');
    const expectedStores = [STORES.STUDY_RECORDS, STORES.PENDING_SYNC, STORES.SYNC_META];
    for (const storeName of expectedStores) {
      if (!db.objectStoreNames.contains(storeName)) {
        throw new Error(`Missing expected ObjectStore: ${storeName}`);
      }
    }
    logs.push('All 3 ObjectStores exist.');

    logs.push('3. Saving mock LocalStudyRecord...');
    const mockRecord: LocalStudyRecord = {
      id: testStudyRecordId,
      childId: testChildId,
      lessonId: 'lesson_math_01',
      date: '2026-09-06',
      status: 'COMPLETED',
      score: 10,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: { topic: 'Algebra', mockTest: true },
    };
    await saveLocalStudyRecord(mockRecord);
    logs.push(`Saved mock record ${testStudyRecordId}`);

    logs.push('4. Reading back LocalStudyRecord by ID...');
    const readRecord = await getLocalStudyRecord(testStudyRecordId);
    if (!readRecord || readRecord.id !== testStudyRecordId || readRecord.score !== 10) {
      throw new Error('Verification failed when reading back mock LocalStudyRecord');
    }
    logs.push('Record integrity verified by ID.');

    logs.push('5. Querying LocalStudyRecords by childId index...');
    const childRecords = await getLocalStudyRecordsByChild(testChildId);
    const foundChildRecord = childRecords.find((r) => r.id === testStudyRecordId);
    if (!foundChildRecord) {
      throw new Error('Verification failed when querying by childId index');
    }
    logs.push('Index by_childId verified successfully.');

    logs.push('6. Enqueuing mock PendingSyncItem...');
    const mockSyncItem: PendingSyncItem<{ note: string }> = {
      updateId: testUpdateId,
      childId: testChildId,
      type: 'STUDY_RECORD_UPSERT',
      payload: { note: 'Test sync mutation payload' },
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };
    await enqueuePendingSync(mockSyncItem);
    logs.push(`Enqueued pending sync item ${testUpdateId}`);

    logs.push('7. Reading back PendingSyncItem...');
    const readSyncItem = await getPendingSyncItem(testUpdateId);
    if (!readSyncItem || readSyncItem.updateId !== testUpdateId) {
      throw new Error('Verification failed when reading back PendingSyncItem');
    }
    logs.push('Pending sync item verified by updateId.');

    logs.push('8. Testing retry increment on pending sync item...');
    await incrementPendingSyncRetry(testUpdateId);
    const updatedSyncItem = await getPendingSyncItem(testUpdateId);
    if (!updatedSyncItem || updatedSyncItem.retryCount !== 1 || !updatedSyncItem.lastAttemptAt) {
      throw new Error('Verification failed for retry increment');
    }
    logs.push('Retry count increment & lastAttemptAt verified.');

    logs.push('9. Removing PendingSyncItem...');
    await removePendingSyncItem(testUpdateId);
    const deletedSyncItem = await getPendingSyncItem(testUpdateId);
    if (deletedSyncItem !== null) {
      throw new Error('Failed to delete test PendingSyncItem from queue');
    }
    logs.push('Pending sync removal verified.');

    logs.push('10. Testing sync_meta generic and version helpers...');
    initialSyncVersion = await getSyncVersion();
    await setSyncVersion(initialSyncVersion + 99);
    const newVersion = await getSyncVersion();
    if (newVersion !== initialSyncVersion + 99) {
      throw new Error('Verification failed for setSyncVersion / getSyncVersion');
    }

    await setMetaValue(testMetaKey, { testFlag: true, count: 42 });
    const readMetaVal = await getMetaValue<{ testFlag: boolean; count: number }>(testMetaKey);
    if (!readMetaVal || readMetaVal.count !== 42) {
      throw new Error('Verification failed for generic getMetaValue / setMetaValue');
    }
    logs.push('Sync metadata get/set helpers verified.');

    logs.push('11. All diagnostic checks completed successfully!');
    return { success: true, logs };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logs.push(`Self-test error: ${errMsg}`);
    return { success: false, logs, error: errMsg };
  } finally {
    // ALWAYS CLEAN UP TEST DATA
    try {
      await deleteLocalStudyRecord(testStudyRecordId);
      await removePendingSyncItem(testUpdateId);
      await deleteMetaValue(testMetaKey);
      await setSyncVersion(initialSyncVersion);
      logs.push('Cleaned up all temporary self-test artifacts.');
    } catch (cleanupErr) {
      console.warn('Self-test cleanup error:', cleanupErr);
    }
  }
}
