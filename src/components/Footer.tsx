import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#0A0B0D] py-10 sm:py-12 mt-16 sm:mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        {/* Subtle Editorial Reminder */}
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
          <p className="font-mono text-xs sm:text-sm tracking-wider uppercase text-[#FFFFFF] font-medium">
            No perfect answers required. Just iterative progress.
          </p>
        </div>

        {/* Minimal Studio System Info */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-4 text-xs font-mono text-[#9EA6B0]">
          <span>ECHOTUTOR® STUDIO v0.4</span>
          <span className="text-white/20">•</span>
          <span className="text-[#00F0FF]">ACOUSTIC CADENCE ENGINE</span>
          <span className="text-white/20">•</span>
          <span className="text-[#606873]">LATENCY: OPTIMAL</span>
        </div>
      </div>
    </footer>
  );
};
