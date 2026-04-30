import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, Settings, FastForward, Rewind } from 'lucide-react';
import { VideoPlayerState } from '../../hooks/useVideoPlayer';
import { useAppStore } from '../../store/useAppStore';

interface VideoControlsProps {
  playerState: VideoPlayerState;
  onTogglePlay: () => void;
  onReplay: () => void;
  onToggleMute: () => void;
  onSetVolume: (volume: number) => void;
  onSeek: (time: number) => void;
  onSetPlaybackRate: (rate: number) => void;
  onToggleFullscreen: () => void;
  onShowFeedback: (type: string, text?: string) => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  playerState,
  onTogglePlay,
  onReplay,
  onToggleMute,
  onSetVolume,
  onSeek,
  onSetPlaybackRate,
  onToggleFullscreen,
  onShowFeedback,
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const wasPlayingRef = useRef(false);
  
  const { isPlaying, currentTime, duration, isMuted, volume, playbackRate } = playerState;
  const { targetLang, showSettings, toggleSettings } = useAppStore();

  const displayTime = isScrubbing && scrubTime !== null ? scrubTime : currentTime;

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeekStart = () => {
    setIsScrubbing(true);
    wasPlayingRef.current = isPlaying;
    if (isPlaying) {
      onTogglePlay();
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setScrubTime(val);
    onSeek(val);
  };

  const handleSeekEnd = () => {
    setIsScrubbing(false);
    setScrubTime(null);
    if (wasPlayingRef.current && !isPlaying) {
      onTogglePlay();
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 relative">
      {/* Modern Progress Bar */}
      <div className="group/progress relative h-1.5 w-full cursor-pointer touch-none flex items-center">
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={displayTime}
          onChange={handleSeekChange}
          onMouseDown={handleSeekStart}
          onMouseUp={handleSeekEnd}
          onTouchStart={handleSeekStart}
          onTouchEnd={handleSeekEnd}
          className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
        />
        {/* Track Background */}
        <div className="absolute inset-0 bg-white/20 rounded-full group-hover/progress:h-2 transition-all duration-200"></div>
        {/* Filled Track */}
        <div 
          className="absolute left-0 top-0 bottom-0 bg-indigo-500 rounded-full group-hover/progress:h-2 transition-all duration-200"
          style={{ width: `${(displayTime / (duration || 1)) * 100}%` }}
        ></div>
        {/* Thumb (Visible on hover) */}
        <div 
          className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover/progress:scale-100 transition-transform duration-200 pointer-events-none"
          style={{ left: `${(displayTime / (duration || 1)) * 100}%`, transform: `translate(-50%, 0) scale(${showSpeedMenu ? 0 : 1})` }} // Hide when menu open to avoid z-index issues
        ></div>
      </div>
      
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-4 text-white">
          <button 
            onClick={(e) => { e.stopPropagation(); onSeek(Math.max(0, currentTime - 5)); onShowFeedback('rewind', '-5s'); }}
            className="hover:text-indigo-400 transition-colors p-1 rounded-lg hover:bg-white/10"
            title="Rewind 5s (Left Arrow)"
          >
            <Rewind size={20} fill="currentColor" />
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); onTogglePlay(); onShowFeedback(isPlaying ? 'pause' : 'play'); }} 
            className="hover:text-indigo-400 transition-colors p-1 rounded-lg hover:bg-white/10 mx-[-0.5rem]"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); onSeek(Math.min(duration || 0, currentTime + 5)); onShowFeedback('forward', '+5s'); }}
            className="hover:text-indigo-400 transition-colors p-1 rounded-lg hover:bg-white/10"
            title="Forward 5s (Right Arrow)"
          >
            <FastForward size={20} fill="currentColor" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onReplay(); onShowFeedback('play'); }} 
            className="hover:text-indigo-400 transition-colors p-1 rounded-lg hover:bg-white/10"
            title="Replay Video"
          >
            <RotateCcw size={20} />
          </button>

          {/* Volume Control Group */}
          <div className="flex items-center gap-2 group/vol relative">
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleMute(); onShowFeedback(isMuted ? 'unmute' : 'mute', isMuted ? 'Unmuted' : 'Muted'); }} 
              className="hover:text-indigo-400 transition-colors p-1 rounded-lg hover:bg-white/10 z-10"
              title={isMuted ? "Unmute" : "Mute"}
            >
               {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            
            {/* Volume Slider (Reveals on hover) */}
            <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300 ease-out flex items-center">
               <div className="w-20 h-1.5 bg-white/20 rounded-full relative ml-2 cursor-pointer">
                 <input
                   type="range"
                   min="0"
                   max="1"
                   step="0.05"
                   value={isMuted ? 0 : volume}
                   onChange={(e) => onSetVolume(parseFloat(e.target.value))}
                   className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                 />
                 <div 
                   className="absolute left-0 top-0 bottom-0 bg-white rounded-full"
                   style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                 ></div>
               </div>
            </div>
          </div>

          <span className="text-sm font-medium font-mono text-slate-300 select-none">
            {formatTime(displayTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="text-white flex items-center gap-3">
           {/* Playback Speed Control */}
           <div className="relative">
             <button 
               onClick={() => setShowSpeedMenu(!showSpeedMenu)}
               className="text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/10 px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white transition-all min-w-[3.5rem]"
               title="Playback Speed"
             >
               {playbackRate}x
             </button>
             
             {showSpeedMenu && (
               <>
                 {/* Backdrop to close menu when clicking outside */}
                 <div 
                   className="fixed inset-0 z-40" 
                   onClick={() => setShowSpeedMenu(false)}
                 ></div>
                 
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[100px] p-1 animate-in fade-in zoom-in-95 duration-150">
                   {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                     <button
                       key={rate}
                       onClick={() => {
                         onSetPlaybackRate(rate);
                         setShowSpeedMenu(false);
                         onShowFeedback('forward', `${rate}x Speed`);
                       }}
                       className={`block w-full px-3 py-2 text-xs text-left rounded-lg transition-colors ${playbackRate === rate ? 'bg-indigo-500 text-white font-bold' : 'text-slate-300 hover:bg-white/10'}`}
                     >
                       {rate}x
                     </button>
                   ))}
                 </div>
               </>
             )}
           </div>

           <div className="h-6 w-px bg-white/10 mx-1"></div>

           <button 
             onClick={toggleSettings} 
             className={`hover:text-indigo-400 transition-colors p-1.5 rounded-lg hover:bg-white/10 ${showSettings ? 'text-indigo-400 bg-white/10' : ''}`}
             title="Subtitle Settings"
           >
             <Settings size={20} />
           </button>
           
           <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
             <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
               {targetLang}
             </span>
           </div>

           <button 
             onClick={onToggleFullscreen} 
             className="hover:text-indigo-400 transition-colors p-1.5 rounded-lg hover:bg-white/10"
             title="Fullscreen"
           >
             <Maximize size={20} />
           </button>
        </div>
      </div>
    </div>
  );
};
