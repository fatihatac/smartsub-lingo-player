import React, { useCallback } from 'react';
import { Settings, X, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { SubtitleSettings } from '../../types';
import { clearCache } from '../../services/translationService';
import { useToast } from '../../hooks/useToast';

interface SubtitleSettingsPanelProps {
  onClose: () => void;
}

export const SubtitleSettingsPanel: React.FC<SubtitleSettingsPanelProps> = ({
  onClose,
}) => {
  const { subtitleSettings, updateSubtitleSettings, showSettings } = useAppStore();
  const { toast, showToast } = useToast(3000);

  const handleClearCache = useCallback(() => {
    try {
      clearCache();
      showToast('Cache cleared', 'success');
    } catch {
      showToast('Failed to clear cache', 'error');
    }
  }, [showToast]);

  if (!showSettings) return null;

  const handleChange = (key: keyof SubtitleSettings, value: string | number) => {
    updateSubtitleSettings({ [key]: value });
  };

  return (
    <div className="absolute top-16 right-4 z-50 bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-2xl w-72 text-sm text-slate-200 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Settings size={16} /> Appearance
        </h3>
        <button onClick={onClose} className="hover:text-white transition-colors" aria-label="Close settings">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Toggle Secondary Subtitle */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-700">
          <label className="text-xs font-semibold text-white/90">Show Target Subtitle</label>
          <div 
            onClick={() => updateSubtitleSettings({ showSecondarySubtitle: !subtitleSettings.showSecondarySubtitle })}
            className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${subtitleSettings.showSecondarySubtitle !== false ? 'bg-indigo-500' : 'bg-slate-600'}`}
            role="switch"
            aria-checked={subtitleSettings.showSecondarySubtitle !== false}
            aria-label="Show target subtitle"
            tabIndex={0}
          >
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${subtitleSettings.showSecondarySubtitle !== false ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </div>

        {/* Font Size */}
        <div>
          <label className="block mb-1 text-xs uppercase tracking-wide text-slate-400">Font Size ({subtitleSettings.fontSize}px)</label>
          <input
            type="range"
            min="12"
            max="48"
            value={subtitleSettings.fontSize}
            onChange={(e) => handleChange('fontSize', Number(e.target.value))}
            className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500"
            aria-label="Font size"
          />
        </div>

        {/* Vertical Position */}
        <div>
          <label className="block mb-1 text-xs uppercase tracking-wide text-slate-400">Bottom Offset ({subtitleSettings.verticalPosition}%)</label>
          <input
            type="range"
            min="0"
            max="50"
            value={subtitleSettings.verticalPosition}
            onChange={(e) => handleChange('verticalPosition', Number(e.target.value))}
            className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500"
            aria-label="Bottom offset"
          />
        </div>

        {/* Text Color */}
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-wide text-slate-400">Text Color</label>
          <input
            type="color"
            value={subtitleSettings.textColor}
            onChange={(e) => handleChange('textColor', e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
          />
        </div>

        {/* Background Color */}
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-wide text-slate-400">Background Color</label>
          <input
            type="color"
            value={subtitleSettings.backgroundColor}
            onChange={(e) => handleChange('backgroundColor', e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
          />
        </div>

        {/* Background Opacity */}
        <div>
           <label className="block mb-1 text-xs uppercase tracking-wide text-slate-400">Background Opacity</label>
           <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={subtitleSettings.backgroundOpacity}
            onChange={(e) => handleChange('backgroundOpacity', Number(e.target.value))}
            className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500"
            aria-label="Background opacity"
          />
        </div>

        {/* Subtitle Sync */}
        <div className="pt-4 border-t border-slate-700">
          <label className="block mb-2 text-xs uppercase tracking-wide text-slate-400">Subtitle Sync (±5s)</label>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleChange('subtitleOffset', Math.max(-5, (subtitleSettings.subtitleOffset || 0) - 0.5))}
              className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
              aria-label="Decrease subtitle offset"
            >
              -
            </button>
            <div className="flex-1 text-center font-mono text-sm">
              {(subtitleSettings.subtitleOffset || 0) > 0 ? '+' : ''}{(subtitleSettings.subtitleOffset || 0).toFixed(1)}s
            </div>
            <button 
              onClick={() => handleChange('subtitleOffset', Math.min(5, (subtitleSettings.subtitleOffset || 0) + 0.5))}
              className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
              aria-label="Increase subtitle offset"
            >
              +
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 text-center">
            Negative = Earlier, Positive = Later
          </p>
        </div>

        {/* Clear Translation Cache */}
        <div className="pt-4 border-t border-slate-700">
          <button
            onClick={handleClearCache}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors w-full justify-center py-1.5 rounded hover:bg-red-400/10"
            aria-label="Clear translation cache"
          >
            <Trash2 size={14} />
            Clear translation cache
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          className={`absolute -bottom-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-300 whitespace-nowrap text-white ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};
