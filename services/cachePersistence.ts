/**
 * IndexedDB persistence layer for the translation cache.
 *
 * The in-memory LRU cache remains the hot path; this module provides
 * durable storage so translations survive tab restarts.
 * All functions swallow errors — IndexedDB is a best-effort backup.
 */

import { openDB, TRANSLATION_CACHE_STORE } from "./db";
import type { WordTranslation } from "../types";

/**
 * Load every cached translation from IndexedDB into a Map.
 * Returns an empty Map if the store is empty or an error occurs.
 */
export async function initCacheFromIndexedDB(): Promise<Map<string, WordTranslation>> {
  const result = new Map<string, WordTranslation>();

  try {
    const db = await openDB();
    const tx = db.transaction(TRANSLATION_CACHE_STORE, "readonly");
    const store = tx.objectStore(TRANSLATION_CACHE_STORE);

    return await new Promise<Map<string, WordTranslation>>((resolve) => {
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          result.set(cursor.key as string, cursor.value as WordTranslation);
          cursor.continue();
        } else {
          resolve(result);
        }
      };
      cursorReq.onerror = () => {
        console.warn("[cachePersistence] cursor error during init", cursorReq.error);
        resolve(result);
      };
    });
  } catch (err) {
    console.warn("[cachePersistence] failed to load cache from IndexedDB:", err);
    return result;
  }
}

/**
 * Persist a single translation entry to IndexedDB (fire-and-forget safe).
 */
export async function saveToIndexedDBCache(
  key: string,
  value: WordTranslation,
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(TRANSLATION_CACHE_STORE, "readwrite");
    const store = tx.objectStore(TRANSLATION_CACHE_STORE);
    store.put(value, key);
  } catch (err) {
    console.warn("[cachePersistence] failed to save entry:", err);
  }
}

/**
 * Clear all entries from the translationCache store.
 */
export async function clearIndexedDBCache(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(TRANSLATION_CACHE_STORE, "readwrite");
    const store = tx.objectStore(TRANSLATION_CACHE_STORE);
    store.clear();
  } catch (err) {
    console.warn("[cachePersistence] failed to clear IndexedDB cache:", err);
  }
}
