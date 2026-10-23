import React from 'react';
import { ArrowLeft, CheckCircle2, Cpu, Sparkles, RefreshCw } from 'lucide-react';
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
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14 flex flex-col items-center text-center animate-fade-in">
      {/* Session Breadcrumb Tag */}
      <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded bg-[#1B201D] border border-[#28302B]">
        <span className="w-2 h-2 rounded-full bg-[#B8FF62] animate-pulse" />
        <span className="font-mono text-xs uppercase tracking-widest text-[#B8FF62]">
          ROOM // 001 — LIVE ACOUSTIC STANDBY
        </span>
      </div>

      {/* Main Echo Rings Acoustic Core in Standby */}
      <div className="my-4 sm:my-6">
        <EchoRings
          size="responsive"
          state="idle"
          showStatusLabel={true}
          customLabel="ROOM STANDBY"
          customText="Awaiting Engine Link"
          customSubtext="Parameters locked and calibrated"
        />
      </div>

      {/* Heading */}
      <h1 className="font-space font-bold text-2xl xs:text-3xl sm:text-4xl text-[#E8EAE5] tracking-tight max-w-xl mb-3">
        Interview Room Calibrated
      </h1>
      <p className="text-sm sm:text-base text-[#929991] max-w-lg mb-8 leading-relaxed">
        Your personalized practice environment has been established. The live AI conversational
        engine will be connected in Milestone 3.
      </p>

      {/* Configuration Dossier Card */}
      <div className="w-full max-w-2xl bg-[#1B201D] border border-[#28302B] rounded-2xl p-5 sm:p-7 text-left mb-8 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#28302B]/60 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#B8FF62]" />
            <h2 className="font-space font-bold text-base sm:text-lg text-[#E8EAE5]">
              Session Configuration Dossier
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#B8FF62] inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>VERIFIED</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-[#101211] border border-[#28302B]">
            <span className="text-[#929991] uppercase block text-[10px]">Track Arena</span>
            <span className="text-[#E8EAE5] font-semibold text-sm mt-0.5 block">
              {config.track === 'technical' ? 'Technical Interview' : 'HR & Behavioral'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#101211] border border-[#28302B]">
            <span className="text-[#929991] uppercase block text-[10px]">Rigor Level</span>
            <span className="text-[#B8FF62] font-semibold text-sm mt-0.5 block capitalize">
              {config.difficulty.replace('-', ' ')}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#101211] border border-[#28302B]">
            <span className="text-[#929991] uppercase block text-[10px]">Topic Focus</span>
            <span className="text-[#E8EAE5] font-semibold text-sm mt-0.5 block truncate">
              {config.topic}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#101211] border border-[#28302B]">
            <span className="text-[#929991] uppercase block text-[10px]">Response Pipeline</span>
            <span className="text-[#E8EAE5] font-semibold text-sm mt-0.5 block">
              {config.mode === 'voice' ? 'Voice Mode (Microphone)' : 'Silent Typed Mode (Keyboard)'}
            </span>
          </div>
        </div>

        {/* Milestone 3 Notice Banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-[#101211] border border-[#28302B] flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-[#B8FF62] shrink-0 mt-0.5" />
          <p className="text-xs font-mono text-[#929991] leading-relaxed">
            <strong className="text-[#E8EAE5]">Next Milestone Preview:</strong> Milestone 3 will
            activate the live speech-to-text pipeline, dynamic AI follow-up questions, and verbal
            clarity analysis. No simulated or fake AI answers are generated prematurely.
          </p>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
        <button
          type="button"
          onClick={onBackToSetup}
          className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-xl bg-[#1B201D] hover:bg-[#232A26] border border-[#28302B] hover:border-[#B8FF62]/40 text-[#E8EAE5] font-mono text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-[#B8FF62]"
        >
          <RefreshCw className="w-4 h-4 text-[#B8FF62]" />
          <span>Adjust Calibration</span>
        </button>

        <button
          type="button"
          onClick={onExitHome}
          className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-xl bg-[#101211] hover:bg-[#1B201D] border border-[#28302B] text-[#929991] hover:text-[#E8EAE5] font-mono text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-1 focus:ring-[#B8FF62]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Main Arena</span>
        </button>
      </div>
    </div>
  );
};
