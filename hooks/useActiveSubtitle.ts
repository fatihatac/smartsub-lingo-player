import { useMemo } from 'react';
import { SubtitleCue } from '../types';

export const useActiveSubtitle = (
  currentTime: number,
  subtitles: SubtitleCue[],
  secondarySubtitles: SubtitleCue[],
  offset: number,
  showSecondary: boolean,
  showSettings: boolean
) => {
  const currentCue = useMemo(() => {
    const time = currentTime;
    
    let left = 0;
    let right = subtitles.length - 1;
    let found = null;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const cue = subtitles[mid];
      const start = cue.startTime + offset;
      const end = cue.endTime + offset;
      
      if (time >= start && time <= end) {
        found = cue;
        break;
      } else if (time < start) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    if (!found && showSettings) {
      return {
        id: 'preview-dummy',
        startTime: 0,
        endTime: 9999,
        text: 'This is a live subtitle preview.'
      };
    }
    
    return found;
  }, [currentTime, subtitles, offset, showSettings]);

  const secondaryCue = useMemo(() => {
    if (showSecondary === false) return null;
    
    const time = currentTime;

    let left = 0;
    let right = secondarySubtitles.length - 1;
    let found = null;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const cue = secondarySubtitles[mid];
      const start = cue.startTime + offset;
      const end = cue.endTime + offset;
      
      if (time >= start && time <= end) {
        found = cue;
        break;
      } else if (time < start) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    if (!found && showSettings && (secondarySubtitles.length > 0 || subtitles.length > 0)) {
       return {
         id: 'sec-preview-dummy',
         startTime: 0,
         endTime: 9999,
         text: 'Bu bir canlı altyazı önizlemesidir.'
       };
    }

    return found;
  }, [currentTime, secondarySubtitles, offset, showSecondary, showSettings, subtitles.length]);

  return { currentCue, secondaryCue };
};
