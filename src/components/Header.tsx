import React from 'react';
import { Volume2, ArrowLeft, Radio } from 'lucide-react';

interface HeaderProps {
  sessionCode?: string;
  onBack?: () => void;
  backLabel?: string;
  onHome?: () => void;
  statusBadgeText?: string;
}

export const Header: React.FC<HeaderProps> = ({
  sessionCode = 'PRACTICE / 001',
  onBack,
  backLabel = 'Back',
  onHome,
  statusBadgeText = 'VOICE ENGINE READY',
}) => {
  return (
    <header className="w-full border-b border-white/[0.08] bg-[#0B0D0C]/85 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left Side: Back button or Custom Wordmark */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mr-1 -ml-1.5 p-1.5 sm:px-3 sm:py-1 rounded-lg chrome-badge text-[#8A9389] hover:text-[#E8EAE5] text-xs font-mono inline-flex items-center gap-1.5 transition-all hover:border-white/20 focus:outline-none focus:ring-1 focus:ring-[#B8FF62]"
              aria-label={backLabel}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{backLabel}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onHome}
            className="flex items-baseline gap-1.5 focus:outline-none focus:ring-1 focus:ring-[#B8FF62] rounded px-1 -ml-1 transition-all text-left group"
          >
            <span className="font-space font-bold text-xl sm:text-2xl tracking-tighter text-[#E8EAE5] group-hover:opacity-90">
              ECHO<span className="text-[#B8FF62]">TUTOR</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#B8FF62] mb-0.5 shadow-[0_0_8px_#B8FF62]" />
          </button>
        </div>

        {/* Minimal Navigation & Editorial Studio Session Tag */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full chrome-badge text-[11px] font-mono text-[#8A9389]">
            <Radio className="w-3 h-3 text-[#B8FF62] animate-pulse" />
            <span className="text-[#E8EAE5] font-medium tracking-wider">{sessionCode}</span>
          </div>

          <div className="hidden xs:flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono text-[#8A9389] border border-transparent rounded">
            <Volume2 className="w-3.5 h-3.5 text-[#B8FF62]" />
            <span className="tracking-tight">{statusBadgeText}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
