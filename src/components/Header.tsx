import React from 'react';
import { Volume2, Keyboard, ArrowLeft, Radio, Mic, AlertCircle, Box, User, LogIn, LogOut } from 'lucide-react';
import type { PracticeMode, MicStatus, ScreenView } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  sessionCode?: string;
  onBack?: () => void;
  backLabel?: string;
  onHome?: () => void;
  practiceMode: PracticeMode;
  onSelectMode: (mode: PracticeMode) => void;
  micStatus: MicStatus;
  isTesting: boolean;
  audioLevel: number;
  onToggleMicTest: () => void;
  currentScreen?: ScreenView;
  onNavigateLogin?: () => void;
  onNavigateRegister?: () => void;
  onNavigateDashboard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sessionCode = 'STUDIO // 001',
  onBack,
  backLabel = 'Back',
  onHome,
  practiceMode,
  onSelectMode,
  micStatus,
  isTesting,
  audioLevel,
  onToggleMicTest,
  currentScreen,
  onNavigateLogin,
  onNavigateRegister,
  onNavigateDashboard,
}) => {
  const { user, profile, signOut } = useAuth();

  const isAuthRoute =
    currentScreen === 'login' ||
    currentScreen === 'register' ||
    currentScreen === 'forgot-password' ||
    currentScreen === 'verify-email';

  const displayName = profile?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Candidate';

  return (
    <header className="w-full border-b border-white/[0.08] bg-[#0A0B0D]/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      {/* 1. Top Spectral Hairline Gradient Bar */}
      <div className="daemon-spectral-hairline" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Industrial Wordmark (+ Optional back action for studio routes) */}
        <div className="flex items-center gap-3 sm:gap-4">
          {!isAuthRoute && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mr-1 -ml-1 px-3 py-1.5 rounded-lg daemon-card daemon-card-hover text-[#9EA6B0] hover:text-[#FFFFFF] text-xs font-mono inline-flex items-center gap-1.5 transition-all focus:outline-none focus:ring-1 focus:ring-[#00F0FF] min-h-[40px]"
              aria-label={backLabel}
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="hidden sm:inline uppercase tracking-wider">{backLabel}</span>
            </button>
          )}

          {isAuthRoute ? (
            <div className="flex items-center gap-2.5 px-1 -ml-1 text-left min-h-[44px]">
              <div className="w-7 h-7 rounded bg-[#14181B] border border-white/[0.12] flex items-center justify-center">
                <Box className="w-4 h-4 text-[#00F0FF]" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-anton text-2xl sm:text-[26px] tracking-wide text-[#FFFFFF] uppercase leading-none">
                  ECHOTUTOR
                </span>
                <span className="font-mono text-[10px] text-[#00F0FF] font-bold">®</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onHome}
              className="flex items-center gap-2.5 focus:outline-none focus:ring-1 focus:ring-[#00F0FF] rounded px-1 -ml-1 transition-all text-left group min-h-[44px]"
              title="EchoTutor Home"
            >
              <div className="w-7 h-7 rounded bg-[#14181B] border border-white/[0.12] group-hover:border-[#00F0FF]/60 flex items-center justify-center transition-colors">
                <Box className="w-4 h-4 text-[#00F0FF] transition-transform group-hover:scale-110" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-anton text-2xl sm:text-[26px] tracking-wide text-[#FFFFFF] uppercase leading-none group-hover:text-[#00F0FF] transition-colors">
                  ECHOTUTOR
                </span>
                <span className="font-mono text-[10px] text-[#00F0FF] font-bold">®</span>
              </div>
            </button>
          )}
        </div>

        {/* Right side */}
        {isAuthRoute ? (
          /* Clean Minimal Header on Auth Routes: Security Protocol Badge */
          <div className="flex items-center">
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-md daemon-badge text-[#9EA6B0] border border-white/[0.08]">
              SECURITY // <span className="text-[#00F0FF] font-bold">TLS-256</span>
            </span>
          </div>
        ) : (
          /* Full Studio Header Controls (Entry, Setup, Room, Dashboard) */
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Practice Mode Switcher (Voice vs Silent Typed) */}
            <div className="inline-flex rounded-lg bg-[#14181B] p-1 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => onSelectMode('voice')}
                className={`text-xs font-mono px-2.5 sm:px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 transition-all min-h-[34px] ${
                  practiceMode === 'voice'
                    ? 'bg-[#00F0FF] text-[#0A0B0D] font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                    : 'text-[#9EA6B0] hover:text-[#FFFFFF]'
                }`}
                aria-pressed={practiceMode === 'voice'}
                title="Voice Mode: Speak your answers with live microphone feedback"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden lg:inline uppercase tracking-wider">Voice</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectMode('typed')}
                className={`text-xs font-mono px-2.5 sm:px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 transition-all min-h-[34px] ${
                  practiceMode === 'typed'
                    ? 'bg-[#00F0FF] text-[#0A0B0D] font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                    : 'text-[#9EA6B0] hover:text-[#FFFFFF]'
                }`}
                aria-pressed={practiceMode === 'typed'}
                title="Silent Typed Mode: Type your answers without a microphone"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span className="hidden lg:inline uppercase tracking-wider">Typed</span>
              </button>
            </div>

            {/* Microphone Diagnostic / Live Status Trigger */}
            {practiceMode === 'voice' && (
              <button
                type="button"
                onClick={onToggleMicTest}
                className={`text-xs font-mono px-2.5 sm:px-3 py-1.5 rounded-lg border transition-all inline-flex items-center gap-1.5 min-h-[36px] ${
                  isTesting
                    ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#FFFFFF] shadow-[0_0_14px_rgba(0,240,255,0.3)]'
                    : micStatus === 'denied' || micStatus === 'missing' || micStatus === 'error'
                    ? 'bg-[#FF4D6D]/15 border-[#FF4D6D]/60 text-[#FF4D6D]'
                    : 'bg-[#14181B] border-white/[0.08] text-[#9EA6B0] hover:text-[#FFFFFF] hover:border-[#00F0FF]/50'
                }`}
                title={
                  isTesting
                    ? `Live Audio Level: ${(audioLevel * 100).toFixed(0)}%`
                    : 'Test microphone hardware connection'
                }
              >
                {isTesting ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />
                    <span className="font-bold text-[#00F0FF] tracking-wider">
                      {(audioLevel * 100).toFixed(0)}%
                    </span>
                  </>
                ) : micStatus === 'denied' || micStatus === 'missing' || micStatus === 'error' ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-[#FF4D6D]" />
                    <span className="hidden sm:inline uppercase">Blocked</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span className="hidden sm:inline uppercase tracking-wider">Mic Test</span>
                  </>
                )}
              </button>
            )}

            {/* Authentication State Pill or Login/Register Triggers */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={onNavigateDashboard}
                  className={`text-xs font-mono px-2.5 sm:px-3 py-1.5 rounded-lg border transition-all inline-flex items-center gap-1.5 min-h-[36px] ${
                    currentScreen === 'dashboard'
                      ? 'bg-[#00F0FF] text-[#0A0B0D] border-[#00F0FF] font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                      : 'bg-[#14181B] border-white/[0.08] text-[#FFFFFF] hover:border-[#00F0FF]/50'
                  }`}
                  title="Open Candidate Dashboard"
                >
                  <User className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span className="hidden sm:inline uppercase font-bold tracking-wider">
                    {displayName}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={signOut}
                  className="text-xs font-mono p-2 sm:px-2.5 sm:py-1.5 rounded-lg daemon-card daemon-card-hover text-[#9EA6B0] hover:text-[#FF4D6D] transition-colors inline-flex items-center gap-1 min-h-[36px]"
                  title="Sign Out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {onNavigateLogin && (
                  <button
                    type="button"
                    onClick={onNavigateLogin}
                    className="text-xs font-mono px-2.5 sm:px-3 py-1.5 rounded-lg border transition-all inline-flex items-center gap-1.5 min-h-[36px] bg-[#14181B] border-white/[0.08] text-[#9EA6B0] hover:text-[#FFFFFF] hover:border-white/[0.2]"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span className="uppercase tracking-wider font-bold">Sign In</span>
                  </button>
                )}

                {onNavigateRegister && (
                  <button
                    type="button"
                    onClick={onNavigateRegister}
                    className="hidden sm:inline-flex text-xs font-mono px-3 py-1.5 rounded-lg border transition-all items-center gap-1.5 min-h-[36px] daemon-badge hover:border-[#00F0FF] font-bold"
                  >
                    <span className="uppercase tracking-wider">Register</span>
                  </button>
                )}
              </div>
            )}

            {/* Session Code Badge */}
            {sessionCode && (
              <div className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg daemon-badge text-[11px] font-mono">
                <Radio className="w-3 h-3 text-[#00F0FF]" />
                <span className="text-[#FFFFFF] font-bold tracking-widest">{sessionCode}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
