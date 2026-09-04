/**
 * High-Performance IndexedDB Storage Stream for Large PDF Files (Sách Giáo Khoa)
 * Supports files from 1MB to 500MB+ with instant local blob streaming.
 */

const DB_NAME = 'vulang_pdf_storage_db';
const DB_VERSION = 1;
const STORE_NAME = 'pdf_blobs';

export interface StoredPdfRecord {
  key: string;
  blob: Blob;
  fileName: string;
  size: number;
  subjectName?: string;
  lessonId?: string;
  updatedAt: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

export function initPdfDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
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
 * Save large PDF Blob into IndexedDB
 */
export async function saveLargePdfBlob(
  key: string,
  blobOrFile: Blob | File,
  metadata?: { fileName?: string; subjectName?: string; lessonId?: string }
): Promise<void> {
  const db = await initPdfDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const fileName = metadata?.fileName || (blobOrFile instanceof File ? blobOrFile.name : 'Tai-lieu-SGK.pdf');
    
    // Ensure it is stored as an application/pdf Blob
    const normalizedBlob = blobOrFile.type === 'application/pdf' 
      ? blobOrFile 
      : new Blob([blobOrFile], { type: 'application/pdf' });

    const record: StoredPdfRecord = {
      key,
      blob: normalizedBlob,
      fileName,
      size: normalizedBlob.size,
      subjectName: metadata?.subjectName,
      lessonId: metadata?.lessonId,
      updatedAt: new Date().toISOString()
    };

    const request = store.put(record);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve large PDF Blob from IndexedDB
 */
export async function getLargePdfBlob(key: string): Promise<Blob | null> {
  const db = await initPdfDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      const result = request.result as StoredPdfRecord | undefined;
      resolve(result ? result.blob : null);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Generate a high-speed Blob URL for embedding PDF in iframe or new tab
 */
export async function getLargePdfBlobUrl(key: string): Promise<string | null> {
  try {
    const blob = await getLargePdfBlob(key);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error('Failed to get PDF Blob URL from IndexedDB:', e);
    return null;
  }
}

/**
 * Get metadata info of a stored PDF
 */
export async function getStoredPdfMetadata(key: string): Promise<Omit<StoredPdfRecord, 'blob'> | null> {
  const db = await initPdfDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      const result = request.result as StoredPdfRecord | undefined;
      if (!result) {
        resolve(null);
        return;
      }
      resolve({
        key: result.key,
        fileName: result.fileName,
        size: result.size,
        subjectName: result.subjectName,
        lessonId: result.lessonId,
        updatedAt: result.updatedAt
      });
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a stored PDF record
 */
export async function deleteLargePdfBlob(key: string): Promise<void> {
  const db = await initPdfDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
