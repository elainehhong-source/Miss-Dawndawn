import React from 'react';
import { 
  Hand, 
  Brush, 
  Undo, 
  RotateCcw, 
  ImagePlus, 
  Eraser, 
  ZoomIn, 
  Download 
} from 'lucide-react';
import { ToolMode } from '../types';

interface ToolbarProps {
  mode: ToolMode;
  setMode: (mode: ToolMode) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  onUndo: () => void;
  onResetStrokes: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  canUndo: boolean;
  hasStrokes: boolean;
  onProcess: () => void;
  isProcessing: boolean;
  hasImage: boolean;
  onDownload: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  mode,
  setMode,
  brushSize,
  setBrushSize,
  onUndo,
  onResetStrokes,
  onUpload,
  canUndo,
  hasStrokes,
  onProcess,
  isProcessing,
  hasImage,
  onDownload
}) => {
  return (
    <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col h-full shrink-0 z-20 shadow-xl">
      <div className="p-4 border-b border-neutral-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          AI 实战派
        </h1>
        <p className="text-xs text-neutral-400 mt-1">智能去水印 V1.0</p>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        
        {/* Upload Section */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            源文件
          </label>
          <label className="flex items-center justify-center w-full h-12 px-4 transition bg-neutral-800 border-2 border-dashed border-neutral-700 rounded-lg hover:border-neutral-500 hover:bg-neutral-750 cursor-pointer group">
            <div className="flex items-center space-x-2 text-neutral-400 group-hover:text-white">
              <ImagePlus size={18} />
              <span className="text-sm font-medium">上传图片</span>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={onUpload}
            />
          </label>
        </div>

        {hasImage && (
          <>
            {/* Tools Section */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                工具箱
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode(ToolMode.BRUSH)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                    mode === ToolMode.BRUSH
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-750'
                  }`}
                >
                  <Brush size={20} className="mb-1" />
                  <span className="text-xs">涂抹画笔</span>
                </button>
                <button
                  onClick={() => setMode(ToolMode.HAND)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                    mode === ToolMode.HAND
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-750'
                  }`}
                >
                  <Hand size={20} className="mb-1" />
                  <span className="text-xs">抓手移动</span>
                </button>
              </div>
            </div>

            {/* Brush Settings */}
            {mode === ToolMode.BRUSH && (
              <div className="space-y-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-800">
                <div className="flex justify-between items-center text-xs text-neutral-400">
                  <span>画笔大小</span>
                  <span className="font-mono">{brushSize}px</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-center pt-2">
                  <div 
                    className="rounded-full bg-red-500/50 border border-red-400"
                    style={{ width: brushSize, height: brushSize }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
               <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                操作
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="flex items-center justify-center px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  title="撤销 (Ctrl+Z)"
                >
                  <Undo size={16} className="mr-2" />
                  <span className="text-sm">撤销</span>
                </button>
                <button
                  onClick={onResetStrokes}
                  disabled={!hasStrokes}
                  className="flex items-center justify-center px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  title="清空涂抹"
                >
                  <RotateCcw size={16} className="mr-2" />
                  <span className="text-sm">重置</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Action Button */}
      <div className="p-4 border-t border-neutral-800 bg-neutral-900">
        {hasImage ? (
           <div className="space-y-3">
             <button
              onClick={onProcess}
              disabled={isProcessing || !hasStrokes}
              className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all shadow-lg ${
                isProcessing || !hasStrokes
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-900/20'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>处理中...</span>
                </>
              ) : (
                <>
                  <Eraser size={18} />
                  <span>开始去水印</span>
                </>
              )}
            </button>
             <button
              onClick={onDownload}
              disabled={isProcessing}
              className="w-full py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center space-x-2 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition disabled:opacity-50"
            >
              <Download size={16} />
              <span>下载结果</span>
            </button>
           </div>
        ) : (
          <div className="text-center text-sm text-neutral-500 py-2">
            请先上传图片
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
