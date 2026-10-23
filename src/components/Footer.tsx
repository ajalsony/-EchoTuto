import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#0B0D0C] py-8 sm:py-10 mt-12 sm:mt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        {/* Subtle Editorial Reminder */}
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B8FF62] shadow-[0_0_8px_#B8FF62]" />
          <p className="font-mono text-xs sm:text-sm tracking-wider uppercase text-[#E8EAE5]">
            No perfect answers required. Just progress.
          </p>
        </div>

        {/* Minimal Studio System Info */}
        <div className="flex items-center gap-4 text-xs font-mono text-[#8A9389]">
          <span>ECHOTUTOR // STUDIO v0.2</span>
          <span className="text-white/20">•</span>
          <span>ACOUSTIC-FIRST ARCHITECTURE</span>
        </div>
      </div>
    </footer>
  );
};
