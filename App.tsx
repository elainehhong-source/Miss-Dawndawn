import React, { useState, useEffect, useCallback } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import { ToolMode, Stroke, CanvasState } from './types';
import { loadImage, readFileAsDataURL, generateMaskImage } from './utils/canvasUtils';
import { removeWatermark } from './services/geminiService';

function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [originalFileBase64, setOriginalFileBase64] = useState<string>('');
  
  const [mode, setMode] = useState<ToolMode>(ToolMode.BRUSH);
  const [brushSize, setBrushSize] = useState(20);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  
  const [canvasState, setCanvasState] = useState<CanvasState>({
    scale: 1,
    offset: { x: 0, y: 0 }
  });

  const [isProcessing, setIsProcessing] = useState(false);
  
  // History management
  const handleUndo = useCallback(() => {
    setStrokes(prev => prev.slice(0, prev.length - 1));
  }, []);

  const handleResetStrokes = useCallback(() => {
    setStrokes([]);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = e.target.files[0];
        const base64 = await readFileAsDataURL(file);
        const img = await loadImage(base64);
        
        setImage(img);
        setOriginalFileBase64(base64);
        setStrokes([]); // Clear strokes for new image
        // Canvas component handles centering via useEffect dependency on image
      } catch (err) {
        console.error("Failed to load image", err);
        alert("图片加载失败，请重试");
      }
    }
  };

  const handleProcess = async () => {
    if (!image || strokes.length === 0) return;

    setIsProcessing(true);
    try {
      // 1. Generate Mask
      const maskBase64 = generateMaskImage(image.width, image.height, strokes);
      
      // 2. Call Gemini API
      const resultBase64 = await removeWatermark(originalFileBase64, maskBase64);
      
      // 3. Update Image with Result
      const newImg = await loadImage(resultBase64);
      setImage(newImg);
      setOriginalFileBase64(resultBase64); // Update current working base64
      setStrokes([]); // Clear strokes after successful process
      
    } catch (error) {
      console.error(error);
      alert("去水印失败，请检查 API Key 或网络连接。");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!image) return;
    
    // Create a temporary link to download the current image
    // Note: We use originalFileBase64 because 'image' source might be blob or dataURL
    const link = document.createElement('a');
    link.download = `watermark-removed-${Date.now()}.png`;
    link.href = originalFileBase64; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (strokes.length > 0) handleUndo();
      }
      if (e.code === 'Space') {
        // Temporary hand tool? Can be complex, sticking to simple toggle for V1
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [strokes.length, handleUndo]);

  return (
    <div className="flex h-screen w-screen bg-neutral-900 text-white overflow-hidden">
      <Toolbar 
        mode={mode}
        setMode={setMode}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        onUndo={handleUndo}
        onResetStrokes={handleResetStrokes}
        onUpload={handleUpload}
        canUndo={strokes.length > 0}
        hasStrokes={strokes.length > 0}
        onProcess={handleProcess}
        isProcessing={isProcessing}
        hasImage={!!image}
        onDownload={handleDownload}
      />
      
      <main className="flex-1 flex flex-col h-full relative">
        <Canvas 
          image={image}
          mode={mode}
          brushSize={brushSize}
          strokes={strokes}
          setStrokes={setStrokes}
          canvasState={canvasState}
          setCanvasState={setCanvasState}
        />
        
        {/* Info Overlay */}
        <div className="absolute bottom-4 right-4 pointer-events-none">
           <div className="bg-black/60 backdrop-blur-sm text-neutral-400 text-xs px-3 py-1.5 rounded-full border border-white/10">
              {image ? `${image.width} x ${image.height}px | Zoom: ${(canvasState.scale * 100).toFixed(0)}%` : 'Ready'}
           </div>
        </div>
      </main>
    </div>
  );
}

export default App;
