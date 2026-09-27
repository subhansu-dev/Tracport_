import React from 'react';
import { X, MapPin, Calendar, Clock, ShieldCheck, ZoomIn } from 'lucide-react';
import { InspectionPhotoData } from '../types';

interface PhotoPreviewModalProps {
  isOpen: boolean;
  photo: InspectionPhotoData | null;
  itemName: string;
  onClose: () => void;
}

export const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  isOpen,
  photo,
  itemName,
  onClose,
}) => {
  if (!isOpen || !photo) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between text-white animate-fadeIn overflow-y-auto p-3 sm:p-6">
      
      {/* Top Header */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {itemName || 'Inspection Photo Preview'}
            </h3>
            <p className="text-[11px] text-zinc-400">
              Verified & Selected Official Evidence
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          aria-label="Close Preview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 flex items-center justify-center py-4">
        <div className="relative max-w-3xl w-full flex items-center justify-center">
          <img
            src={photo.imageUrl}
            alt={itemName}
            className="max-h-[72vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-zinc-800"
          />
        </div>
      </div>

      {/* Metadata Bottom Card */}
      <div className="max-w-4xl w-full mx-auto bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-zinc-300">
          <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{photo.areaName}{photo.pincode ? <> (PIN: <strong>{photo.pincode}</strong>)</> : null}</span>
        </div>

        <div className="flex items-center gap-4 text-zinc-400 font-mono">
          <span>GPS: <strong className="text-zinc-200">{photo.latitude.toFixed(5)}°, {photo.longitude.toFixed(5)}°</strong></span>
          <span>📅 {photo.date}</span>
          <span>⏰ {photo.time}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold cursor-pointer text-xs"
        >
          Close Preview
        </button>
      </div>

    </div>
  );
};
