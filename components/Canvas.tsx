import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ToolMode, Point, Stroke, CanvasState } from '../types';

interface CanvasProps {
  image: HTMLImageElement | null;
  mode: ToolMode;
  brushSize: number;
  strokes: Stroke[];
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
  canvasState: CanvasState;
  setCanvasState: React.Dispatch<React.SetStateAction<CanvasState>>;
}

const Canvas: React.FC<CanvasProps> = ({
  image,
  mode,
  brushSize,
  strokes,
  setStrokes,
  canvasState,
  setCanvasState
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<Point | null>(null);

  // Initial fit image to screen
  useEffect(() => {
    if (image && containerRef.current) {
      const container = containerRef.current;
      const scaleX = (container.clientWidth - 40) / image.width;
      const scaleY = (container.clientHeight - 40) / image.height;
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up initially, only down or 100%
      
      const offsetX = (container.clientWidth - image.width * scale) / 2;
      const offsetY = (container.clientHeight - image.height * scale) / 2;

      setCanvasState({
        scale,
        offset: { x: offsetX, y: offsetY }
      });
    }
  }, [image, setCanvasState]);

  // Coordinate conversion
  const getClientCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): Point => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
  };

  const screenToWorld = useCallback((screenX: number, screenY: number): Point => {
     if (!canvasRef.current) return { x: 0, y: 0 };
     const rect = canvasRef.current.getBoundingClientRect();
     // The canvas element itself is positioned at 0,0 of the container usually, 
     // but we translate the context.
     // However, simpler approach: The mouse coordinates are relative to the viewport.
     // We need to map them relative to the image.
     
     // 1. Get mouse pos relative to canvas DOM element (which is size of container)
     const domX = screenX - rect.left;
     const domY = screenY - rect.top;

     // 2. Subtract offset
     const contentX = domX - canvasState.offset.x;
     const contentY = domY - canvasState.offset.y;

     // 3. Divide by scale
     return {
       x: contentX / canvasState.scale,
       y: contentY / canvasState.scale
     };
  }, [canvasState]);

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Set actual canvas size to match display size
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // CSS size
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Scale context for DPI
    ctx.scale(dpr, dpr);

    // Clear Screen
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (!image) return;

    // --- Start Drawing Content ---
    ctx.save();
    
    // Apply View Transform
    ctx.translate(canvasState.offset.x, canvasState.offset.y);
    ctx.scale(canvasState.scale, canvasState.scale);

    // 1. Draw Original Image
    ctx.drawImage(image, 0, 0);

    // 2. Draw Mask (Strokes)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Create a semi-transparent layer for the red mask
    // We can just draw directly on top with opacity
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#ff0000'; // Red mask
    ctx.fillStyle = '#ff0000';

    strokes.forEach(stroke => {
      if (stroke.points.length === 0) return;

      ctx.lineWidth = stroke.size;
      ctx.beginPath();
      
      if (stroke.points.length === 1) {
        ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        stroke.points.forEach((p, i) => {
          if (i > 0) ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      }
    });

    // Reset alpha
    ctx.globalAlpha = 1.0;
    
    ctx.restore();
    // --- End Drawing Content ---

  }, [image, strokes, canvasState, containerRef]);

  // Event Handlers
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling on touch
    if (!image) return;
    
    const clientPos = getClientCoordinates(e);
    
    if (mode === ToolMode.HAND) {
      setIsDragging(true);
      setLastMousePos(clientPos);
    } else if (mode === ToolMode.BRUSH) {
      setIsDrawing(true);
      const worldPos = screenToWorld(clientPos.x, clientPos.y);
      // Start a new stroke
      setStrokes(prev => [...prev, { points: [worldPos], size: brushSize }]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!image) return;
    
    const clientPos = getClientCoordinates(e);

    if (mode === ToolMode.HAND && isDragging && lastMousePos) {
      const dx = clientPos.x - lastMousePos.x;
      const dy = clientPos.y - lastMousePos.y;
      
      setCanvasState(prev => ({
        ...prev,
        offset: { x: prev.offset.x + dx, y: prev.offset.y + dy }
      }));
      setLastMousePos(clientPos);
    } 
    else if (mode === ToolMode.BRUSH && isDrawing) {
      const worldPos = screenToWorld(clientPos.x, clientPos.y);
      
      // Update the last stroke
      setStrokes(prev => {
        const newStrokes = [...prev];
        const lastStroke = newStrokes[newStrokes.length - 1];
        if (lastStroke) {
          lastStroke.points.push(worldPos);
        }
        return newStrokes;
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDrawing(false);
    setLastMousePos(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!image) return;
    
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newScale = Math.min(Math.max(0.1, canvasState.scale + delta), 5); // Limit zoom 0.1x to 5x
    
    // Zoom towards mouse pointer
    // 1. Calculate world pos of mouse before zoom
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldX = (mouseX - canvasState.offset.x) / canvasState.scale;
    const worldY = (mouseY - canvasState.offset.y) / canvasState.scale;

    // 2. Calculate new offset to keep world pos at same screen pos
    // mouseX = newOffset + worldX * newScale
    // newOffset = mouseX - worldX * newScale
    const newOffsetX = mouseX - worldX * newScale;
    const newOffsetY = mouseY - worldY * newScale;

    setCanvasState({
      scale: newScale,
      offset: { x: newOffsetX, y: newOffsetY }
    });
  };

  return (
    <div 
      ref={containerRef} 
      className={`flex-1 relative overflow-hidden bg-neutral-900 bg-[radial-gradient(#2d2d2d_1px,transparent_1px)] [background-size:16px_16px] ${
        mode === ToolMode.HAND ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
      }`}
    >
      {!image && (
        <div className="absolute inset-0 flex items-center justify-center text-neutral-500 pointer-events-none select-none">
          <div className="text-center">
            <p className="text-lg">暂无图片</p>
            <p className="text-sm opacity-60">请从左侧工具栏上传</p>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        onWheel={handleWheel}
        className="block touch-none"
      />
    </div>
  );
};

export default Canvas;
