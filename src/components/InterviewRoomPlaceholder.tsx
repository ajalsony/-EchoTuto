import React from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Sparkles,
  RefreshCw,
  Mic,
  MessageSquare,
  FileCode2,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { EchoRings } from './EchoRings';
import type { InterviewConfig } from '../types';

interface InterviewRoomPlaceholderProps {
  config: InterviewConfig;
  onBackToSetup: () => void;
  onExitHome: () => void;
}

export const InterviewRoomPlaceholder: React.FC<InterviewRoomPlaceholderProps> = ({
  config,
  onBackToSetup,
  onExitHome,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center animate-fade-in">
      {/* Top Studio Telemetry Bar */}
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-3.5 mb-6 sm:mb-8">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#B8FF62] shadow-[0_0_8px_#B8FF62] animate-pulse" />
          <span className="text-[11px] font-mono text-[#B8FF62] tracking-wider uppercase font-semibold">
            STUDIO // 003 — ACOUSTIC STANDBY
          </span>
          <span className="text-xs text-[#8A9389]">•</span>
          <span className="text-xs font-mono text-[#8A9389] uppercase hidden sm:inline">
            Environment Locked & Calibrated
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToSetup}
            className="text-xs font-mono text-[#8A9389] hover:text-[#B8FF62] transition-colors inline-flex items-center gap-1.5 px-2.5 py-1 rounded chrome-badge"
          >
            <RefreshCw className="w-3 h-3 text-[#B8FF62]" />
            <span>Reconfigure</span>
          </button>
          <button
            type="button"
            onClick={onExitHome}
            className="text-xs font-mono text-[#8A9389] hover:text-[#E8EAE5] transition-colors inline-flex items-center gap-1.5 px-2.5 py-1 rounded chrome-badge"
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Verified Configuration Banner */}
      <div className="w-full mb-6 p-4 rounded-2xl chrome-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#0B0D0C] border border-white/10 text-[#B8FF62]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-[#E8EAE5] uppercase">
                {config.track === 'technical' ? 'Technical Interview Studio' : 'HR Behavioral Studio'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#B8FF62]/10 border border-[#B8FF62]/30 text-[#B8FF62]">
                {config.difficulty.toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-mono text-[#8A9389] mt-0.5">
              Focus Domain: <span className="text-[#E8EAE5]">{config.topic}</span> • Transmission:{' '}
              <span className="text-[#B8FF62]">
                {config.mode === 'voice' ? 'Vocal Acoustic' : 'Silent Typed'}
              </span>
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#B8FF62] px-3 py-1.5 rounded-full chrome-badge">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>PARAMETERS VERIFIED</span>
        </div>
      </div>

      {/* Studio Workstation Grid (4 Dedicated Modules) */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
        {/* Module 1: Interviewer Question Prompter (Left Column, 7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Prompter Panel */}
          <div className="chrome-panel rounded-2xl p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#B8FF62]" />
                  <span className="text-xs font-mono text-[#E8EAE5] font-semibold uppercase tracking-wider">
                    AI Interviewer Prompter
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#8A9389] px-2 py-0.5 rounded chrome-badge">
                  ENGINE LINK PENDING
                </span>
              </div>

              {/* Inactive Question Display State */}
              <div className="p-5 rounded-xl bg-[#0B0D0C] border border-white/[0.06] mb-4">
                <span className="text-[10px] font-mono text-[#8A9389] uppercase tracking-widest block mb-2">
                  AWAITING QUESTION GENERATION PIPELINE
                </span>
                <p className="text-sm font-space text-[#E8EAE5]/60 italic leading-relaxed">
                  “The AI interviewer voice engine and dynamic follow-up generator will initialize here in Milestone 3. Questions will adapt in real-time to your answers.”
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[#8A9389] pt-3 border-t border-white/[0.06]">
              <span>Rigor: {config.difficulty.replace('-', ' ').toUpperCase()}</span>
              <span>Domain: {config.topic}</span>
            </div>
          </div>

          {/* Transcript Panel Placeholder */}
          <div className="chrome-panel rounded-2xl p-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-[#B8FF62]" />
                <span className="text-xs font-mono text-[#E8EAE5] font-semibold uppercase tracking-wider">
                  Real-Time Transcript Feed
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8A9389] px-2 py-0.5 rounded chrome-badge">
                STANDBY
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0D0C] border border-white/[0.06] text-center">
              <p className="text-xs font-mono text-[#8A9389] leading-relaxed">
                Live speech-to-text transcription will stream here during response capture. Transcripts will feed into the post-session comparison engine.
              </p>
            </div>
          </div>
        </div>

        {/* Module 2: Candidate Acoustic Monitor (Right Column, 5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Acoustic Visualizer & Sensor Panel */}
          <div className="chrome-panel rounded-2xl p-6 flex flex-col items-center text-center justify-between">
            <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-[#B8FF62]" />
                <span className="text-xs font-mono text-[#E8EAE5] font-semibold uppercase tracking-wider">
                  Acoustic Studio Sensor
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#B8FF62] px-2 py-0.5 rounded chrome-badge">
                ARMED
              </span>
            </div>

            {/* Centered Liquid-Chrome Echo Rings Visualizer */}
            <div className="py-2">
              <EchoRings
                size="md"
                state="idle"
                showStatusLabel={true}
                customLabel="STUDIO CORE"
                customText="Acoustic Standby"
                customSubtext="Parameters locked for engine link"
              />
            </div>

            <div className="w-full mt-4 p-3 rounded-xl bg-[#0B0D0C] border border-white/[0.06] text-left">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8A9389]">Channel Mode:</span>
                <span className="text-[#E8EAE5] font-semibold">
                  {config.mode === 'voice' ? 'Vocal (Microphone)' : 'Silent Typed (Keyboard)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono mt-1">
                <span className="text-[#8A9389]">Audio Pipeline:</span>
                <span className="text-[#B8FF62]">Milestone 3 Connection</span>
              </div>
            </div>
          </div>

          {/* Module 3: Studio Control & Milestone Notice */}
          <div className="chrome-panel rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2.5">
              <Sliders className="w-4 h-4 text-[#B8FF62]" />
              <span className="text-xs font-mono text-[#E8EAE5] font-semibold uppercase">
                Studio Verification Notice
              </span>
            </div>

            <div className="flex items-start gap-2.5 text-xs font-mono text-[#8A9389] leading-relaxed">
              <Sparkles className="w-4 h-4 text-[#B8FF62] shrink-0 mt-0.5" />
              <p>
                This studio workstation establishes the verified environment. No fabricated AI answers or false transcripts are generated. Live Whisper transcription and conversational question synthesis will be connected in <strong>Milestone 3</strong>.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={onBackToSetup}
                className="w-full py-2.5 px-4 rounded-xl chrome-badge text-xs font-mono text-[#E8EAE5] hover:text-[#B8FF62] transition-colors inline-flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Adjust Parameters</span>
              </button>
              <button
                type="button"
                onClick={onExitHome}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0B0D0C] hover:bg-[#141816] border border-white/10 text-xs font-mono text-[#8A9389] hover:text-[#E8EAE5] transition-colors inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Arena</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="w-full max-w-2xl text-center flex items-center justify-center gap-2 text-[11px] font-mono text-[#8A9389]">
        <ShieldAlert className="w-3.5 h-3.5 text-[#B8FF62]" />
        <span>Studio environment isolated. Ready for AI Interview Engine integration.</span>
      </div>
    </div>
  );
};
