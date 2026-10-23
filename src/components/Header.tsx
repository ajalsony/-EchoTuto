import React from 'react';
import { Volume2 } from 'lucide-react';

interface HeaderProps {
  sessionCode?: string;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ sessionCode = 'PRACTICE / 001' }) => {
  return (
    <header className="w-full border-b border-[#28302B]/60 bg-[#101211]/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Custom Wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-baseline gap-1.5 focus:outline-none focus:ring-1 focus:ring-[#B8FF62] rounded px-1 -ml-1 transition-colors"
          >
            <span className="font-space font-bold text-xl sm:text-2xl tracking-tighter text-[#E8EAE5]">
              ECHO<span className="text-[#B8FF62]">TUTOR</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#B8FF62] mb-0.5" />
          </a>
        </div>

        {/* Minimal Navigation & Editorial Session Tag */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#1B201D] border border-[#28302B] text-[11px] font-mono text-[#929991]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B8FF62] animate-pulse" />
            <span className="text-[#E8EAE5] font-medium tracking-wide">{sessionCode}</span>
          </div>

          <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-[#929991] border border-transparent rounded">
            <Volume2 className="w-3.5 h-3.5 text-[#B8FF62]" />
            <span>VOICE ENGINE READY</span>
          </div>
        </div>
      </div>
    </header>
  );
};
