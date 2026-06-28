import React from 'react';
import { Bookmark, X, Trash2, Clock } from 'lucide-react';
import { Bookmark as BookmarkType } from '../../types';

interface BookmarkListProps {
  bookmarks: BookmarkType[];
  onJumpTo: (timestamp: number) => void;
  onDelete: (cueId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const truncateText = (text: string, maxLen: number = 50): string =>
  text.length > maxLen ? text.slice(0, maxLen) + '...' : text;

export const BookmarkList: React.FC<BookmarkListProps> = ({
  bookmarks,
  onJumpTo,
  onDelete,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-4 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-80 text-sm text-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[60vh]">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-700 shrink-0">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Bookmark size={16} className="text-amber-400" /> Bookmarks
        </h3>
        <button
          onClick={onClose}
          className="hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          aria-label="Close bookmarks"
        >
          <X size={16} />
        </button>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 min-h-0">
        {bookmarks.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-500">
            <Bookmark size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs">No bookmarks saved yet</p>
            <p className="text-[10px] mt-1 text-slate-600">
              Hover a subtitle and click the bookmark icon
            </p>
          </div>
        ) : (
          <ul className="py-1">
            {bookmarks.map((bm) => (
              <li
                key={bm.cueId}
                className="flex items-start gap-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors group/item"
                onClick={() => onJumpTo(bm.timestamp)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onJumpTo(bm.timestamp);
                  }
                }}
              >
                <Bookmark size={14} className="text-amber-400 fill-amber-400 mt-0.5 shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-xs leading-snug truncate">
                    {truncateText(bm.cueText)}
                  </p>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                    <Clock size={10} />
                    {formatTime(bm.timestamp)}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(bm.cueId);
                  }}
                  className="opacity-0 group-hover/item:opacity-100 p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all shrink-0"
                  aria-label={`Delete bookmark at ${formatTime(bm.timestamp)}`}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
