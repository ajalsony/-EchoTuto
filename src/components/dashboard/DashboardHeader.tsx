import React from 'react';
import { Menu, Volume2, Keyboard, Mic } from 'lucide-react';
import type { PracticeMode } from '../../types';

interface DashboardHeaderProps {
  onToggleMobileMenu: () => void;
  targetRole?: string;
  practiceMode?: PracticeMode;
  onSelectMode?: (mode: PracticeMode) => void;
  isTestingMic: boolean;
  audioLevel: number;
  onToggleMicTest: () => void;
  userName: string;
  onOpenDossier: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onToggleMobileMenu,
  targetRole = 'Software Engineering',
  practiceMode = 'voice',
  onSelectMode,
  isTestingMic,
  audioLevel,
  onToggleMicTest,
  userName,
  onOpenDossier,
}) => {
  return (
    <header className="sticky top-0 right-0 h-16 bg-[#0D0E10]/90 backdrop-blur-xl border-b border-white/[0.08] z-30 px-4 sm:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu Button + Telemetry Node Display */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg bg-[#14181B] border border-white/[0.08] text-white hover:text-[#00F0FF] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Telemetry Node Pills */}
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] text-[#9EA6B0] uppercase tracking-wider hidden sm:inline">
            TELEMETRY NODE:
          </span>
          <span className="font-mono text-[11px] text-[#00F0FF] bg-[#14181B] px-2.5 py-1 rounded-md border border-white/[0.08] font-bold">
            CLUSTER-AI-DIRECT
          </span>
          <span className="text-white/20 hidden md:inline">•</span>
          <span className="font-mono text-[11px] text-white/80 hidden md:inline truncate max-w-[200px]">
            {targetRole}
          </span>
        </div>
      </div>

      {/* Right: Sensor Diagnostics & Mode Switcher */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Interactive Microphone Acoustic Sensor */}
        <button
          type="button"
          onClick={onToggleMicTest}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-mono font-semibold ${
            isTestingMic
              ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              : 'bg-[#14181B] hover:bg-[#1B2126] border-white/[0.08] text-[#9EA6B0] hover:text-white'
          }`}
          title={isTestingMic ? 'Click to stop live sensor test' : 'Click to test live microphone sensor'}
        >
          <Mic className={`w-3.5 h-3.5 ${isTestingMic ? 'animate-pulse text-[#00F0FF]' : 'text-[#00F0FF]'}`} />
          <span className="hidden sm:inline">
            {isTestingMic ? `Sensor ${(audioLevel * 100).toFixed(0)}%` : 'Sensor Ready'}
          </span>
        </button>

        {/* Practice Mode Toggle */}
        {onSelectMode && (
          <div className="hidden sm:inline-flex rounded-lg bg-[#14181B] p-0.5 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => onSelectMode('voice')}
              className={`text-xs font-mono px-2.5 py-1 rounded-md inline-flex items-center gap-1 transition-all ${
                practiceMode === 'voice'
                  ? 'bg-[#00F0FF] text-[#0A0B0D] font-bold shadow-sm'
                  : 'text-[#9EA6B0] hover:text-white'
              }`}
              title="Voice Practice Mode"
            >
              <Volume2 className="w-3 h-3" />
              <span>Voice</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectMode('typed')}
              className={`text-xs font-mono px-2.5 py-1 rounded-md inline-flex items-center gap-1 transition-all ${
                practiceMode === 'typed'
                  ? 'bg-[#00F0FF] text-[#0A0B0D] font-bold shadow-sm'
                  : 'text-[#9EA6B0] hover:text-white'
              }`}
              title="Typed Practice Mode"
            >
              <Keyboard className="w-3 h-3" />
              <span>Typed</span>
            </button>
          </div>
        )}

        {/* Candidate Profile Avatar Trigger */}
        <button
          type="button"
          onClick={onOpenDossier}
          className="w-8 h-8 rounded-full bg-[#14181B] border border-[#00F0FF]/40 hover:border-[#00F0FF] text-[#00F0FF] flex items-center justify-center font-mono font-bold text-xs transition-colors shrink-0"
          title="Inspect Candidate Dossier"
          aria-label="Candidate profile"
        >
          {userName.charAt(0).toUpperCase()}
        </button>
      </div>
    </header>
  );
};
