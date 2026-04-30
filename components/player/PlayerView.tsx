import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { InteractiveSubtitle } from '../subtitles/InteractiveSubtitle';
import { SubtitleSettingsPanel } from '../subtitles/SubtitleSettingsPanel';
import { VideoHeader } from './VideoHeader';
import { EndScreen } from './EndScreen';
import { VideoControls } from './VideoControls';
import { CenterPulseFeedback, CenterActionType } from './CenterPulseFeedback';
import { useVideoPlayer } from '../../hooks/useVideoPlayer';
import { useSmartPause } from '../../hooks/useSmartPause';
import { usePlayerShortcuts } from '../../hooks/usePlayerShortcuts';
import { useAppStore } from '../../store/useAppStore';
import { useActiveSubtitle } from '../../hooks/useActiveSubtitle';

interface PlayerViewProps {
  videoSrc: string;
  videoName: string;
  onBack: () => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({ videoSrc, videoName, onBack }) => {
  const subtitles = useAppStore(state => state.subtitles);
  const secondarySubtitles = useAppStore(state => state.secondarySubtitles);
  const subtitleSettings = useAppStore(state => state.subtitleSettings);
  const toggleTranslation = useAppStore(state => state.toggleTranslation);
  const setShowSettings = useAppStore(state => state.setShowSettings);
  const showSettings = useAppStore(state => state.showSettings);
  const playbackTimes = useAppStore(state => state.playbackTimes);
  const savePlaybackTime = useAppStore(state => state.savePlaybackTime);
  const clearPlaybackTime = useAppStore(state => state.clearPlaybackTime);

  const [showEndScreen, setShowEndScreen] = useState(false);
  const [centerAction, setCenterAction] = useState<CenterActionType | null>(null);
  const [resumeToast, setResumeToast] = useState<string | null>(null);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const lastSavedTime = useRef(0);

  const { 
    videoRef, 
    state: playerState, 
    setVideoSrc, 
    togglePlay, 
    toggleMute, 
    setVolume,
    setPlaybackRate, 
    seek, 
    replay,
    handleTimeUpdate,
    handleDurationChange,
    handleVolumeChange,
    handlePlay,
    handlePause
  } = useVideoPlayer();

  // Initialize the video source when the player view mounts
  useEffect(() => {
    if (videoSrc) {
      setVideoSrc(videoSrc);
    }
  }, [videoSrc, setVideoSrc]);

  // Background Auto-Save Tracking wrapper
  const handleTimeUpdateWrapper = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    handleTimeUpdate(e);
    const current = e.currentTarget.currentTime;
    if (Math.abs(current - lastSavedTime.current) >= 3) {
      savePlaybackTime(videoName, current);
      lastSavedTime.current = current;
    }
  }, [handleTimeUpdate, videoName, savePlaybackTime]);

  const { currentCue, secondaryCue } = useActiveSubtitle(
    playerState.currentTime,
    subtitles,
    secondarySubtitles,
    subtitleSettings.subtitleOffset || 0,
    subtitleSettings.showSecondarySubtitle !== false,
    showSettings
  );

  const { handleSubtitleHoverStart, handleSubtitleHoverEnd } = useSmartPause(videoRef, currentCue);

  const showFeedback = useCallback((type: string, text?: string) => {
    const id = Date.now();
    setCenterAction({ type, id, text });
    setTimeout(() => {
      setCenterAction((prev) => (prev?.id === id ? null : prev));
    }, 600);
  }, []);

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  usePlayerShortcuts({
    videoRef,
    playerState,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    toggleTranslation,
    showFeedback
  });

  const handleLoadedMetadata = () => {
    const savedTime = playbackTimes[videoName];
    if (savedTime && savedTime > 5 && videoRef.current) {
      videoRef.current.currentTime = savedTime;
      setResumeToast('Kaldığınız yerden devam ediliyor...');
      setTimeout(() => setResumeToast(null), 3500);
    }
  };

  const handleVideoEnded = () => {
    clearPlaybackTime(videoName);
    setShowEndScreen(true);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleReplay = () => {
    replay();
    setShowEndScreen(false);
  };

  const handleBack = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onBack();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <VideoHeader onBack={handleBack} />

      <div 
        ref={videoContainerRef}
        className="relative w-full max-w-6xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group"
      >
        {resumeToast && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-indigo-500/90 backdrop-blur text-white px-5 py-2 rounded-full font-medium shadow-2xl z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
            {resumeToast}
          </div>
        )}

        <video
          ref={videoRef}
          src={playerState.videoSrc || undefined}
          className="w-full h-full object-contain"
          onEnded={handleVideoEnded}
          onClick={() => {
            showFeedback(playerState.isPlaying ? 'pause' : 'play');
            togglePlay();
          }}
          muted={playerState.isMuted}
          onTimeUpdate={handleTimeUpdateWrapper}
          onDurationChange={handleDurationChange}
          onVolumeChange={handleVolumeChange}
          onPlay={handlePlay}
          onPause={handlePause}
          onLoadedMetadata={handleLoadedMetadata}
        />

        <CenterPulseFeedback action={centerAction} />

        {showEndScreen && (
          <EndScreen onReplay={handleReplay} onBack={handleBack} />
        )}

        <SubtitleSettingsPanel onClose={() => setShowSettings(false)} />

        {!showEndScreen && (
            <div 
              className="absolute inset-x-0 top-0 bottom-24 z-20 flex flex-col justify-end pointer-events-none"
              style={{ paddingBottom: `${subtitleSettings.verticalPosition}%` }}
            >
            {currentCue && (
                <div className="w-full px-8 animate-in fade-in duration-200 relative z-30">
                <InteractiveSubtitle 
                    cue={currentCue}
                    onHoverStart={handleSubtitleHoverStart}
                    onHoverEnd={handleSubtitleHoverEnd}
                />
                </div>
            )}
            {secondaryCue && (
                <div className="w-full px-8 text-center animate-in fade-in duration-200 -mt-2 relative z-20">
                  <span className="bg-slate-900/85 text-slate-300 px-4 py-2 rounded-lg shadow-2xl text-[0.9em] font-medium leading-relaxed max-w-4xl inline-block backdrop-blur-md border border-white/10 pointer-events-none">
                    {secondaryCue.text}
                  </span>
                </div>
            )}
            </div>
        )}

        <div className={`absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/90 to-transparent flex items-end p-4 transition-opacity duration-300 z-30 ${showEndScreen ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}>
          <VideoControls 
            playerState={playerState}
            onTogglePlay={togglePlay}
            onReplay={replay}
            onToggleMute={toggleMute}
            onSetVolume={setVolume}
            onSeek={seek}
            onSetPlaybackRate={setPlaybackRate}
            onToggleFullscreen={toggleFullscreen}
            onShowFeedback={showFeedback}
          />
        </div>
      </div>

      <div className="mt-6 text-slate-500 text-sm max-w-2xl text-center">
        <p>Tip: Hover over the subtitle area to pause. Press <span className="font-mono bg-slate-800 text-indigo-400 px-1 rounded">T</span> to translate the full sentence.</p>
      </div>
    </div>
  );
};
