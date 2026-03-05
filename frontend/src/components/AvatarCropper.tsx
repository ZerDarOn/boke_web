import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Move, Check, X } from 'lucide-react';

interface AvatarCropperProps {
  image: string; // 图片 URL 或 base64
  onConfirm: (croppedImage: string) => void;
  onCancel: () => void;
  size?: number; // 输出尺寸，默认 200
}

const AvatarCropper: React.FC<AvatarCropperProps> = ({
  image,
  onConfirm,
  onCancel,
  size = 200,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const previewSize = 280;

  // 计算图片在预览区域的尺寸
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      let displayWidth, displayHeight;
      
      if (aspectRatio > 1) {
        displayWidth = previewSize;
        displayHeight = previewSize / aspectRatio;
      } else {
        displayHeight = previewSize;
        displayWidth = previewSize * aspectRatio;
      }
      
      setImageSize({ width: displayWidth, height: displayHeight });
      setImageLoaded(true);
    };
    img.src = image;
  }, [image]);

  // 重置位置和缩放
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // 缩放控制
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));

  // 拖拽控制
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 裁剪并导出图片
  const handleConfirm = () => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 创建圆形裁剪
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 计算源图片的裁剪区域
      const scaledWidth = imageSize.width * scale;
      const scaledHeight = imageSize.height * scale;
      
      // 计算图片中心点相对于预览框的偏移
      const offsetX = previewSize / 2 + position.x;
      const offsetY = previewSize / 2 + position.y;
      
      // 计算在源图片上对应的点
      const srcX = (offsetX - (previewSize - scaledWidth) / 2) / scale;
      const srcY = (offsetY - (previewSize - scaledHeight) / 2) / scale;
      
      // 计算裁剪半径对应的源图片尺寸
      const cropRadius = (previewSize / 2) / scale;
      
      // 绘制裁剪的图片
      ctx.drawImage(
        img,
        srcX - cropRadius,
        srcY - cropRadius,
        cropRadius * 2,
        cropRadius * 2,
        0,
        0,
        size,
        size
      );

      const croppedDataUrl = canvas.toDataURL('image/png');
      onConfirm(croppedDataUrl);
    };
    img.src = image;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">调整图片</h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 预览区域 */}
        <div 
          className="relative mx-auto mb-4 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700"
          style={{ width: previewSize, height: previewSize }}
        >
          {/* 裁剪框指示器 */}
          <div className="absolute inset-0 border-4 border-white/50 rounded-full pointer-events-none z-10" />
          
          {/* 图片 */}
          {imageLoaded && (
            <div
              ref={containerRef}
              className="absolute inset-0 flex items-center justify-center cursor-move"
              onMouseDown={handleMouseDown}
            >
              <img
                src={image}
                alt="Preview"
                draggable={false}
                style={{
                  width: imageSize.width * scale,
                  height: imageSize.height * scale,
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  transition: isDragging ? 'none' : 'transform 0.1s',
                }}
              />
            </div>
          )}

          {/* 加载状态 */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            onClick={handleZoomOut}
            className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            title="缩小"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400 w-16 text-center font-mono">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            title="放大"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            title="重置"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-4">
          <Move size={12} />
          <span>拖拽移动图片位置</span>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Check size={16} />
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarCropper;
