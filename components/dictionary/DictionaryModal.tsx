import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { X, Trash2, Search, BookOpen, Volume2, Download, Upload, FileJson, FileSpreadsheet, FileText, Loader2, GraduationCap, RotateCcw } from 'lucide-react';
import { getDictionaryWords, deleteDictionaryWord, updateDictionaryWord } from '../../services/db';
import { SavedWord } from '../../types';
import { exportToCSV, exportToJSON, exportToAnki } from '../../services/exportService';
import { importFromJSON, importFromCSV } from '../../services/importService';
import { useAppStore } from '../../store/useAppStore';
import { filterAndSort } from '../../services/dictionaryFilter';
import type { FilterOptions } from '../../services/dictionaryFilter';
import { DictionaryWordCard } from './DictionaryWordCard';
import { useToast } from '../../hooks/useToast';
import { scheduleReview, Rating, type Grade, type FsrsFields } from '../../services/fsrsService';

interface DictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DictionaryModal: React.FC<DictionaryModalProps> = ({ isOpen, onClose }) => {
  const { sourceLang, targetLang } = useAppStore();
  const [words, setWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [filterSourceLang, setFilterSourceLang] = useState(sourceLang);
  const [filterTargetLang, setFilterTargetLang] = useState(targetLang);
  const [sortBy, setSortBy] = useState<FilterOptions['sortBy']>('date');
  const { toast, showToast } = useToast(3000);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importTypeRef = useRef<'json' | 'csv' | null>(null);

  // Study mode state
  const [activeTab, setActiveTab] = useState<'list' | 'study'>('list');
  const [studyIndex, setStudyIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const loadWords = async () => {
    setLoading(true);
    const loaded = await getDictionaryWords();
    setWords(loaded);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadWords();
      // Reset study state when modal opens
      setActiveTab('list');
      setStudyIndex(0);
      setIsFlipped(false);
      setReviewedCount(0);
    }
  }, [isOpen]);

  // Filter words due for review: state===0 (New) OR (due !== null && due <= now)
  const dueWords = useMemo(() => {
    const now = Date.now();
    return words.filter(w => {
      if (w.state === 0 || w.state === undefined || w.state === null) return true;
      if (w.due !== null && w.due !== undefined) return w.due <= now;
      return false;
    });
  }, [words]);

  // Keyboard shortcuts for study mode
  useEffect(() => {
    if (!isOpen || activeTab !== 'study') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        if (!isFlipped && dueWords.length > 0 && studyIndex < dueWords.length) {
          setIsFlipped(true);
        }
      } else if (e.key === '1' && isFlipped) {
        handleRate(Rating.Again);
      } else if (e.key === '2' && isFlipped) {
        handleRate(Rating.Hard);
      } else if (e.key === '3' && isFlipped) {
        handleRate(Rating.Good);
      } else if (e.key === '4' && isFlipped) {
        handleRate(Rating.Easy);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, isFlipped, dueWords, studyIndex]);

  const handleDelete = async (id: number) => {
    await deleteDictionaryWord(id);
    loadWords();
  };

  const handlePlayAudio = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = sourceLang.slice(0,2).toLowerCase(); 
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

  const handleRate = useCallback(async (rating: Grade) => {
    if (studyIndex >= dueWords.length) return;

    const word = dueWords[studyIndex];
    const fields: FsrsFields = {
      stability: word.stability ?? 0,
      difficulty: word.difficulty ?? 0,
      state: word.state ?? 0,
      reps: word.reps ?? 0,
      lapses: word.lapses ?? 0,
      scheduled_days: word.scheduled_days ?? 0,
      learning_steps: word.learning_steps ?? 0,
      due: word.due ?? Date.now(),
      last_review: word.last_review ?? null,
    };

    const result = scheduleReview(fields, rating);

    // Update word with new FSRS fields
    const updatedWord: SavedWord = {
      ...word,
      stability: result.card.stability,
      difficulty: result.card.difficulty,
      state: result.card.state,
      reps: result.card.reps,
      lapses: result.card.lapses,
      scheduled_days: result.card.scheduled_days,
      learning_steps: result.card.learning_steps,
      due: result.card.due,
      last_review: result.card.last_review,
    };

    await updateDictionaryWord(updatedWord);

    // Update local state
    setWords(prev => prev.map(w => w.id === updatedWord.id ? updatedWord : w));
    setReviewedCount(prev => prev + 1);

    // Advance to next card
    if (studyIndex + 1 < dueWords.length) {
      setStudyIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      // Session complete - show congratulations
      setStudyIndex(prev => prev + 1);
    }
  }, [studyIndex, dueWords]);

  const filteredWords = useMemo(() => filterAndSort(words, {
    sourceLang: filterSourceLang || undefined,
    targetLang: filterTargetLang || undefined,
    searchTerm,
    sortBy,
  }), [words, filterSourceLang, filterTargetLang, searchTerm, sortBy]);

  const isFiltered = filterSourceLang !== '' || filterTargetLang !== '' || searchTerm !== '';

  if (!isOpen) return null;

  const isSessionComplete = activeTab === 'study' && studyIndex >= dueWords.length && dueWords.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true">
      {/* Toast Notification */}
      {toast && (
        <div role="alert" aria-live="polite" className={`fixed top-6 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-full shadow-2xl font-medium animate-in fade-in slide-in-from-top-4 duration-300 text-white ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
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
              <p className="text-slate-400 text-sm">
                {isFiltered
                  ? `${filteredWords.length} words (${words.length} total)`
                  : `${words.length} saved words`}
              </p>
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

            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg" aria-label="Close dictionary">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 pb-0 bg-slate-900">
          <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'list'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              List
            </button>
            <button
              onClick={() => {
                setActiveTab('study');
                setStudyIndex(0);
                setIsFlipped(false);
                setReviewedCount(0);
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'study'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap size={16} />
              Study
              {dueWords.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
                  {dueWords.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'list' ? (
          <>
            {/* Search + Filters */}
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
              <div className="flex items-center gap-2 mt-3">
                <select
                  value={filterSourceLang}
                  onChange={(e) => setFilterSourceLang(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Sources</option>
                  <option value="English">English</option>
                  <option value="Turkish">Turkish</option>
                </select>
                <select
                  value={filterTargetLang}
                  onChange={(e) => setFilterTargetLang(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Targets</option>
                  <option value="English">English</option>
                  <option value="Turkish">Turkish</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as FilterOptions['sortBy'])}
                  className="flex-1 bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="date">Date (newest)</option>
                  <option value="word">Word (A-Z)</option>
                  <option value="dueDate">Due Date</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  <p>Loading dictionary...</p>
                </div>
              ) : filteredWords.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <p>No words found.</p>
                  {words.length === 0 ? (
                    <p className="text-sm mt-1">Start watching a video and click '+' to add words.</p>
                  ) : isFiltered ? (
                    <button
                      onClick={() => { setFilterSourceLang(''); setFilterTargetLang(''); setSearchTerm(''); }}
                      className="mt-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Clear all filters
                    </button>
                  ) : null}
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
          </>
        ) : (
          /* Study Tab */
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p>Loading words...</p>
              </div>
            ) : dueWords.length === 0 ? (
              /* Empty State - No words to review */
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <GraduationCap className="w-12 h-12 mb-4 text-slate-600" />
                <p className="text-lg font-medium text-slate-400">No words to review yet</p>
                <p className="text-sm mt-1">Save some words first!</p>
                <button
                  onClick={() => setActiveTab('list')}
                  className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm"
                >
                  Go to List
                </button>
              </div>
            ) : isSessionComplete ? (
              /* Congratulations Screen */
              <div className="flex flex-col items-center justify-center h-64">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-white mb-2">All caught up!</h3>
                <p className="text-slate-400 mb-6">
                  You reviewed {reviewedCount} word{reviewedCount !== 1 ? 's' : ''} today
                </p>
                <button
                  onClick={() => setActiveTab('list')}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors font-medium"
                >
                  Back to List
                </button>
              </div>
            ) : (
              /* Flashcard Study Mode */
              <div className="flex flex-col items-center">
                {/* Progress Counter */}
                <div className="text-sm text-slate-400 mb-6">
                  Word {studyIndex + 1} of {dueWords.length}
                </div>

                {/* Flashcard */}
                <div 
                  className="w-full max-w-md cursor-pointer perspective-1000"
                  onClick={() => {
                    if (!isFlipped) setIsFlipped(true);
                  }}
                >
                  <div 
                    className={`relative w-full min-h-[280px] transition-transform duration-500 transform-style-preserve-3d ${
                      isFlipped ? 'rotate-y-180' : ''
                    }`}
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      transition: 'transform 0.5s ease',
                    }}
                  >
                    {/* Front */}
                    <div 
                      className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 border-2 border-slate-700 rounded-2xl p-8 backface-hidden"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="text-3xl font-bold text-white mb-4">
                        {dueWords[studyIndex].word}
                      </div>
                      {dueWords[studyIndex].contextSentence && (
                        <p className="text-slate-500 text-sm italic text-center max-w-xs">
                          "{dueWords[studyIndex].contextSentence}"
                        </p>
                      )}
                      <p className="text-slate-600 text-xs mt-4">Click or press Space to flip</p>
                    </div>

                    {/* Back */}
                    <div 
                      className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 border-2 border-emerald-600/50 rounded-2xl p-8 backface-hidden"
                      style={{ 
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      }}
                    >
                      <div className="text-2xl font-bold text-emerald-400 mb-2">
                        {dueWords[studyIndex].translation}
                      </div>
                      {dueWords[studyIndex].ipa && (
                        <div className="text-sm text-slate-400 font-mono mb-4">
                          /{dueWords[studyIndex].ipa}/
                        </div>
                      )}
                      <div className="text-lg font-medium text-white mb-2">
                        {dueWords[studyIndex].word}
                      </div>
                      {dueWords[studyIndex].contextSentence && (
                        <p className="text-slate-400 text-sm italic text-center max-w-xs mt-2">
                          "{dueWords[studyIndex].contextSentence}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rating Buttons - Only show when flipped */}
                {isFlipped && (
                  <div className="mt-8 w-full max-w-md">
                    <p className="text-xs text-slate-500 text-center mb-3">How well did you know this?</p>
                    <div className="grid grid-cols-4 gap-3">
                      <button
                        onClick={() => handleRate(Rating.Again)}
                        className="py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors font-medium text-sm"
                      >
                        Again
                        <span className="block text-xs opacity-70 mt-0.5">1</span>
                      </button>
                      <button
                        onClick={() => handleRate(Rating.Hard)}
                        className="py-3 px-4 bg-orange-500 hover:bg-orange-400 text-white rounded-xl transition-colors font-medium text-sm"
                      >
                        Hard
                        <span className="block text-xs opacity-70 mt-0.5">2</span>
                      </button>
                      <button
                        onClick={() => handleRate(Rating.Good)}
                        className="py-3 px-4 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors font-medium text-sm"
                      >
                        Good
                        <span className="block text-xs opacity-70 mt-0.5">3</span>
                      </button>
                      <button
                        onClick={() => handleRate(Rating.Easy)}
                        className="py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium text-sm"
                      >
                        Easy
                        <span className="block text-xs opacity-70 mt-0.5">4</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Keyboard Hints */}
                <div className="mt-6 text-xs text-slate-600 text-center">
                  <p>Keyboard: <span className="text-slate-500">Space</span> flip · <span className="text-slate-500">1-4</span> rate</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
