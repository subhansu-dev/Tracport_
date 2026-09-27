import React, { useState, useRef, useEffect } from 'react';
import { MapPin, X, RotateCw, Crop as CropIcon, Sparkles, Check, RefreshCw, Undo2 } from 'lucide-react';
import { GeotagInfo, rotateImage90, enhanceImageWithAI, cropImageFree, stampGeotagOnImage } from '../utils/imageProcessing';

interface PhotoEditorDialogProps {
  isOpen: boolean;
  initialImageUrl: string;
  geotag: GeotagInfo;
  onClose: () => void;
  onRetake: () => void;
  onSelect: (finalImageUrl: string, geotag: GeotagInfo) => void;
}

export const PhotoEditorDialog: React.FC<PhotoEditorDialogProps> = ({
  isOpen,
  initialImageUrl,
  geotag,
  onClose,
  onRetake,
  onSelect,
}) => {
  const [currentImage, setCurrentImage] = useState<string>(initialImageUrl);
  const [originalImage] = useState<string>(initialImageUrl);
  const [isAiEnhanced, setIsAiEnhanced] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Free Crop State
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0.05,
    y: 0.05,
    width: 0.9,
    height: 0.9,
  });

  const imgRef = useRef<HTMLImageElement | null>(null);
  const cropContainerRef = useRef<HTMLDivElement | null>(null);
  const activeDragRef = useRef<{
    type: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w';
    startX: number;
    startY: number;
    initialBox: { x: number; y: number; width: number; height: number };
  } | null>(null);

  // Sync when a new picture is passed in
  useEffect(() => {
    setCurrentImage(initialImageUrl);
    setIsAiEnhanced(false);
    setIsCropping(false);
    setCropBox({ x: 0.05, y: 0.05, width: 0.9, height: 0.9 });
  }, [initialImageUrl]);

  // Handle Free Crop Dragging (corners, edges, and box movement)
  useEffect(() => {
    if (!isCropping) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!activeDragRef.current || !cropContainerRef.current) return;
      const rect = cropContainerRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const deltaX = (clientX - activeDragRef.current.startX) / rect.width;
      const deltaY = (clientY - activeDragRef.current.startY) / rect.height;
      const init = activeDragRef.current.initialBox;
      const { type } = activeDragRef.current;

      let newX = init.x;
      let newY = init.y;
      let newW = init.width;
      let newH = init.height;

      const minSize = 0.08;

      if (type === 'move') {
        newX = Math.max(0, Math.min(1 - init.width, init.x + deltaX));
        newY = Math.max(0, Math.min(1 - init.height, init.y + deltaY));
      } else {
        if (type.includes('w')) {
          const maxDeltaX = init.width - minSize;
          const clampedDeltaX = Math.min(maxDeltaX, Math.max(-init.x, deltaX));
          newX = init.x + clampedDeltaX;
          newW = init.width - clampedDeltaX;
        }
        if (type.includes('e')) {
          newW = Math.max(minSize, Math.min(1 - init.x, init.width + deltaX));
        }
        if (type.includes('n')) {
          const maxDeltaY = init.height - minSize;
          const clampedDeltaY = Math.min(maxDeltaY, Math.max(-init.y, deltaY));
          newY = init.y + clampedDeltaY;
          newH = init.height - clampedDeltaY;
        }
        if (type.includes('s')) {
          newH = Math.max(minSize, Math.min(1 - init.y, init.height + deltaY));
        }
      }

      setCropBox({
        x: Math.max(0, Math.min(1 - minSize, newX)),
        y: Math.max(0, Math.min(1 - minSize, newY)),
        width: Math.max(minSize, Math.min(1 - newX, newW)),
        height: Math.max(minSize, Math.min(1 - newY, newH)),
      });
    };

    const handlePointerUp = () => {
      activeDragRef.current = null;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isCropping]);

  const startDrag = (
    e: React.MouseEvent | React.TouchEvent,
    type: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w'
  ) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    activeDragRef.current = {
      type,
      startX: clientX,
      startY: clientY,
      initialBox: { ...cropBox },
    };
  };

  if (!isOpen) return null;

  // Handle Rotate
  const handleRotate = async () => {
    setIsProcessing(true);
    try {
      const rotated = await rotateImage90(currentImage);
      setCurrentImage(rotated);
    } catch (e) {
      console.error('Rotate failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Free Crop Apply
  const handleApplyCrop = async () => {
    setIsProcessing(true);
    try {
      const cropped = await cropImageFree(currentImage, cropBox);
      setCurrentImage(cropped);
      setIsCropping(false);
      setCropBox({ x: 0.05, y: 0.05, width: 0.9, height: 0.9 });
    } catch (e) {
      console.error('Free crop failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Enhance AI (balanced clarity, subtle sharpness without over-brightening)
  const handleEnhanceAI = async () => {
    if (isAiEnhanced) {
      // Revert to non-enhanced
      setCurrentImage(originalImage);
      setIsAiEnhanced(false);
      return;
    }

    setIsEnhancing(true);
    try {
      await new Promise((r) => setTimeout(r, 350));
      const { enhancedBase64 } = await enhanceImageWithAI(currentImage);
      setCurrentImage(enhancedBase64);
      setIsAiEnhanced(true);
    } catch (e) {
      console.error('AI Enhance error:', e);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Handle Select (Finalize photo with GPS watermark)
  const handleSelect = async () => {
    setIsProcessing(true);
    try {
      const finalized = await stampGeotagOnImage(currentImage, geotag);
      onSelect(finalized, geotag);
    } catch (e) {
      console.error('Select stamp failed:', e);
      onSelect(currentImage, geotag);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between text-white animate-fadeIn overflow-hidden">
      
      {/* ========================================================
          TOP HEADER BAR
          ======================================================== */}
      <header className="px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-black/90 border-b border-zinc-800 shrink-0">
        
        {/* Left: Location Pin & Coordinates */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="text-sm sm:text-base font-bold text-white tracking-tight">
              {geotag.areaName}
            </div>
            <div className="text-[11px] sm:text-xs text-zinc-400 font-mono flex items-center gap-2">
              {geotag.pincode && <span>PIN: <strong className="text-zinc-200">{geotag.pincode}</strong></span>}
              <span>GPS: <strong className="text-zinc-200">{geotag.latitude.toFixed(5)}, {geotag.longitude.toFixed(5)}</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Retake & Close Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRetake}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retake</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </header>

      {/* ========================================================
          MIDDLE PORTION: Picture Preview & Freeform Crop Area
          ======================================================== */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden relative select-none">
        <div className="relative max-w-2xl max-h-[68vh] w-full flex items-center justify-center">
          <div className="relative inline-block overflow-hidden rounded-2xl shadow-2xl border border-zinc-800">
            <img
              ref={imgRef}
              src={currentImage}
              alt="Captured inspection"
              className="max-h-[64vh] w-auto max-w-full block object-contain pointer-events-none"
            />

            {/* AI Enhanced Status Pill */}
            {isAiEnhanced && !isCropping && (
              <div className="absolute top-4 right-4 bg-indigo-600/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-white flex items-center gap-1.5 shadow-lg border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>AI Sharpness Enhanced</span>
              </div>
            )}

            {/* Interactive Freeform Crop Overlay */}
            {isCropping && (
              <div 
                ref={cropContainerRef}
                className="absolute inset-0 z-20 touch-none"
              >
                {/* 4 Outer Dark Dimmed Shrouds around the selected crop box */}
                {/* Top mask */}
                <div 
                  className="absolute top-0 inset-x-0 bg-black/60 pointer-events-none"
                  style={{ height: `${cropBox.y * 100}%` }}
                />
                {/* Bottom mask */}
                <div 
                  className="absolute bottom-0 inset-x-0 bg-black/60 pointer-events-none"
                  style={{ height: `${(1 - (cropBox.y + cropBox.height)) * 100}%` }}
                />
                {/* Left mask */}
                <div 
                  className="absolute bg-black/60 pointer-events-none"
                  style={{ 
                    top: `${cropBox.y * 100}%`, 
                    height: `${cropBox.height * 100}%`,
                    left: 0, 
                    width: `${cropBox.x * 100}%` 
                  }}
                />
                {/* Right mask */}
                <div 
                  className="absolute bg-black/60 pointer-events-none"
                  style={{ 
                    top: `${cropBox.y * 100}%`, 
                    height: `${cropBox.height * 100}%`,
                    right: 0, 
                    width: `${(1 - (cropBox.x + cropBox.width)) * 100}%` 
                  }}
                />

                {/* Free Crop Selection Box */}
                <div
                  className="absolute border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)] cursor-move transition-shadow"
                  style={{
                    left: `${cropBox.x * 100}%`,
                    top: `${cropBox.y * 100}%`,
                    width: `${cropBox.width * 100}%`,
                    height: `${cropBox.height * 100}%`,
                  }}
                  onMouseDown={(e) => startDrag(e, 'move')}
                  onTouchStart={(e) => startDrag(e, 'move')}
                >
                  {/* Rule-of-Thirds Grid inside crop area */}
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-white" />
                    <div className="border-r border-white" />
                    <div />
                  </div>

                  {/* 4 Corner Free Drag Handles */}
                  <div
                    onMouseDown={(e) => startDrag(e, 'nw')}
                    onTouchStart={(e) => startDrag(e, 'nw')}
                    className="absolute -top-2.5 -left-2.5 w-6 h-6 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize shadow-md"
                  />
                  <div
                    onMouseDown={(e) => startDrag(e, 'ne')}
                    onTouchStart={(e) => startDrag(e, 'ne')}
                    className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize shadow-md"
                  />
                  <div
                    onMouseDown={(e) => startDrag(e, 'se')}
                    onTouchStart={(e) => startDrag(e, 'se')}
                    className="absolute -bottom-2.5 -right-2.5 w-6 h-6 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize shadow-md"
                  />
                  <div
                    onMouseDown={(e) => startDrag(e, 'sw')}
                    onTouchStart={(e) => startDrag(e, 'sw')}
                    className="absolute -bottom-2.5 -left-2.5 w-6 h-6 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize shadow-md"
                  />

                  {/* 4 Edge Midpoint Drag Handles */}
                  <div
                    onMouseDown={(e) => startDrag(e, 'n')}
                    onTouchStart={(e) => startDrag(e, 'n')}
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3.5 bg-white border border-indigo-600 rounded-sm cursor-ns-resize shadow-md"
                  />
                  <div
                    onMouseDown={(e) => startDrag(e, 's')}
                    onTouchStart={(e) => startDrag(e, 's')}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-3.5 bg-white border border-indigo-600 rounded-sm cursor-ns-resize shadow-md"
                  />
                  <div
                    onMouseDown={(e) => startDrag(e, 'w')}
                    onTouchStart={(e) => startDrag(e, 'w')}
                    className="absolute top-1/2 -translate-y-1/2 -left-2 w-3.5 h-8 bg-white border border-indigo-600 rounded-sm cursor-ew-resize shadow-md"
                  />
                  <div
                    onMouseDown={(e) => startDrag(e, 'e')}
                    onTouchStart={(e) => startDrag(e, 'e')}
                    className="absolute top-1/2 -translate-y-1/2 -right-2 w-3.5 h-8 bg-white border border-indigo-600 rounded-sm cursor-ew-resize shadow-md"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ========================================================
          BOTTOM PORTION: Crop Controls / Main Editor Controls
          ======================================================== */}
      <footer className="p-4 sm:p-6 bg-black/90 border-t border-zinc-900 shrink-0 max-w-xl mx-auto w-full">
        {isCropping ? (
          /* Free Crop Controls: Done / Cancel (No preset aspect ratio buttons!) */
          <div className="space-y-2">
            <div className="text-center text-xs text-zinc-400">
              Drag corners or edges freely to crop the image
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCropping(false)}
                className="w-1/3 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs sm:text-sm rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={handleApplyCrop}
                disabled={isProcessing}
                className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Apply Crop</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Controls: Crop, Enhance AI, Rotate & Retake, Select */
          <div className="space-y-4">
            {/* Row 1: Crop, Enhance AI, Rotate */}
            <div className="flex items-center justify-center gap-2.5">
              {/* Free Crop Toggle Button */}
              <button
                type="button"
                onClick={() => setIsCropping(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-800/90 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-700 transition-all cursor-pointer"
              >
                <CropIcon className="w-4 h-4 text-zinc-300" />
                <span>Crop</span>
              </button>

              {/* Enhance AI Button */}
              <button
                type="button"
                onClick={handleEnhanceAI}
                disabled={isEnhancing}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                  isAiEnhanced
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 hover:bg-amber-900'
                    : 'bg-zinc-800/90 text-zinc-300 hover:text-white hover:bg-zinc-700 border-zinc-700'
                }`}
              >
                {isEnhancing ? (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>Enhancing...</span>
                  </>
                ) : isAiEnhanced ? (
                  <>
                    <Undo2 className="w-4 h-4 text-amber-400" />
                    <span>Revert AI</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Enhance AI</span>
                  </>
                )}
              </button>

              {/* Rotate Button */}
              <button
                type="button"
                onClick={handleRotate}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-800/90 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-700 transition-all cursor-pointer"
              >
                <RotateCw className="w-4 h-4 text-zinc-300" />
                <span>Rotate</span>
              </button>
            </div>

            {/* Row 2: Retake (left) & Select (right, prominent blue button) */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onRetake}
                className="w-1/3 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 hover:text-white font-semibold text-xs sm:text-sm rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-zinc-400" />
                <span>Retake</span>
              </button>

              <button
                type="button"
                onClick={handleSelect}
                disabled={isProcessing}
                className="flex-1 py-3 px-6 bg-[#4f46e5] hover:bg-[#4338ca] active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Select</span>
              </button>
            </div>
          </div>
        )}
      </footer>

    </div>
  );
};
