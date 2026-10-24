import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  RotateCcw,
  Keyboard,
  AlertCircle,
  SlidersHorizontal,
  Send,
  Loader2,
  Shield,
  Activity,
} from 'lucide-react';
import { EchoRings } from '../EchoRings';
import type { UseSpeechRecognitionReturn } from '../../hooks/useSpeechRecognition';
import type { useMicrophoneTest } from '../../hooks/useMicrophoneTest';

interface VoiceSpeechConsoleProps {
  // Speech Recognition Hook
  speechRec: UseSpeechRecognitionReturn;
  // Microphone Calibration Hook
  micTest: ReturnType<typeof useMicrophoneTest>;
  // Active Transcript state & setter
  value: string;
  onChange: (text: string) => void;
  // Submission
  onSubmit: () => void;
  isSubmitting: boolean;
  submitButtonText?: string;
  // Mode switcher
  onSwitchToTyped: () => void;
  // Contextual helper & placeholder
  placeholder?: string;
  guideTitle?: string;
  guideText?: string;
  idPrefix?: string;
}

export const VoiceSpeechConsole: React.FC<VoiceSpeechConsoleProps> = ({
  speechRec,
  micTest,
  value,
  onChange,
  onSubmit,
  isSubmitting,
  submitButtonText = 'Submit Answer for AI Evaluation',
  onSwitchToTyped,
  placeholder = 'Your spoken response will be transcribed here in real-time. You can edit the text before submitting...',
  guideTitle,
  guideText,
  idPrefix = 'candidate-voice',
}) => {
  const [showMicCalibration, setShowMicCalibration] = useState(false);

  const {
    isSupported: isRecSupported,
    state: recState,
    interimTranscript,
    audioLevel: recAudioLevel,
    errorMessage: recError,
    startListening,
    stopListening,
    resetTranscript,
  } = speechRec;

  const {
    micStatus,
    audioLevel: testAudioLevel,
    isTesting: isMicTesting,
    errorMessage: micTestError,
    startTest: startMicTest,
    stopTest: stopMicTest,
  } = micTest;

  const isListening = recState === 'listening';
  const activeAudioLevel = isListening ? recAudioLevel : isMicTesting ? testAudioLevel : 0;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  // Human-readable status mapping for Step 2 calibration
  const micStatusLabels: Record<string, { label: string; color: string; desc: string }> = {
    idle: { label: 'Not Tested', color: 'text-[#9EA6B0]', desc: 'Microphone has not been calibrated yet' },
    requesting: { label: 'Requesting...', color: 'text-[#00F0FF]', desc: 'Prompting for microphone permission' },
    testing: { label: 'Testing...', color: 'text-[#00F0FF]', desc: 'Speak into your microphone to calibrate' },
    ready: { label: 'Microphone Ready', color: 'text-[#7AE582]', desc: 'Input sound detected and verified' },
    'no-audio': { label: 'No Audio Detected', color: 'text-[#FFB800]', desc: 'Check microphone volume or hardware connection' },
    active: { label: 'Microphone Active', color: 'text-[#7AE582]', desc: 'Input stream open' },
    denied: { label: 'Permission Denied', color: 'text-[#FF4D6D]', desc: 'Microphone blocked in browser settings' },
    missing: { label: 'No Microphone Found', color: 'text-[#FF4D6D]', desc: 'Connect a microphone device to continue' },
    unsupported: { label: 'Unsupported', color: 'text-[#FF4D6D]', desc: 'Browser does not support audio capture' },
    error: { label: 'Hardware Error', color: 'text-[#FF4D6D]', desc: 'Failed to access audio hardware' },
  };

  const currentMicInfo = micStatusLabels[micStatus] || micStatusLabels.idle;

  return (
    <div className="daemon-card rounded-xl p-6 relative space-y-5">
      <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
      <span className="daemon-crosshair-tr" aria-hidden="true">+</span>

      {/* Top Header Bar: Mode & State Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
          <span className="text-xs font-mono uppercase tracking-wider text-[#FFFFFF] font-bold">
            VOICE INPUT & SPEECH-TO-TEXT CONSOLE
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Calibration Toggle */}
          <button
            type="button"
            id={`${idPrefix}-toggle-mic-cal-btn`}
            onClick={() => setShowMicCalibration((prev) => !prev)}
            className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#14181B] hover:bg-[#1B2126] border border-white/[0.08] text-[#9EA6B0] hover:text-[#00F0FF] inline-flex items-center gap-1.5 transition-all"
            title="Toggle microphone diagnostic calibration"
          >
            <SlidersHorizontal className="w-3 h-3 text-[#00F0FF]" />
            <span>Calibrate Mic ({currentMicInfo.label})</span>
          </button>

          {/* Switch to Typed Mode Button */}
          <button
            type="button"
            id={`${idPrefix}-switch-typed-btn`}
            onClick={onSwitchToTyped}
            className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#14181B] hover:bg-[#1B2126] border border-white/[0.08] text-[#9EA6B0] hover:text-white inline-flex items-center gap-1.5 transition-all"
            title="Switch to Silent Typed Mode"
          >
            <Keyboard className="w-3 h-3 text-[#00F0FF]" />
            <span>Silent Typed Mode</span>
          </button>
        </div>
      </div>

      {/* Optional Step 2 Microphone Calibration Drawer */}
      {showMicCalibration && (
        <div className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.1] space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00F0FF]" />
              <span className="text-xs font-mono text-white uppercase font-bold">
                Hardware Calibration Diagnostic
              </span>
            </div>
            <span className={`text-xs font-mono font-bold uppercase ${currentMicInfo.color}`}>
              STATUS: {currentMicInfo.label}
            </span>
          </div>

          <p className="text-xs font-mono text-[#9EA6B0] leading-relaxed">
            {currentMicInfo.desc}. Speak into your microphone to verify that live acoustic frequencies register before answering.
          </p>

          {/* Live Audio Level Meter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#9EA6B0]">
              <span>LIVE SIGNAL LEVEL:</span>
              <span className="text-[#00F0FF] font-bold">{(testAudioLevel * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#14181B] overflow-hidden border border-white/[0.08] relative">
              <div
                className="h-full bg-gradient-to-r from-[#00F0FF] to-[#7AE582] transition-all duration-75"
                style={{ width: `${Math.min(100, testAudioLevel * 100)}%` }}
              />
            </div>
          </div>

          {/* Test Controls */}
          <div className="flex items-center gap-2.5 pt-1">
            {isMicTesting ? (
              <button
                type="button"
                id={`${idPrefix}-stop-test-btn`}
                onClick={stopMicTest}
                className="text-xs font-mono px-3 py-1.5 rounded bg-[#FF4D6D]/20 hover:bg-[#FF4D6D]/30 border border-[#FF4D6D]/50 text-[#FF4D6D] uppercase tracking-wider font-bold inline-flex items-center gap-1.5 transition-all"
              >
                <MicOff className="w-3.5 h-3.5" />
                <span>Stop Test</span>
              </button>
            ) : (
              <button
                type="button"
                id={`${idPrefix}-start-test-btn`}
                onClick={startMicTest}
                className="text-xs font-mono px-3 py-1.5 rounded bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] uppercase tracking-wider font-bold inline-flex items-center gap-1.5 transition-all"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{micStatus === 'ready' || micStatus === 'no-audio' ? 'Test Again' : 'Calibrate Microphone'}</span>
              </button>
            )}

            {micTestError && (
              <span className="text-xs font-mono text-[#FF4D6D]">{micTestError}</span>
            )}
          </div>
        </div>
      )}

      {/* Recognition State & Visualizer Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#0A0B0D] border border-white/[0.08]">
        {/* Left: Concentric visualizer & status info */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0 w-16 h-16 flex items-center justify-center">
            <EchoRings
              size="sm"
              state={isListening ? 'recording' : recState === 'error' ? 'error' : 'idle'}
              audioLevel={activeAudioLevel}
              showStatusLabel={false}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-anton text-white uppercase tracking-wider">
                {isListening
                  ? 'LISTENING TO MICROPHONE'
                  : recState === 'completed'
                  ? 'SPEECH CAPTURED'
                  : recState === 'error'
                  ? 'RECOGNITION NOTICE'
                  : 'READY TO ANSWER'}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  isListening
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] animate-pulse border border-[#00F0FF]/40'
                    : recState === 'completed'
                    ? 'bg-[#7AE582]/20 text-[#7AE582] border border-[#7AE582]/40'
                    : recState === 'error'
                    ? 'bg-[#FF4D6D]/20 text-[#FF4D6D] border border-[#FF4D6D]/40'
                    : 'daemon-badge'
                }`}
              >
                {recState}
              </span>
            </div>

            <p className="text-xs font-mono text-[#9EA6B0] mt-1">
              {isListening
                ? 'Speak clearly into your microphone. Words are transcribed in real-time.'
                : recState === 'completed'
                ? 'Answer transcribed. You can edit the text below before final submission.'
                : recState === 'error'
                ? 'Voice recognition issue encountered. You can speak again or type below.'
                : 'Click Start Answering below when you are ready to speak your solution.'}
            </p>
          </div>
        </div>

        {/* Right: Live Audio Level Meter Bar */}
        {isListening && (
          <div className="w-full sm:w-44 shrink-0 flex flex-col gap-1.5 p-2.5 rounded bg-[#14181B] border border-white/[0.06]">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-[#9EA6B0]">LIVE ACOUSTIC:</span>
              <span className="text-[#00F0FF] font-bold">{(recAudioLevel * 100).toFixed(0)}%</span>
            </div>
            {/* Multi-segment LED frequency visualizer */}
            <div className="flex items-center gap-0.5 h-3">
              {Array.from({ length: 14 }).map((_, i) => {
                const threshold = (i + 1) / 14;
                const isActive = recAudioLevel >= threshold;
                return (
                  <div
                    key={i}
                    className={`flex-1 h-full rounded-sm transition-all duration-75 ${
                      isActive
                        ? i > 10
                          ? 'bg-[#FF4D6D] shadow-[0_0_6px_#FF4D6D]'
                          : i > 6
                          ? 'bg-[#00F0FF] shadow-[0_0_6px_#00F0FF]'
                          : 'bg-[#7AE582] shadow-[0_0_4px_#7AE582]'
                        : 'bg-white/[0.06]'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Recognition Error Alert */}
      {recError && (
        <div className="p-3.5 rounded-lg bg-[#FF4D6D]/15 border border-[#FF4D6D]/40 text-xs font-mono text-[#FF4D6D] flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{recError}</span>
          </div>
          <button
            type="button"
            onClick={onSwitchToTyped}
            className="text-white hover:underline uppercase font-bold shrink-0 text-[11px]"
          >
            Switch to Typed Mode
          </button>
        </div>
      )}

      {/* Domain Guidance Note */}
      {guideText && (
        <div className="p-3 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-xs font-mono text-[#9EA6B0]">
          💡 <strong className="text-white">{guideTitle || 'Strategy Guide'}:</strong> {guideText}
        </div>
      )}

      {/* Primary Voice Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {isListening ? (
          <button
            type="button"
            id={`${idPrefix}-stop-recording-btn`}
            onClick={stopListening}
            className="min-h-[46px] px-6 py-2.5 rounded-lg bg-[#FF4D6D] hover:bg-[#FF3355] text-white font-anton text-sm uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-[0_0_16px_rgba(255,77,109,0.35)]"
          >
            <MicOff className="w-4 h-4 stroke-[2.5]" />
            <span>[ Stop Recording ]</span>
          </button>
        ) : (
          <button
            type="button"
            id={`${idPrefix}-start-answering-btn`}
            onClick={() => startListening(value)}
            disabled={!isRecSupported || isSubmitting}
            className="min-h-[46px] px-6 py-2.5 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] text-[#0A0B0D] font-anton text-sm uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-[0_0_16px_rgba(0,240,255,0.35)] disabled:opacity-50"
          >
            <Mic className="w-4 h-4 stroke-[2.5]" />
            <span>[ {value.trim() ? 'Continue Answering (Record)' : 'Start Answering (Voice)'} ]</span>
          </button>
        )}

        {value.trim() && !isListening && (
          <button
            type="button"
            id={`${idPrefix}-retry-recording-btn`}
            onClick={resetTranscript}
            className="min-h-[46px] px-4 py-2.5 rounded-lg daemon-card daemon-card-hover text-[#9EA6B0] hover:text-white font-mono text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-all"
            title="Clear current transcription and retry recording from scratch"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Retry Recording (Clear)</span>
          </button>
        )}

        {!isRecSupported && (
          <span className="text-xs font-mono text-[#FFB800] flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Browser Web Speech not supported — use Typed Mode below.</span>
          </span>
        )}
      </div>

      {/* Live Interim Transcript Bubble (while speaking) */}
      {isListening && interimTranscript && (
        <div className="p-3 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-xs font-mono text-[#00F0FF] animate-pulse flex items-start gap-2">
          <span className="font-bold shrink-0">Interim:</span>
          <span className="italic leading-relaxed">{interimTranscript}</span>
        </div>
      )}

      {/* Editable Finalized Transcript Textarea */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono text-[#9EA6B0]">
          <span className="uppercase tracking-wider">
            Candidate Answer Transcript (Editable):
          </span>
          <span>{wordCount} words</span>
        </div>

        <textarea
          id={`${idPrefix}-transcript-input`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={6}
          className="w-full bg-[#0A0B0D] text-[#FFFFFF] text-sm font-mono placeholder:text-[#9EA6B0]/40 p-4 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:outline-none transition-all leading-relaxed"
        />
      </div>

      {/* Bottom Bar: Never Auto-Submit Notice + Explicit Submit Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.08]">
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#9EA6B0]">
          <Shield className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span>REVIEW & SUBMIT: NEVER AUTO-SUBMITTED • YOU RETAIN FULL EDIT CONTROL</span>
        </div>

        <button
          type="button"
          id={`${idPrefix}-submit-btn`}
          onClick={onSubmit}
          disabled={!value.trim() || isSubmitting || isListening}
          className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] active:scale-[0.98] text-[#0A0B0D] font-anton text-base tracking-wider uppercase inline-flex items-center justify-center gap-2 transition-all shadow-[0_0_16px_rgba(0,240,255,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>EVALUATING SUBSTANCE...</span>
            </>
          ) : (
            <>
              <span>[ {submitButtonText} ]</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
