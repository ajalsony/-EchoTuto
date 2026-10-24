import React from 'react';
import { Volume2, VolumeX, RotateCcw, Sliders, ChevronDown } from 'lucide-react';
import type { UseSpeechSynthesisReturn } from '../../hooks/useSpeechSynthesis';

interface QuestionVoiceSpeakerProps {
  questionText: string;
  speech: UseSpeechSynthesisReturn;
  autoSpokenRef?: React.MutableRefObject<boolean>;
}

export const QuestionVoiceSpeaker: React.FC<QuestionVoiceSpeakerProps> = ({
  questionText,
  speech,
}) => {
  const {
    isSupported,
    isSpeaking,
    speak,
    stop,
    replay,
    voices,
    selectedVoiceURI,
    setSelectedVoiceURI,
  } = speech;

  if (!isSupported) {
    return (
      <div className="text-[11px] font-mono text-[#9EA6B0]/70 flex items-center gap-1.5 py-1">
        <VolumeX className="w-3.5 h-3.5 text-[#9EA6B0]/50" />
        <span>Voice playback unsupported in this browser</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
      {/* Speech Action Buttons */}
      <div className="flex items-center gap-2">
        {isSpeaking ? (
          <button
            type="button"
            id="stop-question-speech-btn"
            onClick={stop}
            className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[#FF4D6D]/15 hover:bg-[#FF4D6D]/25 border border-[#FF4D6D]/50 text-[#FF4D6D] uppercase tracking-wider inline-flex items-center gap-1.5 transition-all font-bold min-h-[34px]"
            title="Stop AI interviewer speech"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Stop Speaking</span>
          </button>
        ) : (
          <button
            type="button"
            id="speak-question-btn"
            onClick={() => speak(questionText)}
            className="text-xs font-mono px-3 py-1.5 rounded-lg daemon-badge hover:border-[#00F0FF] text-[#00F0FF] uppercase tracking-wider inline-flex items-center gap-1.5 transition-all font-bold min-h-[34px]"
            title="Listen to AI interviewer speak this question"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Speak Question</span>
          </button>
        )}

        <button
          type="button"
          id="replay-question-btn"
          onClick={() => replay(questionText)}
          className="text-xs font-mono px-2.5 py-1.5 rounded-lg daemon-card daemon-card-hover text-[#9EA6B0] hover:text-[#FFFFFF] uppercase tracking-wider inline-flex items-center gap-1.5 transition-all min-h-[34px]"
          title="Replay question from beginning"
        >
          <RotateCcw className="w-3 h-3 text-[#00F0FF]" />
          <span>Replay</span>
        </button>

        {isSpeaking && (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#00F0FF]/10 text-[10px] font-mono text-[#00F0FF] font-bold animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
            <span>SPEAKING...</span>
          </div>
        )}
      </div>

      {/* Voice Selector Dropdown (when voices available) */}
      {voices.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <Sliders className="w-3 h-3 text-[#9EA6B0]" />
          <span className="text-[#9EA6B0] text-[10px] uppercase">Voice:</span>
          <div className="relative inline-flex items-center">
            <select
              id="ai-voice-selector"
              value={selectedVoiceURI}
              onChange={(e) => setSelectedVoiceURI(e.target.value)}
              className="bg-[#14181B] border border-white/[0.08] hover:border-white/[0.2] text-[#FFFFFF] text-[11px] font-mono rounded px-2 py-1 pr-6 focus:outline-none focus:border-[#00F0FF] appearance-none cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
              title="Select speech synthesis voice"
            >
              {voices
                .filter((v) => v.lang.startsWith('en'))
                .map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI} className="bg-[#14181B] text-white">
                    {v.name} ({v.lang})
                  </option>
                ))}
              {voices.filter((v) => !v.lang.startsWith('en')).slice(0, 10).map((v) => (
                <option key={v.voiceURI} value={v.voiceURI} className="bg-[#14181B] text-white">
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-[#9EA6B0] absolute right-1.5 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
};
