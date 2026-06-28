import { SubtitleCue } from '../types';

let _cueIdCounter = 0;
const nextCueId = (): string => `cue-${++_cueIdCounter}`;

/**
 * Converts a timestamp string to seconds.
 * Supports formats: HH:MM:SS,mmm (SRT) and MM:SS.mmm (VTT simplified)
 */
const parseTimestamp = (timestamp: string): number => {
  const parts = timestamp.replace(',', '.').split(':');
  let seconds = 0;
  
  if (parts.length === 3) {
    seconds += parseInt(parts[0], 10) * 3600;
    seconds += parseInt(parts[1], 10) * 60;
    seconds += parseFloat(parts[2]);
  } else if (parts.length === 2) {
    seconds += parseInt(parts[0], 10) * 60;
    seconds += parseFloat(parts[1]);
  }
  
  return seconds;
};

export const parseSubtitles = (content: string): SubtitleCue[] => {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const cues: SubtitleCue[] = [];
  
  let currentCue: Partial<SubtitleCue> | null = null;
  let textBuffer: string[] = [];

  // Regex to identify time range lines: 00:00:20,000 --> 00:00:24,400
  const timeRegex = /(\d{1,2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{3})/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      // Empty line usually indicates end of a cue block
      if (currentCue && currentCue.startTime !== undefined && currentCue.endTime !== undefined) {
        cues.push({
          id: nextCueId(),
          startTime: currentCue.startTime,
          endTime: currentCue.endTime,
          text: textBuffer.join(' '), // Combine multi-line text
        });
        currentCue = null;
        textBuffer = [];
      }
      continue;
    }

    // Skip WEBVTT header or numeric IDs
    if (line === 'WEBVTT' || /^\d+$/.test(line)) {
      continue;
    }

    const timeMatch = line.match(timeRegex);
    if (timeMatch) {
      // If we found a new time block but hadn't finished the previous one (rare edge case), push it
      if (currentCue && currentCue.startTime !== undefined) {
         cues.push({
          id: nextCueId(),
          startTime: currentCue.startTime!,
          endTime: currentCue.endTime!,
          text: textBuffer.join(' '),
        });
        textBuffer = [];
      }

      currentCue = {
        startTime: parseTimestamp(timeMatch[1]),
        endTime: parseTimestamp(timeMatch[2]),
      };
    } else if (currentCue) {
      // This is text content
      // Remove HTML tags often found in subtitles like <i>, <b>, <font>
      const cleanText = line.replace(/<[^>]*>/g, '');
      textBuffer.push(cleanText);
    }
  }

  // Flush last cue
  if (currentCue && currentCue.startTime !== undefined && textBuffer.length > 0) {
    cues.push({
      id: nextCueId(),
      startTime: currentCue.startTime,
      endTime: currentCue.endTime!,
      text: textBuffer.join(' '),
    });
  }

  return cues;
};
