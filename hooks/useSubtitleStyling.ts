import React, { useMemo } from 'react';
import { SubtitleSettings } from '../types';

export const useSubtitleStyling = (settings: SubtitleSettings) => {
  return useMemo(() => {
    const hex = settings.backgroundColor;
    let r = 0, g = 0, b = 0;
    
    if (hex.startsWith('#')) {
      if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
      } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
      }
    }
    
    const bgColor = `rgba(${r}, ${g}, ${b}, ${settings.backgroundOpacity})`;

    return {
      '--subtitle-bg-color': bgColor,
      '--subtitle-backdrop-filter': settings.backgroundOpacity > 0 ? 'blur(12px)' : 'none',
      '--subtitle-font-size': `${settings.fontSize}px`,
      '--subtitle-text-color': settings.textColor,
      backgroundColor: 'var(--subtitle-bg-color)',
      backdropFilter: 'var(--subtitle-backdrop-filter)',
    } as React.CSSProperties;
  }, [
    settings.backgroundColor,
    settings.backgroundOpacity,
    settings.verticalPosition,
    settings.fontSize,
    settings.textColor
  ]);
};
