import React from 'react';
import { Wifi, WifiOff, LogOut } from 'lucide-react';
import { InspectorUser } from '../types';

interface NavbarProps {
  inspector: InspectorUser;
  isOnline: boolean;
  onToggleOnline: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  inspector,
  isOnline,
  onToggleOnline,
  onLogout,
}) => {
  // Extract clean initials (ignoring parentheses and special characters)
  const initials = inspector.name
    .replace(/[^a-zA-Z\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'IN';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-blue-100 shadow-xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 min-h-[3.75rem] py-2 flex items-center justify-between gap-2">
        
        {/* 1. Top Left: User Name (Responsive with truncation so it never overflows) */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs sm:text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-base font-bold text-blue-950 truncate leading-tight">
              {inspector.name}
            </div>
            <div className="text-[10px] sm:text-xs text-blue-600/80 font-medium truncate leading-tight mt-0.5">
              {inspector.designation || 'MoSJE Field Officer'}
            </div>
          </div>
        </div>

        {/* 2. Top Right: Online/Offline Status (Green/Light Red) and Logout Icon */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Online/Offline Status Indicator (Toggleable, Short & Color-Coded) */}
          <button
            onClick={onToggleOnline}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
            }`}
            title="Click to toggle Online / Offline mode"
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-semibold">Online</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                <WifiOff className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="text-[11px] font-semibold">Offline</span>
              </>
            )}
          </button>

          {/* Logout Option - Icon Only */}
          <button
            onClick={onLogout}
            className="p-2 rounded-full text-blue-800 hover:text-blue-950 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Log out of account"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4 text-blue-700" />
          </button>

        </div>

      </div>
    </header>
  );
};
