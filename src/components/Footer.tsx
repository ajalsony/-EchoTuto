import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#28302B]/60 bg-[#101211] py-8 sm:py-10 mt-12 sm:mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        {/* Subtle Editorial Reminder */}
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B8FF62]/80" />
          <p className="font-mono text-xs sm:text-sm tracking-wider uppercase text-[#E8EAE5]">
            No perfect answers required. Just progress.
          </p>
        </div>

        {/* Minimal System Info */}
        <div className="flex items-center gap-4 text-xs font-mono text-[#929991]">
          <span>ECHOTUTOR // CORE v0.1</span>
          <span className="text-[#28302B]">•</span>
          <span>VOICE-FIRST ARCHITECTURE</span>
        </div>
      </div>
    </footer>
  );
};
