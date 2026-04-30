import React, { useState } from 'react';
import { FileVideo, ArrowRight, Book } from 'lucide-react';
import { DictionaryModal } from '../dictionary/DictionaryModal';
import { UploadForm } from './UploadForm';
import { OfflineLibrary } from './OfflineLibrary';

interface HomeViewProps {
  onStart: (videoFile: File | Blob, subtitleFile: File | Blob, sourceLang: string, targetLang: string, saveToHistory?: boolean, sessionName?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onStart }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [secSubtitleFile, setSecSubtitleFile] = useState<File | null>(null);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

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
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl font-medium animate-in fade-in slide-in-from-top-4 duration-300">
          {toast}
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