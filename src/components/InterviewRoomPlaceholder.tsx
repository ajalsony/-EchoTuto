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
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center">
      {/* Top Studio Telemetry Bar */}
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-4 mb-8">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF] animate-pulse" />
          <span className="text-[11px] font-mono text-[#00F0FF] tracking-wider uppercase font-bold">
            STUDIO // 003 — ACOUSTIC STANDBY
          </span>
          <span className="text-xs text-[#9EA6B0]">•</span>
          <span className="text-xs font-mono text-[#9EA6B0] uppercase hidden sm:inline">
            Environment Locked & Calibrated
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToSetup}
            className="text-xs font-mono text-[#9EA6B0] hover:text-[#00F0FF] transition-colors inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md daemon-card daemon-card-hover uppercase tracking-wider"
          >
            <RefreshCw className="w-3 h-3 text-[#00F0FF]" />
            <span>Reconfigure</span>
          </button>
          <button
            type="button"
            onClick={onExitHome}
            className="text-xs font-mono text-[#9EA6B0] hover:text-[#FFFFFF] transition-colors inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md daemon-card daemon-card-hover uppercase tracking-wider"
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Verified Configuration Banner */}
      <div className="w-full mb-8 p-5 rounded-xl daemon-card relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-tr" aria-hidden="true">+</span>
        <span className="daemon-crosshair-bl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-br" aria-hidden="true">+</span>

        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-[#0A0B0D] border border-white/[0.1] text-[#00F0FF]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-anton text-lg tracking-wide text-[#FFFFFF] uppercase">
                {config.track === 'technical' ? 'Technical Interview Studio' : 'HR Behavioral Studio'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded daemon-badge font-bold">
                {config.difficulty.toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-mono text-[#9EA6B0] mt-1">
              Focus: <span className="text-[#FFFFFF] font-bold">{config.topic}</span> • Channel:{' '}
              <span className="text-[#00F0FF]">
                {config.mode === 'voice' ? 'Vocal (Microphone)' : 'Silent Typed (Keyboard)'}
              </span>
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#00F0FF] px-3.5 py-1.5 rounded-lg daemon-badge font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span>PARAMETERS VERIFIED</span>
        </div>
      </div>

      {/* Studio Workstation Grid (4 Modules) */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Module 1: Interviewer Question Prompter (Left Column, 7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Prompter Panel */}
          <div className="daemon-card rounded-xl p-6 flex-1 flex flex-col justify-between relative">
            <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
            <span className="daemon-crosshair-tr" aria-hidden="true">+</span>

            <div>
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5 mb-5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#00F0FF]" />
                  <span className="font-anton text-lg text-[#FFFFFF] uppercase tracking-wide">
                    Interviewer Question Console
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#9EA6B0] px-2.5 py-0.5 rounded daemon-chip font-bold">
                  ENGINE LINK PENDING
                </span>
              </div>

              {/* Inactive Question Display State */}
              <div className="p-5 rounded-lg bg-[#0A0B0D] border border-white/[0.08] mb-4">
                <span className="text-[10px] font-mono text-[#9EA6B0] uppercase tracking-widest block mb-2 font-bold">
                  QUESTION PIPELINE READY FOR MILESTONE 3
                </span>
                <p className="text-sm sm:text-base font-inria text-[#FFFFFF]/70 italic leading-relaxed">
                  “The AI interviewer voice engine and dynamic follow-up generator will initialize here in Milestone 3. Questions will adapt in real-time to your answers.”
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[#9EA6B0] pt-3.5 border-t border-white/[0.08]">
              <span>Rigor: {config.difficulty.replace('-', ' ').toUpperCase()}</span>
              <span>Domain: {config.topic}</span>
            </div>
          </div>

          {/* Transcript Panel Placeholder */}
          <div className="daemon-card rounded-xl p-6 relative">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-[#00F0FF]" />
                <span className="font-anton text-lg text-[#FFFFFF] uppercase tracking-wide">
                  Real-Time Transcript Stream
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#9EA6B0] px-2.5 py-0.5 rounded daemon-chip font-bold">
                STANDBY
              </span>
            </div>

            <div className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-center">
              <p className="text-xs font-mono text-[#9EA6B0] leading-relaxed">
                Live speech-to-text transcription will stream here during response capture. Transcripts will feed into post-session comparison and retry loops.
              </p>
            </div>
          </div>
        </div>

        {/* Module 2: Candidate Acoustic Sensor (Right Column, 5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Acoustic Visualizer & Sensor Panel */}
          <div className="daemon-card rounded-xl p-6 flex flex-col items-center text-center justify-between relative">
            <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
            <span className="daemon-crosshair-tr" aria-hidden="true">+</span>

            <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-[#00F0FF]" />
                <span className="font-anton text-lg text-[#FFFFFF] uppercase tracking-wide">
                  Acoustic Studio Sensor
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#00F0FF] px-2.5 py-0.5 rounded daemon-badge font-bold">
                ARMED
              </span>
            </div>

            {/* Centered Electric Cyan Acoustic Rings */}
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

            <div className="w-full mt-4 p-3.5 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-left">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#9EA6B0]">Channel:</span>
                <span className="text-[#FFFFFF] font-bold">
                  {config.mode === 'voice' ? 'Vocal (Microphone)' : 'Silent Typed (Keyboard)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono mt-1">
                <span className="text-[#9EA6B0]">Pipeline:</span>
                <span className="text-[#00F0FF]">Milestone 3 Integration</span>
              </div>
            </div>
          </div>

          {/* Module 3: Studio Control & Notice */}
          <div className="daemon-card rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
              <Sliders className="w-4 h-4 text-[#00F0FF]" />
              <span className="font-anton text-base text-[#FFFFFF] uppercase tracking-wide">
                Studio Verification Notice
              </span>
            </div>

            <div className="flex items-start gap-2.5 text-xs font-mono text-[#9EA6B0] leading-relaxed">
              <Sparkles className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
              <p>
                This studio workstation establishes the verified environment. No fabricated AI answers or false transcripts are generated. Live Whisper transcription and conversational question synthesis will be connected in <strong>Milestone 3</strong>.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={onBackToSetup}
                className="w-full py-2.5 px-4 rounded-lg daemon-chip hover:border-[#00F0FF]/50 text-xs font-mono text-[#FFFFFF] transition-colors inline-flex items-center justify-center gap-2 uppercase tracking-wider font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>Adjust Parameters</span>
              </button>
              <button
                type="button"
                onClick={onExitHome}
                className="w-full py-2.5 px-4 rounded-lg bg-[#0A0B0D] hover:bg-[#14181B] border border-white/[0.1] text-xs font-mono text-[#9EA6B0] hover:text-[#FFFFFF] transition-colors inline-flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Arena</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="w-full max-w-2xl text-center flex items-center justify-center gap-2 text-[11px] font-mono text-[#9EA6B0]">
        <ShieldAlert className="w-3.5 h-3.5 text-[#00F0FF]" />
        <span>Studio environment isolated. Ready for AI Interview Engine integration.</span>
      </div>
    </div>
  );
};
