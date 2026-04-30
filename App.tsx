import React, { useState } from 'react';
import { HomeView } from './components/home/HomeView';
import { PlayerView } from './components/player/PlayerView';
import { parseSubtitles } from './services/subtitleParser';
import { saveSession } from './services/db';
import { AppState } from './types';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const { 
    appState, 
    setAppState, 
    setSubtitles, 
    setSecondarySubtitles,
    setSourceLang, 
    setTargetLang, 
  } = useAppStore();

  const [videoSrc, setGlobalVideoSrc] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string>('');

  const readFileWithFallback = async (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text.includes('\uFFFD')) {
          const fallbackReader = new FileReader();
          fallbackReader.onload = (e2) => resolve(e2.target?.result as string);
          fallbackReader.onerror = reject;
          fallbackReader.readAsText(file, 'windows-1254');
        } else {
          resolve(text);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file, 'utf-8');
    });
  };

  const handleStart = async (
    videoFile: File | Blob, 
    subtitleFile: File | Blob, 
    sLang: string,
    tLang: string, 
    shouldSave: boolean = false, 
    name: string = "Video",
    secSubtitleFile?: File | Blob | null
  ) => {
    // Create Video URL
    const vidUrl = URL.createObjectURL(videoFile);
    setGlobalVideoSrc(vidUrl);
    setVideoName(name);
    setSourceLang(sLang);
    setTargetLang(tLang);

    // Parse Subtitles (with encoding fallback for Turkish ANSI files)
    const text = await readFileWithFallback(subtitleFile);
    const parsed = parseSubtitles(text);
    setSubtitles(parsed);

    if (secSubtitleFile) {
      const secText = await readFileWithFallback(secSubtitleFile);
      setSecondarySubtitles(parseSubtitles(secText));
    } else {
      setSecondarySubtitles([]);
    }

    // Save to DB if requested
    if (shouldSave) {
      saveSession(name, videoFile, subtitleFile, sLang, tLang, secSubtitleFile || undefined).catch(err => {
        console.warn("Could not save to offline library (likely quota exceeded)", err);
      });
    }

    setAppState(AppState.PLAYER);
  };

  const handleBackToHome = () => {
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }
    
    setGlobalVideoSrc(null);
    setVideoName('');
    setSubtitles([]);
    setSecondarySubtitles([]);
    setAppState(AppState.UPLOAD);
  };

  if (appState === AppState.UPLOAD) {
    return <HomeView onStart={handleStart} />;
  }

  if (appState === AppState.PLAYER && videoSrc) {
    return <PlayerView videoSrc={videoSrc} videoName={videoName} onBack={handleBackToHome} />;
  }

  // Fallback safety
  return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <p className="text-white">Loading...</p>
      </div>
  );
}