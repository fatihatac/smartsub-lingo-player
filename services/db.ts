import { OfflineSession, SavedWord } from '../types';

const DB_NAME = 'SmartSubDB';
const SESSIONS_STORE = 'sessions';
const DICT_STORE = 'dictionary';
const VERSION = 2; // Incremented version for schema update

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      
      if (oldVersion < 1) {
        db.createObjectStore(SESSIONS_STORE, { keyPath: 'id', autoIncrement: true });
        db.createObjectStore(DICT_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

// --- Session Operations ---

export const saveSession = async (
  name: string, 
  videoBlob: Blob, 
  subtitleBlob: Blob, 
  sourceLang: string, 
  targetLang: string,
  secondarySubtitleBlob?: Blob
): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], 'readwrite');
    const store = transaction.objectStore(SESSIONS_STORE);
    
    const session: Omit<OfflineSession, 'id'> = {
      name,
      videoBlob,
      subtitleBlob,
      secondarySubtitleBlob,
      sourceLang,
      targetLang,
      date: Date.now()
    };

    const request = store.add(session);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getSessions = async (): Promise<OfflineSession[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], 'readonly');
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result as OfflineSession[];
      resolve(results.sort((a, b) => b.date - a.date));
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteSession = async (id: number): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], 'readwrite');
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// --- Dictionary Operations ---

export const saveWordToDictionary = async (word: string, translation: string, ipa: string, contextSentence: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DICT_STORE], 'readwrite');
    const store = transaction.objectStore(DICT_STORE);

    const savedWord: Omit<SavedWord, 'id'> = {
      word,
      translation,
      ipa,
      contextSentence,
      date: Date.now()
    };

    const request = store.add(savedWord);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getDictionaryWords = async (): Promise<SavedWord[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DICT_STORE], 'readonly');
    const store = transaction.objectStore(DICT_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result as SavedWord[];
      resolve(results.sort((a, b) => b.date - a.date));
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteDictionaryWord = async (id: number): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DICT_STORE], 'readwrite');
    const store = transaction.objectStore(DICT_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const bulkSaveWordsToDictionary = async (words: Omit<SavedWord, 'id'>[]): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DICT_STORE], 'readwrite');
    const store = transaction.objectStore(DICT_STORE);

    let completed = 0;
    let errors = 0;

    if (words.length === 0) {
      resolve();
      return;
    }

    words.forEach(word => {
      // Ensure date exists
      if (!word.date) word.date = Date.now();
      
      const request = store.add(word);
      request.onsuccess = () => {
        completed++;
        if (completed + errors === words.length) {
          if (errors > 0) console.warn(`Failed to import ${errors} words`);
          resolve();
        }
      };
      request.onerror = (e) => {
        console.error("Error importing word", word, e);
        errors++;
        if (completed + errors === words.length) {
          resolve();
        }
      };
    });
  });
};