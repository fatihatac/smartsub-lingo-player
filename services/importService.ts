import Papa from 'papaparse';
import { SavedWord } from '../types';
import { bulkSaveWordsToDictionary } from './db';

export const importFromJSON = async (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        const words = JSON.parse(json) as SavedWord[];
        
        // Validate structure roughly
        if (!Array.isArray(words)) throw new Error("Invalid JSON format: Expected an array.");
        
        // Clean up IDs to let DB auto-increment, and ensure required fields
        const wordsToSave = words.map(({ id, ...rest }) => ({
          ...rest,
          date: rest.date || Date.now()
        }));

        await bulkSaveWordsToDictionary(wordsToSave);
        resolve(wordsToSave.length);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};

export const importFromCSV = async (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data as any[];
          const wordsToSave = data.map(row => ({
            word: row['Word'] || row['word'],
            translation: row['Translation'] || row['translation'],
            ipa: row['IPA'] || row['ipa'] || '',
            contextSentence: row['Context'] || row['contextSentence'] || '',
            date: row['Date'] ? new Date(row['Date']).getTime() : Date.now()
          })).filter(w => w.word && w.translation); // Filter out invalid rows

          if (wordsToSave.length === 0) throw new Error("No valid words found in CSV.");

          await bulkSaveWordsToDictionary(wordsToSave);
          resolve(wordsToSave.length);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err)
    });
  });
};
