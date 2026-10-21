import React, { useRef, useEffect, useState, useCallback } from 'react';
import { socket } from '../../socket';
import { DrawPoint, DrawStroke } from '../../shared/types';
import { useGame } from '../../context/GameContext';

interface CanvasProps {
  color: string;
  size: number;
  isEraser: boolean;
}

export const Canvas: React.FC<CanvasProps> = ({ color, size, isEraser }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isDrawer, gameState } = useGame();
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<DrawPoint | null>(null);
  const currentRemoteStrokeRef = useRef<{ lastPoint: DrawPoint | null }>({ lastPoint: null });

  // normalize mouse/touch coordinates to 0-1 range so it works across different screen sizes
  // had to use the native event here because React wraps the event and getBoundingClientRect
  // needs the actual DOM coordinates
  const getNormalizedPoint = useCallback((e: MouseEvent | TouchEvent): DrawPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    // handle both touch and mouse events
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return null;
    }

    // clamp to 0-1 range so we don't draw outside the canvas
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    return { x, y };
  }, []);

  // draw a line segment between two points on the canvas
  const drawSegment = useCallback(
    (
      from: DrawPoint,
      to: DrawPoint,
      strokeColor: string,
      strokeSize: number,
      eraser: boolean = false
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // convert normalized coords back to actual pixel positions
      const x0 = from.x * canvas.width;
      const y0 = from.y * canvas.height;
      const x1 = to.x * canvas.width;
      const y1 = to.y * canvas.height;

      ctx.save();
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = strokeSize * Math.min(canvas.width, canvas.height);

      if (eraser) {
        ctx.strokeStyle = '#ffffff'; // just draw white - same as canvas bg
      } else {
        ctx.strokeStyle = strokeColor;
      }

      // the quadraticCurveTo makes lines way smoother than plain lineTo
      // uses the midpoint trick I found on stackoverflow
      const midX = (x0 + x1) / 2;
      const midY = (y0 + y1) / 2;
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(x0, y0, midX, midY);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.restore();
    },
    []
  );

  // redraw everything from scratch - needed for undo and when someone joins mid-game
  const redrawAll = useCallback(
    (strokes: DrawStroke[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // clear to white first
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // replay all strokes
      for (const stroke of strokes) {
        for (let i = 1; i < stroke.points.length; i++) {
          drawSegment(
            stroke.points[i - 1],
            stroke.points[i],
            stroke.color,
            stroke.size,
            stroke.isEraser
          );
        }
      }
    },
    [drawSegment]
  );

  // resize canvas to fill its container while keeping crisp rendering
  // using ResizeObserver instead of window resize event because it's more reliable
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      // only resize if dimensions actually changed (avoids clearing the canvas unnecessarily)
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;

        // fill with white after resize since canvas clears on dimension change
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    return () => observer.disconnect();
  }, []);

  // listen for drawing events from other players (the remote drawer)
  useEffect(() => {
    let remoteStrokeColor = '#000000';
    let remoteStrokeSize = 0.008;
    let remoteIsEraser = false;

    const handleRemoteStart = (data: {
      x: number;
      y: number;
      color: string;
      size: number;
      isEraser?: boolean;
    }) => {
      remoteStrokeColor = data.color;
      remoteStrokeSize = data.size;
      remoteIsEraser = Boolean(data.isEraser);
      currentRemoteStrokeRef.current.lastPoint = { x: data.x, y: data.y };
    };

    const handleRemoteMove = (data: { x: number; y: number }) => {
      const prev = currentRemoteStrokeRef.current.lastPoint;
      const curr = { x: data.x, y: data.y };
      if (prev) {
        drawSegment(prev, curr, remoteStrokeColor, remoteStrokeSize, remoteIsEraser);
      }
      currentRemoteStrokeRef.current.lastPoint = curr;
    };

    const handleRemoteEnd = () => {
      currentRemoteStrokeRef.current.lastPoint = null;
    };

    const handleClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      // console.log('[Canvas] canvas cleared by remote');
    };

    const handleUndo = (data: { strokes: DrawStroke[] }) => {
      redrawAll(data.strokes);
    };

    // sync_all fires when you join mid-round so you see what's already drawn
    const handleSyncAll = (data: { strokes: DrawStroke[] }) => {
      console.log('[Canvas] syncing all strokes, count:', data.strokes.length);
      redrawAll(data.strokes);
    };

    socket.on('draw_start', handleRemoteStart);
    socket.on('draw_move', handleRemoteMove);
    socket.on('draw_end', handleRemoteEnd);
    socket.on('canvas_clear', handleClear);
    socket.on('draw_undo', handleUndo);
    socket.on('draw_sync_all', handleSyncAll);

    return () => {
      socket.off('draw_start', handleRemoteStart);
      socket.off('draw_move', handleRemoteMove);
      socket.off('draw_end', handleRemoteEnd);
      socket.off('canvas_clear', handleClear);
      socket.off('draw_undo', handleUndo);
      socket.off('draw_sync_all', handleSyncAll);
    };
  }, [drawSegment, redrawAll]);

  // --- Local drawing handlers ---
  // had to use e.nativeEvent here because React wraps the event
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || gameState?.phase !== 'DRAWING') return;

    const point = getNormalizedPoint(e.nativeEvent);
    if (!point) return;

    setIsDrawing(true);
    lastPointRef.current = point;

    // tell the server (and other players) we started drawing
    socket.emit('draw_start', {
      x: point.x,
      y: point.y,
      color,
      size,
      isEraser
    });
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawer || gameState?.phase !== 'DRAWING') return;

    const point = getNormalizedPoint(e.nativeEvent);
    if (!point || !lastPointRef.current) return;

    // draw locally immediately for responsiveness
    drawSegment(lastPointRef.current, point, color, size, isEraser);

    // then broadcast to other players
    socket.emit('draw_move', {
      x: point.x,
      y: point.y
    });

    lastPointRef.current = point;
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;
    socket.emit('draw_end');
  };

  // TODO: add pinch-to-zoom support for mobile?

  return (
    <div className="relative w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-slate-700/60 touch-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        className={`w-full h-full block ${
          isDrawer && gameState?.phase === 'DRAWING'
            ? 'cursor-crosshair'
            : 'cursor-default'
        }`}
      />

      {/* overlay when drawer is picking a word - dims the canvas */}
      {gameState?.phase === 'WORD_SELECTION' && (
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="animate-bounce mb-3 text-4xl">🤔</div>
          <h3 className="text-xl font-bold font-game text-white mb-1">
            {isDrawer ? 'Pick a secret word to draw!' : `${gameState.drawerName || 'Drawer'} is choosing a word...`}
          </h3>
          <p className="text-sm text-slate-300">Get ready to guess or draw!</p>
        </div>
      )}
    </div>
  );
};
