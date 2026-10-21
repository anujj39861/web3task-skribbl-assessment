import React from 'react';
import { socket } from '../../socket';
import { Undo2, Trash2, Eraser, Paintbrush } from 'lucide-react';

interface DrawingToolbarProps {
  color: string;
  setColor: (color: string) => void;
  size: number;
  setSize: (size: number) => void;
  isEraser: boolean;
  setIsEraser: (eraser: boolean) => void;
}

// color palette - tried to pick colors that actually look good for drawing
// TODO: maybe let users add custom colors with a color picker?
const PALETTE = [
  '#000000', // Black
  '#4a5568', // Dark Gray
  '#a0aec0', // Light Gray
  '#ffffff', // White
  '#e53e3e', // Red
  '#dd6b20', // Orange
  '#d69e2e', // Yellow
  '#38a169', // Green
  '#319795', // Teal
  '#3182ce', // Blue
  '#805ad5', // Purple
  '#d53f8c', // Pink
  '#8b5a2b', // Brown
  '#00ffff', // Cyan
  '#00ff00', // Lime
  '#ff1493'  // Deep Pink
];

// brush sizes - the value is normalized (0-1 range) relative to canvas dimensions
const SIZES = [
  { label: 'S', value: 0.005, px: 'w-2 h-2' },
  { label: 'M', value: 0.010, px: 'w-3 h-3' },
  { label: 'L', value: 0.018, px: 'w-4 h-4' },
  { label: 'XL', value: 0.028, px: 'w-5 h-5' }
];

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  color,
  setColor,
  size,
  setSize,
  isEraser,
  setIsEraser
}) => {
  const handleUndo = () => {
    socket.emit('draw_undo');
  };

  // confirmation dialog so people don't accidentally nuke their drawing lol
  const handleClear = () => {
    if (window.confirm('Clear the entire canvas?')) {
      socket.emit('canvas_clear');
    }
  };

  return (
    <div className="bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg select-none">
      {/* Color Palette */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {PALETTE.map(c => (
          <button
            key={c}
            onClick={() => {
              setColor(c);
              setIsEraser(false); // switch back to brush when picking a color
            }}
            style={{ backgroundColor: c }}
            className={`w-6 h-6 rounded-full border-2 transition-transform transform hover:scale-110 ${
              color === c && !isEraser
                ? 'border-indigo-400 scale-110 ring-2 ring-indigo-400/50'
                : 'border-slate-600'
            }`}
            title={c}
          />
        ))}
      </div>

      {/* Brush Sizes - using circles that visually represent the size */}
      <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700">
        <span className="text-xs text-slate-400 font-medium">Size:</span>
        {SIZES.map(s => (
          <button
            key={s.label}
            onClick={() => setSize(s.value)}
            className={`p-1.5 rounded-md flex items-center justify-center transition-all ${
              size === s.value
                ? 'bg-indigo-600 text-white'
                : 'hover:bg-slate-700 text-slate-400'
            }`}
            title={`Size: ${s.label}`}
          >
            <div className={`${s.px} rounded-full bg-current`} />
          </button>
        ))}
      </div>

      {/* Tools: Eraser, Undo, Clear */}
      <div className="flex items-center gap-2">
        {/* toggle between eraser and brush mode */}
        <button
          onClick={() => setIsEraser(!isEraser)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            isEraser
              ? 'bg-pink-600 border-pink-500 text-white shadow-md'
              : 'bg-slate-700/60 border-slate-600 text-slate-300 hover:bg-slate-700'
          }`}
          title="Eraser tool"
        >
          {isEraser ? <Paintbrush size={15} /> : <Eraser size={15} />}
          <span>{isEraser ? 'Draw' : 'Eraser'}</span>
        </button>

        <button
          onClick={handleUndo}
          className="p-2 bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-600 transition-all active:scale-95"
          title="Undo last stroke"
        >
          <Undo2 size={16} />
        </button>

        <button
          onClick={handleClear}
          className="p-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 hover:text-rose-100 rounded-lg border border-rose-500/30 transition-all active:scale-95"
          title="Clear entire canvas"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
