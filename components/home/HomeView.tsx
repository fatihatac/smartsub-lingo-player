import React, { useState } from 'react';
import { FileVideo, ArrowRight, Book, Clock, Trash2 } from 'lucide-react';
import { DictionaryModal } from '../dictionary/DictionaryModal';
import { UploadForm } from './UploadForm';
import { OfflineLibrary } from './OfflineLibrary';
import { useToast } from '../../hooks/useToast';
import { useAppStore } from '../../store/useAppStore';

interface HomeViewProps {
  onStart: (videoFile: File | Blob, subtitleFile: File | Blob, sourceLang: string, targetLang: string, saveToHistory?: boolean, sessionName?: string, secSubFile?: File | null) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onStart }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [secSubtitleFile, setSecSubtitleFile] = useState<File | null>(null);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast, showToast } = useToast(3000);
  const playbackTimes = useAppStore(state => state.playbackTimes);
  const clearPlaybackTime = useAppStore(state => state.clearPlaybackTime);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const vid = files.find(f => f.type.startsWith('video/') || f.name.endsWith('.mkv'));
      const subs = files.filter(f => f.name.endsWith('.srt') || f.name.endsWith('.vtt'));
      
      if (vid) setVideoFile(vid);
      if (subs[0]) setSubtitleFile(subs[0]);
      if (subs[1]) setSecSubtitleFile(subs[1]);
      
      if (vid || subs.length > 0) {
        showToast(vid && subs.length > 0 ? "Video & Subtitle(s) loaded!" : (vid ? "Video loaded!" : "Subtitle loaded!"));
      }
    }
  };

  return (
    <div 
      className="min-h-screen bg-slate-900 p-6 flex flex-col items-center relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Toast Notification */}
      {toast && (
        <div role="alert" aria-live="polite" className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl font-medium animate-in fade-in slide-in-from-top-4 duration-300">
          {toast.message}
        </div>
      )}

      {/* Drag Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-40 bg-indigo-500/20 backdrop-blur-sm border-4 border-indigo-500 border-dashed rounded-xl flex items-center justify-center pointer-events-none transition-all">
          <div className="bg-slate-900 text-indigo-400 p-8 rounded-2xl flex flex-col items-center shadow-2xl">
            <FileVideo size={64} className="mb-4 animate-bounce" />
            <span className="text-2xl font-bold">Drop Video or Subtitle Here</span>
          </div>
        </div>
      )}

      <DictionaryModal isOpen={isDictionaryOpen} onClose={() => setIsDictionaryOpen(false)} />
      
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        
        {/* Left Column: Upload Form */}
        <UploadForm 
          onStart={onStart}
          showToast={showToast}
          videoFile={videoFile}
          subtitleFile={subtitleFile}
          secSubtitleFile={secSubtitleFile}
          onSetVideoFile={setVideoFile}
          onSetSubtitleFile={setSubtitleFile}
          onSetSecSubtitleFile={setSecSubtitleFile}
        />

        {/* Right Column: Library & Dictionary Banner */}
        <div className="flex flex-col h-full gap-6">
          <OfflineLibrary onStart={onStart} />

          {/* Saved Playback Positions */}
          {Object.keys(playbackTimes).length > 0 && (
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white">Saved Playback Positions</h3>
              </div>
              <div className="p-3 space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                {Object.entries(playbackTimes).map(([name, time]) => {
                  const minutes = Math.floor(time / 60);
                  const seconds = Math.floor(time % 60);
                  const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                  return (
                    <div 
                      key={name}
                      className="bg-slate-800 border border-slate-700 p-3 rounded-xl flex items-center justify-between group hover:bg-slate-700 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate text-sm">{name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Resume at {formatted}</p>
                      </div>
                      <button
                        onClick={() => clearPlaybackTime(name)}
                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        title="Remove saved position"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dictionary Banner */}
          <div 
            onClick={() => setIsDictionaryOpen(true)}
            className="bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border border-emerald-700/50 p-6 rounded-2xl flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors group mt-auto"
          >
            <div className="flex items-center gap-4">
              <div className="bg-emerald-500 text-white p-3 rounded-xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                <Book size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">My Dictionary</h3>
                <p className="text-slate-300 text-sm">Review saved words and translations</p>
              </div>
            </div>
            <div className="bg-slate-900/50 p-2 rounded-full text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <ArrowRight size={20} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};