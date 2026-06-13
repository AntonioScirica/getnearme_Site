const DB_NAME = 'gnm_media_cache';
const STORE_NAME = 'originals';
const VERSION = 1;

interface CachedMedia {
  batchId: string;
  index: number;
  dataUrl: string;
  timestamp: number;
}

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is not available on server'));
      return;
    }
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: ['batchId', 'index'] });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

export const saveOriginalMedia = async (batchId: string, index: number, dataUrl: string) => {
  if (typeof window === 'undefined') return;
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({
        batchId,
        index,
        dataUrl,
        timestamp: Date.now()
      });
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save media to IndexedDB:', err);
  }
};

export const getOriginalMedia = async (batchId: string, index: number): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get([batchId, index]);
      request.onsuccess = () => {
        resolve(request.result?.dataUrl || null);
      };
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.error('Failed to get media from IndexedDB:', err);
    return null;
  }
};

export const cleanupOldMedia = async () => {
  if (typeof window === 'undefined') return;
  try {
    const db = await initDB();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - THIRTY_DAYS_MS;

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const request = index.openCursor(IDBKeyRange.upperBound(cutoff));
      
      request.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to cleanup IndexedDB:', err);
  }
};
