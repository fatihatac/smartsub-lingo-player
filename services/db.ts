import { OfflineSession, SavedWord } from '../types';

const DB_NAME = 'SmartSubDB';
const SESSIONS_STORE = 'sessions';
const DICT_STORE = 'dictionary';
export const TRANSLATION_CACHE_STORE = 'translationCache';
const VERSION = 3;

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

      if (oldVersion < 2) {
        const tx = (event.target as IDBOpenDBRequest).transaction;
        if (tx) {
          const dictStore = tx.objectStore(DICT_STORE);
          // Add compound index for language pair filtering
          dictStore.createIndex('langPair', ['sourceLang', 'targetLang'], { unique: false });

          // Migrate existing records with default FSRS + language values
          const cursorRequest = dictStore.openCursor();
          cursorRequest.onsuccess = (cursorEvent) => {
            const cursor = (cursorEvent.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              const record = cursor.value;
              let needsUpdate = false;

              if (record.sourceLang === undefined) { record.sourceLang = null; needsUpdate = true; }
              if (record.targetLang === undefined) { record.targetLang = null; needsUpdate = true; }
              if (record.stability === undefined) { record.stability = 0; needsUpdate = true; }
              if (record.difficulty === undefined) { record.difficulty = 0; needsUpdate = true; }
              if (record.state === undefined) { record.state = 0; needsUpdate = true; }
              if (record.reps === undefined) { record.reps = 0; needsUpdate = true; }
              if (record.lapses === undefined) { record.lapses = 0; needsUpdate = true; }
              if (record.scheduled_days === undefined) { record.scheduled_days = 0; needsUpdate = true; }
              if (record.learning_steps === undefined) { record.learning_steps = 0; needsUpdate = true; }
              if (record.due === undefined) { record.due = null; needsUpdate = true; }
              if (record.last_review === undefined) { record.last_review = null; needsUpdate = true; }

              if (needsUpdate) {
                cursor.update(record);
              }
              cursor.continue();
            }
          };
        }
      }

      if (oldVersion < 3) {
        if (!db.objectStoreNames.contains(TRANSLATION_CACHE_STORE)) {
          // Out-of-line keys: cache key "${sourceLang}:${targetLang}:${word}"
          db.createObjectStore(TRANSLATION_CACHE_STORE);
        }
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
  secondarySubtitleBlob?: Blob,
  source?: 'file' | 'youtube'
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
      date: Date.now(),
      ...(source && { source }),
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

export const saveWordToDictionary = async (
  word: string,
  translation: string,
  ipa: string,
  contextSentence: string,
  sourceLang?: string,
  targetLang?: string
): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DICT_STORE], 'readwrite');
    const store = transaction.objectStore(DICT_STORE);

    const savedWord: Omit<SavedWord, 'id'> = {
      word,
      translation,
      ipa,
      contextSentence,
      date: Date.now(),
      sourceLang: sourceLang ?? null,
      targetLang: targetLang ?? null,
      stability: 0,
      difficulty: 0,
      state: 0,
      reps: 0,
      lapses: 0,
      scheduled_days: 0,
      learning_steps: 0,
      due: null,
      last_review: null,
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

export const updateDictionaryWord = async (word: SavedWord): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DICT_STORE], 'readwrite');
    const store = transaction.objectStore(DICT_STORE);
    const request = store.put(word);

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
      // Ensure FSRS defaults exist for imported words
      if (word.stability === undefined) word.stability = 0;
      if (word.difficulty === undefined) word.difficulty = 0;
      if (word.state === undefined) word.state = 0;
      if (word.reps === undefined) word.reps = 0;
      if (word.lapses === undefined) word.lapses = 0;
      if (word.scheduled_days === undefined) word.scheduled_days = 0;
      if (word.learning_steps === undefined) word.learning_steps = 0;
      if (word.due === undefined) word.due = null;
      if (word.last_review === undefined) word.last_review = null;
      
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