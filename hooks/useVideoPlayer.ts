import { useState, useRef, useCallback } from 'react';

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isMuted: boolean;
  volume: number;
  playbackRate: number;
  videoSrc: string | null;
}

export const useVideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isMuted: false,
    volume: 1,
    playbackRate: 1,
    videoSrc: null,
  });

  const setVideoSrc = useCallback((src: string | null) => {
    setState(prev => {
      // Prevent infinite loop if the src is exactly the same
      if (prev.videoSrc === src) return prev;
      return { ...prev, videoSrc: src };
    });
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !state.isMuted;
    // If unmuting and volume is 0, set it to 1
    if (state.isMuted && state.volume === 0) {
      videoRef.current.volume = 1;
      setState(prev => ({ ...prev, isMuted: !prev.isMuted, volume: 1 }));
    } else {
      setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    }
  }, [state.isMuted, state.volume]);

  const setVolume = useCallback((volume: number) => {
    if (!videoRef.current) return;
    const newVolume = Math.max(0, Math.min(1, volume));
    videoRef.current.volume = newVolume;
    videoRef.current.muted = newVolume === 0;
    setState(prev => ({ 
      ...prev, 
      volume: newVolume, 
      isMuted: newVolume === 0 
    }));
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setState(prev => ({ ...prev, playbackRate: rate }));
  }, []);

  const seek = useCallback((time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setState(prev => ({ ...prev, currentTime: time }));
  }, []);

  const replay = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
  }, []);

  // Event Handlers to sync state - exposed to be used in JSX
  const handleTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setState(prev => ({ ...prev, currentTime: video.currentTime }));
  }, []);

  const handleDurationChange = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setState(prev => ({ ...prev, duration: video.duration }));
  }, []);

  const handleVolumeChange = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setState(prev => ({ 
      ...prev, 
      volume: video.volume, 
      isMuted: video.muted 
    }));
  }, []);

  const handlePlay = useCallback(() => setState(prev => ({ ...prev, isPlaying: true })), []);
  const handlePause = useCallback(() => setState(prev => ({ ...prev, isPlaying: false })), []);

  return {
    videoRef,
    state,
    setVideoSrc,
    togglePlay,
    toggleMute,
    setVolume,
    setPlaybackRate,
    seek,
    replay,
    // Expose handlers
    handleTimeUpdate,
    handleDurationChange,
    handleVolumeChange,
    handlePlay,
    handlePause
  };
};
