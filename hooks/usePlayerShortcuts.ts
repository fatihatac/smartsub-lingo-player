import { useEffect } from 'react';
import { VideoPlayerState } from './useVideoPlayer';

interface UsePlayerShortcutsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  playerState: VideoPlayerState;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  toggleTranslation: () => void;
  showFeedback: (type: string, text?: string) => void;
}

export const usePlayerShortcuts = ({
  videoRef,
  playerState,
  togglePlay,
  seek,
  setVolume,
  toggleMute,
  toggleFullscreen,
  toggleTranslation,
  showFeedback
}: UsePlayerShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInput = ['input', 'textarea', 'select'].includes(target.tagName.toLowerCase()) || target.isContentEditable;
        if (isInput) return;
      }

      // Toggle Translation Mode with 'T'
      if (e.key.toLowerCase() === 't') {
        toggleTranslation();
      }

      const video = videoRef.current;
      if (video) {
        switch (e.key.toLowerCase()) {
          case ' ':
            e.preventDefault();
            showFeedback(playerState.isPlaying ? 'pause' : 'play');
            togglePlay();
            break;
          case 'arrowright':
            e.preventDefault();
            seek(video.currentTime + 10);
            showFeedback('forward', '+10s');
            break;
          case 'arrowleft':
            e.preventDefault();
            seek(Math.max(0, video.currentTime - 10));
            showFeedback('rewind', '-10s');
            break;
          case 'arrowup':
            e.preventDefault();
            {
              const newVol = Math.min(1, video.volume + 0.05);
              setVolume(newVol);
              showFeedback('vol-up', `${Math.round(newVol * 100)}%`);
            }
            break;
          case 'arrowdown':
            e.preventDefault();
            {
              const newVol = Math.max(0, video.volume - 0.05);
              setVolume(newVol);
              showFeedback(newVol === 0 ? 'mute' : 'vol-down', newVol === 0 ? 'Muted' : `${Math.round(newVol * 100)}%`);
            }
            break;
          case 'm':
            e.preventDefault();
            showFeedback(playerState.isMuted ? 'unmute' : 'mute', playerState.isMuted ? 'Unmuted' : 'Muted');
            toggleMute();
            break;
          case 'f':
            e.preventDefault();
            toggleFullscreen();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    toggleTranslation,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    playerState.isPlaying,
    playerState.isMuted,
    showFeedback,
    videoRef
  ]);
};
