import React, { useEffect, useState } from 'react';
import { FileText, ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    const totalDurationMs = 3000;
    const intervalMs = 25;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / totalDurationMs) * 100);
      setProgress(pct);

      if (elapsed >= totalDurationMs) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          onComplete();
        }, 300);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-[#070b5b] text-white select-none overflow-hidden transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#070b5b' }}
    >
      {/* Top Bar with "Made by Erudites" exactly as in screenshot */}
      <div className="w-full flex items-center justify-end p-6 sm:p-10 z-10">
        <div className="flex items-center gap-1.5 animate-fadeIn">
          <span className="text-white/90 text-sm sm:text-base font-normal tracking-wide">
            Made by
          </span>
          <span 
            className="text-white text-xl sm:text-2xl font-bold tracking-wide"
            style={{ 
              fontFamily: "'Pacifico', 'Caveat', cursive",
              textShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            Erudites
          </span>
        </div>
      </div>

      {/* Center Hero: Flag Card + Tracport Typography */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-16 px-4">
        
        {/* Animated Card Container */}
        <div className="relative group transition-all duration-700 ease-out transform animate-in zoom-in-95 duration-500">
          
          {/* Subtle glow behind card */}
          <div className="absolute -inset-2 bg-blue-500/20 rounded-[32px] blur-xl animate-pulse" />

          {/* Flag Rounded Card */}
          <div className="relative w-[230px] sm:w-[260px] h-[145px] sm:h-[160px] rounded-[26px] overflow-hidden shadow-[0_20px_45px_rgba(0,0,0,0.65)] flex flex-col border border-white/10 hover:scale-[1.02] transition-transform duration-500">
            
            {/* Top Stripe: Indian Saffron / Deep Orange */}
            <div className="h-1/3 w-full bg-[#FF8200] relative overflow-hidden">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]"
                style={{
                  animation: 'shimmer 2.2s infinite'
                }}
              />
            </div>

            {/* Middle Stripe: Pure White with Central Inspection Document Badge */}
            <div className="h-1/3 w-full bg-white relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#18181b] border-2 border-[#09090b] flex items-center justify-center shadow-md shadow-black/30 transform transition-transform group-hover:rotate-6">
                <FileText className="w-6 h-6 text-[#fafafa]" strokeWidth={2.2} />
              </div>
            </div>

            {/* Bottom Stripe: India Green */}
            <div className="h-1/3 w-full bg-[#0E8A16] relative overflow-hidden">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full"
                style={{
                  animation: 'shimmer 2.2s infinite'
                }}
              />
            </div>

          </div>

        </div>

        {/* Text Section: "Tracport" & "INSPECTION & VERIFICATION PLATFORM" */}
        <div className="mt-8 text-center space-y-1.5 animate-fadeIn">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
            Tracport
          </h1>
          <p className="text-[11px] sm:text-xs font-semibold tracking-[0.24em] uppercase text-white/90 drop-shadow-sm">
            INSPECTION & VERIFICATION PLATFORM
          </p>
        </div>

      </div>

      {/* Empty bottom spacer for perfect vertical balancing */}
      <div className="h-12 w-full" />
    </div>
  );
};
