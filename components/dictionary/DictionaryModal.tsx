import React, { useEffect, useState, useRef } from 'react';
import { X, Trash2, Search, BookOpen, Volume2, Download, Upload, FileJson, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { getDictionaryWords, deleteDictionaryWord } from '../../services/db';
import { SavedWord } from '../../types';
import { exportToCSV, exportToJSON, exportToAnki } from '../../services/exportService';
import { importFromJSON, importFromCSV } from '../../services/importService';
import { useAppStore } from '../../store/useAppStore';
import { getLanguageCode } from '../../services/externalTranslationService';
import { DictionaryWordCard } from './DictionaryWordCard';

interface DictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DictionaryModal: React.FC<DictionaryModalProps> = ({ isOpen, onClose }) => {
  const { sourceLang } = useAppStore();
  const [words, setWords] = useState<SavedWord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importTypeRef = useRef<'json' | 'csv' | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({message, type});
    setTimeout(() => setToast(null), 3000);
  };

  const loadWords = async () => {
    const loaded = await getDictionaryWords();
    setWords(loaded);
  };

  useEffect(() => {
    if (isOpen) {
      loadWords();
    }
  }, [isOpen]);

  const handleDelete = async (id: number) => {
    await deleteDictionaryWord(id);
    loadWords();
  };

  const handlePlayAudio = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getLanguageCode(sourceLang); 
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleImportClick = (type: 'json' | 'csv') => {
    importTypeRef.current = type;
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'json' ? '.json' : '.csv';
      fileInputRef.current.click();
    }
    setShowImportMenu(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      let count = 0;
      if (importTypeRef.current === 'json') {
        count = await importFromJSON(file);
      } else {
        count = await importFromCSV(file);
      }
      showToast(`Successfully imported ${count} words!`, 'success');
      loadWords();
    } catch (err) {
      console.error(err);
      showToast("Failed to import file. Please check the format.", 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredWords = words.filter(w => 
    w.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.translation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-full shadow-2xl font-medium animate-in fade-in slide-in-from-top-4 duration-300 text-white ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.message}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
        />

        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <BookOpen className="text-emerald-400 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">My Dictionary</h2>
              <p className="text-slate-400 text-sm">{words.length} saved words</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            
            {/* Import Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowImportMenu(!showImportMenu)}
                disabled={isImporting}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                Import
              </button>
              
              {showImportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowImportMenu(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <button 
                      onClick={() => handleImportClick('csv')}
                      className="w-full px-4 py-3 text-left text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors"
                    >
                      <FileSpreadsheet size={16} className="text-emerald-400" />
                      <span>From CSV</span>
                    </button>
                    <button 
                      onClick={() => handleImportClick('json')}
                      className="w-full px-4 py-3 text-left text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors border-t border-slate-700/50"
                    >
                      <FileJson size={16} className="text-yellow-400" />
                      <span>From JSON</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Export Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm font-medium"
              >
                <Download size={16} />
                Export
              </button>
              
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <button 
                      onClick={() => { exportToCSV(words); setShowExportMenu(false); }}
                      className="w-full px-4 py-3 text-left text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors"
                    >
                      <FileSpreadsheet size={16} className="text-emerald-400" />
                      <span>CSV (Excel)</span>
                    </button>
                    <button 
                      onClick={() => { exportToAnki(words); setShowExportMenu(false); }}
                      className="w-full px-4 py-3 text-left text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors border-t border-slate-700/50"
                    >
                      <FileText size={16} className="text-blue-400" />
                      <span>Anki Deck</span>
                    </button>
                    <button 
                      onClick={() => { exportToJSON(words); setShowExportMenu(false); }}
                      className="w-full px-4 py-3 text-left text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors border-t border-slate-700/50"
                    >
                      <FileJson size={16} className="text-yellow-400" />
                      <span>JSON (Backup)</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-700 bg-slate-900">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search your words..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
          {filteredWords.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <p>No words found.</p>
              {words.length === 0 && <p className="text-sm mt-1">Start watching a video and click '+' to add words.</p>}
            </div>
          ) : (
            filteredWords.map((item) => (
              <DictionaryWordCard 
                key={item.id} 
                item={item} 
                onPlayAudio={handlePlayAudio} 
                onDelete={handleDelete} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
