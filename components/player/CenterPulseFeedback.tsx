import React from 'react';
import { Play, Pause, FastForward, Rewind, Volume2, VolumeX, Volume1 } from 'lucide-react';

export interface CenterActionType {
  type: string;
  id: number;
  text?: string;
}

interface CenterPulseFeedbackProps {
  action: CenterActionType | null;
}

export const CenterPulseFeedback: React.FC<CenterPulseFeedbackProps> = ({ action }) => {
  if (!action) return null;

  return (
    <>
      <style>{`
        @keyframes centerPulse {
          0% { opacity: 0; transform: scale(0.5); }
          20% { opacity: 1; transform: scale(1.1); }
          40% { transform: scale(1); }
          70% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.2); }
        }
        .animate-center-pulse {
          animation: centerPulse 0.6s ease-out forwards;
        }
      `}</style>
      <div key={action.id} className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
        <div className="bg-black/50 backdrop-blur-sm text-white p-6 rounded-3xl min-w-[120px] aspect-square flex flex-col justify-center items-center gap-2 animate-center-pulse">
          {action.type === 'play' && <Play size={48} fill="currentColor" />}
          {action.type === 'pause' && <Pause size={48} fill="currentColor" />}
          {action.type === 'forward' && <FastForward size={48} fill="currentColor" />}
          {action.type === 'rewind' && <Rewind size={48} fill="currentColor" />}
          {action.type === 'vol-up' && <Volume2 size={48} />}
          {action.type === 'vol-down' && <Volume1 size={48} />}
          {action.type === 'mute' && <VolumeX size={48} />}
          {action.type === 'unmute' && <Volume2 size={48} />}
          {action.text && <span className="text-xl font-bold tracking-widest">{action.text}</span>}
        </div>
      </div>
    </>
  );
};
