import React, { useState, useEffect } from 'react';
import { Clock, PlayCircle, Trash2 } from 'lucide-react';
import { getSessions, deleteSession } from '../../services/db';
import { OfflineSession } from '../../types';

interface OfflineLibraryProps {
  onStart: (videoFile: File | Blob, subtitleFile: File | Blob, sourceLang: string, targetLang: string, saveToHistory?: boolean, sessionName?: string, secSub?: File | Blob | null) => void;
}

export const OfflineLibrary: React.FC<OfflineLibraryProps> = ({ onStart }) => {
  const [recentSessions, setRecentSessions] = useState<OfflineSession[]>([]);

  const loadSessions = async () => {
    try {
      const sessions = await getSessions();
      setRecentSessions(sessions);
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await deleteSession(id);
    await loadSessions();
  };

  return (
    <div className="flex flex-col flex-1">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <Clock className="w-6 h-6 text-indigo-400" />
        Offline Library
      </h2>
      
      <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden flex flex-col">
        {recentSessions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500">
            <p>No recent files saved.</p>
            <p className="text-sm mt-2">Upload a video to save it here.</p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[400px] p-4 space-y-3 custom-scrollbar">
            {recentSessions.map((session) => (
              <div 
                key={session.id}
                onClick={() => onStart(session.videoBlob, session.subtitleBlob, session.sourceLang || 'English', session.targetLang, false, session.name, session.secondarySubtitleBlob)}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-xl flex items-center justify-between cursor-pointer group transition-all"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 shrink-0">
                    <PlayCircle size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate pr-2">{session.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="bg-slate-700 px-1.5 py-0.5 rounded">{session.sourceLang || 'English'} → {session.targetLang}</span>
                      <span>{new Date(session.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={(e) => handleDelete(e, session.id)}
                  className="text-slate-500 hover:text-red-400 p-2 rounded-full hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove from library"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
