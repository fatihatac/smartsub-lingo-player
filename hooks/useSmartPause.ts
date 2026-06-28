import { useRef, useCallback, useEffect } from 'react';
import { SubtitleCue } from '../types';

interface UseSmartPauseOptions {
  onSmartPause?: () => void;
}

export const useSmartPause = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  currentCue: SubtitleCue | null,
  options?: UseSmartPauseOptions
) => {
  const isHoverPausedRef = useRef(false);
  const wasPlayingBeforeHoverRef = useRef(false);
  const isOurInteractionRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleUserInteraction = () => {
      // If a play or pause event occurs that wasn't initiated by this hook,
      // the user explicitly interacted. Cancel the hover-pause memory.
      if (!isOurInteractionRef.current && isHoverPausedRef.current) {
        isHoverPausedRef.current = false;
      }
    };

    video.addEventListener('play', handleUserInteraction);
    video.addEventListener('pause', handleUserInteraction);

    return () => {
      video.removeEventListener('play', handleUserInteraction);
      video.removeEventListener('pause', handleUserInteraction);
    };
  }, [videoRef]);

  const handleSubtitleHoverStart = useCallback(() => {
    if (!videoRef.current) return;
    
    // Only engage logic if we aren't already hover-paused
    if (!isHoverPausedRef.current) {
      wasPlayingBeforeHoverRef.current = !videoRef.current.paused;
      
      if (!videoRef.current.paused) {
        isOurInteractionRef.current = true;
        videoRef.current.pause();
        isHoverPausedRef.current = true;
        options?.onSmartPause?.();
        setTimeout(() => { isOurInteractionRef.current = false; }, 50);
      }
    }
  }, [videoRef]);

  const handleSubtitleHoverEnd = useCallback(() => {
    if (!videoRef.current) return;

    // Only resume if we are currently paused due to hover AND it was playing before
    if (isHoverPausedRef.current && wasPlayingBeforeHoverRef.current) {
      isOurInteractionRef.current = true;
      videoRef.current.play().catch(() => {});
      setTimeout(() => { isOurInteractionRef.current = false; }, 50);
    }
    isHoverPausedRef.current = false;
  }, [videoRef]);

  // Watch for currentCue changing to null while hover-paused
  useEffect(() => {
    if (!currentCue && isHoverPausedRef.current && videoRef.current) {
      if (wasPlayingBeforeHoverRef.current) {
        isOurInteractionRef.current = true;
        videoRef.current.play().catch(() => {});
        setTimeout(() => { isOurInteractionRef.current = false; }, 50);
      }
      isHoverPausedRef.current = false;
    }
  }, [currentCue, videoRef]);

  return {
    handleSubtitleHoverStart,
    handleSubtitleHoverEnd,
  };
};
