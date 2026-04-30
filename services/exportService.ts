import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { SavedWord } from '../types';

export const exportToCSV = (words: SavedWord[]) => {
  const data = words.map(w => ({
    Word: w.word,
    Translation: w.translation,
    IPA: w.ipa || '',
    Context: w.contextSentence || '',
    Date: new Date(w.date).toLocaleDateString()
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `smartsub_dictionary_${new Date().toISOString().split('T')[0]}.csv`);
};

export const exportToJSON = (words: SavedWord[]) => {
  const json = JSON.stringify(words, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  saveAs(blob, `smartsub_dictionary_${new Date().toISOString().split('T')[0]}.json`);
};

export const exportToAnki = (words: SavedWord[]) => {
  // Anki format: Front (Word) <tab> Back (Translation + Context) <tab> Tags
  // Using HTML for styling in Anki cards
  const text = words.map(w => {
    const front = w.word;
    const back = `${w.translation}<br><br><em>${w.contextSentence || ''}</em><br><small>/${w.ipa || ''}/</small>`;
    return `${front}\t${back}\tsmartsub_lingo`;
  }).join('\n');

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
  saveAs(blob, `smartsub_anki_import_${new Date().toISOString().split('T')[0]}.txt`);
};
