import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Shield,
  Flame,
  Zap,
  Volume2,
  Keyboard,
  Mic,
  MicOff,
  Check,
  Compass,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { EchoRings } from './EchoRings';
import { useMicrophoneTest } from '../hooks/useMicrophoneTest';
import type {
  InterviewTrack,
  DifficultyLevel,
  PracticeMode,
  InterviewConfig,
  DifficultyOption,
} from '../types';

interface InterviewSetupProps {
  initialTrack?: InterviewTrack;
  initialMode?: PracticeMode;
  onBack: () => void;
  onEnterRoom: (config: InterviewConfig) => void;
}

const STORAGE_KEY_TRACK = 'echotutor_selected_track';
const STORAGE_KEY_MODE = 'echotutor_practice_mode';
const STORAGE_KEY_DIFFICULTY = 'echotutor_difficulty';
const STORAGE_KEY_TOPIC = 'echotutor_topic';
const STORAGE_KEY_CUSTOM_TOPIC = 'echotutor_custom_topic';

const difficultyOptions: DifficultyOption[] = [
  {
    id: 'foundation',
    title: 'Foundation',
    badge: 'CALIBRATION',
    description: 'Build confidence with straightforward questions and supportive follow-ups.',
    recommendation: 'Ideal for 1st/2nd years and initial interview rehearsals.',
  },
  {
    id: 'pressure-cooker',
    title: 'Pressure Cooker',
    badge: 'RECOMMENDED',
    description: 'Handle challenging questions, explain your reasoning, and respond to follow-up questions.',
    recommendation: 'Designed for on-campus placements and technical screenings.',
  },
  {
    id: 'executive',
    title: 'Executive / Edge Defense',
    badge: 'STRESS TEST',
    description: 'Defend assumptions, handle ambiguity, and respond to challenging scenario-based questions.',
    recommendation: 'Targeted at product engineering, FAANG, and leadership panels.',
  },
];

const technicalTopics = [
  'Python',
  'Data Structures and Algorithms',
  'Computer Networks',
  'Cybersecurity',
  'Web Development',
  'General Technical',
];

const hrTopics = [
  'Self-introduction',
  'Strengths and weaknesses',
  'Teamwork and conflict',
  'Leadership',
  'Problem-solving',
  'General HR',
];

export const InterviewSetup: React.FC<InterviewSetupProps> = ({
  initialTrack = 'technical',
  initialMode = 'voice',
  onBack,
  onEnterRoom,
}) => {
  // 1. Track State (persisted)
  const [track, setTrack] = useState<InterviewTrack>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRACK);
      if (saved === 'technical' || saved === 'hr') return saved;
    } catch {
      // Fallback
    }
    return initialTrack;
  });

  // 2. Difficulty State (persisted)
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DIFFICULTY);
      if (saved === 'foundation' || saved === 'pressure-cooker' || saved === 'executive') {
        return saved;
      }
    } catch {
      // Fallback
    }
    return 'pressure-cooker';
  });

  // 3. Topic State (persisted)
  const [topic, setTopic] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TOPIC);
      if (saved) return saved;
    } catch {
      // Fallback
    }
    return 'Data Structures and Algorithms';
  });

  // 4. Custom Topic State (persisted)
  const [customTopic, setCustomTopic] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_CUSTOM_TOPIC) || '';
    } catch {
      return '';
    }
  });

  // 5. Practice Mode (persisted)
  const [mode, setMode] = useState<PracticeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MODE);
      if (saved === 'voice' || saved === 'typed') return saved;
    } catch {
      // Fallback
    }
    return initialMode;
  });

  // Real microphone hook (opt-in only, no auto-request)
  const {
    audioLevel,
    isTesting,
    errorMessage,
    startTest,
    stopTest,
  } = useMicrophoneTest();

  const availableTopics = track === 'technical' ? technicalTopics : hrTopics;

  useEffect(() => {
    if (!availableTopics.includes(topic) && !customTopic.trim()) {
      setTopic(availableTopics[0]);
    }
  }, [track, availableTopics, topic, customTopic]);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRACK, track);
      localStorage.setItem(STORAGE_KEY_DIFFICULTY, difficulty);
      localStorage.setItem(STORAGE_KEY_TOPIC, topic);
      localStorage.setItem(STORAGE_KEY_CUSTOM_TOPIC, customTopic);
      localStorage.setItem(STORAGE_KEY_MODE, mode);
    } catch {
      // Ignore storage errors
    }
  }, [track, difficulty, topic, customTopic, mode]);

  const handleTrackChange = (newTrack: InterviewTrack) => {
    setTrack(newTrack);
    const defaults = newTrack === 'technical' ? technicalTopics : hrTopics;
    setTopic(defaults[0]);
  };

  const handleEnterRoom = () => {
    if (isTesting) {
      stopTest();
    }
    const finalTopic = customTopic.trim() ? customTopic.trim() : topic;
    onEnterRoom({
      track,
      difficulty,
      topic: finalTopic,
      customTopic: customTopic.trim(),
      mode,
    });
  };

  const difficultyIcons: Record<DifficultyLevel, React.ReactNode> = {
    foundation: <Shield className="w-4 h-4 text-[#B8FF62]" />,
    'pressure-cooker': <Flame className="w-4 h-4 text-[#B8FF62]" />,
    executive: <Zap className="w-4 h-4 text-[#B8FF62]" />,
  };

  const activeTopicDisplay = customTopic.trim() ? `${customTopic.trim()} (Custom Focus)` : topic;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center animate-fade-in">
      {/* Top Breadcrumb & Step Metadata */}
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-3.5 mb-6 sm:mb-8">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#B8FF62] tracking-wider uppercase font-semibold">
            CALIBRATION // 002
          </span>
          <span className="text-xs text-[#8A9389]">•</span>
          <span className="text-xs font-mono text-[#8A9389] uppercase tracking-wide">
            Studio Parameters
          </span>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-mono text-[#8A9389] hover:text-[#B8FF62] transition-colors focus:outline-none focus:underline"
        >
          ← Return to Arena
        </button>
      </div>

      {/* Hero Console Banner with Metallic Sheen */}
      <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 sm:mb-10 chrome-panel p-6 sm:p-8 rounded-2xl">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 mb-2.5 px-3 py-1 rounded-full chrome-badge">
            <Compass className="w-3.5 h-3.5 text-[#B8FF62]" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#B8FF62] font-semibold">
              ACOUSTIC CALIBRATION DECK
            </span>
          </div>
          <h1 className="font-space font-bold text-2xl sm:text-3xl md:text-4xl text-[#E8EAE5] tracking-tight">
            Calibrate Studio Parameters
          </h1>
          <p className="text-sm sm:text-base text-[#8A9389] mt-2 leading-relaxed">
            Configure rigor level, domain focus, and acoustic transmission mode before stepping
            into the live interview studio.
          </p>
        </div>

        {/* Compact Echo Rings Indicator */}
        <div className="shrink-0 flex items-center gap-4 self-center md:self-auto p-3.5 rounded-2xl chrome-badge">
          <EchoRings
            size="sm"
            state={isTesting ? 'recording' : 'idle'}
            audioLevel={audioLevel}
            showStatusLabel={false}
          />
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-mono uppercase text-[#8A9389] tracking-wider">
              Acoustic Core
            </span>
            <span className="text-xs font-mono text-[#B8FF62] font-semibold">
              {isTesting ? `Live Input ${(audioLevel * 100).toFixed(0)}%` : 'Studio Ready'}
            </span>
            <span className="text-[10px] font-mono text-[#8A9389]">
              {mode === 'voice' ? 'Vocal channel armed' : 'Silent typed channel'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Studio Controls */}
      <div className="w-full space-y-8">
        {/* 1. Track Selection Switcher */}
        <section aria-labelledby="track-heading" className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 id="track-heading" className="font-space font-bold text-lg sm:text-xl text-[#E8EAE5]">
              1. Interview Track
            </h2>
            <span className="text-[11px] font-mono text-[#8A9389]">
              ACTIVE: <span className="text-[#B8FF62] uppercase font-semibold">{track}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => handleTrackChange('technical')}
              className={`p-5 rounded-2xl text-left transition-all ${
                track === 'technical'
                  ? 'chrome-panel-active'
                  : 'chrome-panel chrome-panel-hover'
              } focus:outline-none focus:ring-2 focus:ring-[#B8FF62]`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-[#8A9389]">TRACK // 01</span>
                {track === 'technical' && (
                  <span className="w-2 h-2 rounded-full bg-[#B8FF62] shadow-[0_0_8px_#B8FF62]" />
                )}
              </div>
              <h3 className="font-space font-bold text-base sm:text-lg text-[#E8EAE5]">
                Technical Interview
              </h3>
              <p className="font-mono text-xs text-[#B8FF62] mt-0.5">“Explain. Defend. Solve.”</p>
              <p className="text-xs text-[#8A9389] mt-2 leading-relaxed">
                Systems architecture, trade-off analysis, and algorithmic defense under live scrutiny.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleTrackChange('hr')}
              className={`p-5 rounded-2xl text-left transition-all ${
                track === 'hr'
                  ? 'chrome-panel-active'
                  : 'chrome-panel chrome-panel-hover'
              } focus:outline-none focus:ring-2 focus:ring-[#B8FF62]`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-[#8A9389]">TRACK // 02</span>
                {track === 'hr' && (
                  <span className="w-2 h-2 rounded-full bg-[#B8FF62] shadow-[0_0_8px_#B8FF62]" />
                )}
              </div>
              <h3 className="font-space font-bold text-base sm:text-lg text-[#E8EAE5]">
                HR & Behavioral
              </h3>
              <p className="font-mono text-xs text-[#B8FF62] mt-0.5">“Communicate with clarity.”</p>
              <p className="text-xs text-[#8A9389] mt-2 leading-relaxed">
                STAR narrative framing, conflict resolution, ownership decisions, and leadership presence.
              </p>
            </button>
          </div>
        </section>

        {/* 2. Difficulty Level Selection */}
        <section aria-labelledby="difficulty-heading" className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 id="difficulty-heading" className="font-space font-bold text-lg sm:text-xl text-[#E8EAE5]">
              2. Rigor Calibration
            </h2>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#8A9389]">
              <HelpCircle className="w-3.5 h-3.5 text-[#B8FF62]" />
              <span>Prompt Depth Matrix</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {difficultyOptions.map((opt) => {
              const isSelected = difficulty === opt.id;
              return (
                <div
                  key={opt.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => setDifficulty(opt.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDifficulty(opt.id);
                    }
                  }}
                  className={`p-5 rounded-2xl cursor-pointer text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'chrome-panel-active'
                      : 'chrome-panel chrome-panel-hover'
                  } focus:outline-none focus:ring-2 focus:ring-[#B8FF62]`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full chrome-badge text-[#B8FF62] font-semibold">
                        {opt.badge}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-[#B8FF62] bg-[#B8FF62] text-[#0B0D0C] shadow-[0_0_8px_#B8FF62]'
                            : 'border-white/10'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-1.5">
                      {difficultyIcons[opt.id]}
                      <h3 className="font-space font-bold text-base text-[#E8EAE5]">
                        {opt.title}
                      </h3>
                    </div>

                    <p className="text-xs text-[#8A9389] leading-relaxed mb-4">
                      {opt.description}
                    </p>
                  </div>

                  <span className="text-[10px] font-mono text-[#8A9389] pt-3 border-t border-white/[0.06]">
                    {opt.recommendation}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] font-mono text-[#8A9389] mt-1">
            Note: Difficulty calibration defines the rigor of follow-up challenges. Engine integration connects in Milestone 3.
          </p>
        </section>

        {/* 3. Topic or Role Focus */}
        <section aria-labelledby="topic-heading" className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 id="topic-heading" className="font-space font-bold text-lg sm:text-xl text-[#E8EAE5]">
              3. Specialization Domain
            </h2>
            <span className="text-[11px] font-mono text-[#8A9389]">
              {availableTopics.length} PRESET MODULES + CUSTOM FOCUS
            </span>
          </div>

          {/* Preset Topics Badges */}
          <div className="flex flex-wrap gap-2">
            {availableTopics.map((top) => {
              const isSelected = topic === top && !customTopic.trim();
              return (
                <button
                  key={top}
                  type="button"
                  onClick={() => {
                    setTopic(top);
                    setCustomTopic('');
                  }}
                  className={`text-xs font-mono px-4 py-2.5 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'bg-[#B8FF62] text-[#0B0D0C] border-[#B8FF62] font-semibold shadow-[0_0_12px_rgba(184,255,98,0.3)]'
                      : 'chrome-panel chrome-panel-hover text-[#E8EAE5]'
                  } focus:outline-none focus:ring-1 focus:ring-[#B8FF62]`}
                >
                  {top}
                </button>
              );
            })}
          </div>

          {/* Optional Custom Topic Input with Metallic Focus */}
          <div className="mt-3 p-4 rounded-2xl chrome-panel">
            <label htmlFor="custom-topic-input" className="block text-xs font-mono text-[#8A9389] mb-2.5">
              CUSTOM TARGET ROLE OR SPECIALIZED TOPIC (OPTIONAL):
            </label>
            <div className="relative">
              <input
                id="custom-topic-input"
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder={
                  track === 'technical'
                    ? 'e.g. Distributed Consensus, Golang Microservices, React 19 Concurrency...'
                    : 'e.g. Scaling Engineering Teams, Cross-functional Stakeholder Alignment...'
                }
                className="w-full bg-[#0B0D0C] text-[#E8EAE5] text-xs sm:text-sm font-mono placeholder:text-[#8A9389]/40 px-4 py-3 rounded-xl border border-white/10 focus:border-[#B8FF62] focus:ring-1 focus:ring-[#B8FF62] focus:outline-none transition-all"
              />
              {customTopic && (
                <button
                  type="button"
                  onClick={() => setCustomTopic('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[#8A9389] hover:text-[#E8EAE5] px-2 py-1 rounded-md chrome-badge"
                >
                  Clear
                </button>
              )}
            </div>
            {customTopic.trim() && (
              <p className="text-[11px] font-mono text-[#B8FF62] mt-2">
                ✓ Custom override active: “{customTopic.trim()}”
              </p>
            )}
          </div>
        </section>

        {/* 4. Practice Mode & Opt-in Microphone Test */}
        <section aria-labelledby="mode-heading" className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 id="mode-heading" className="font-space font-bold text-lg sm:text-xl text-[#E8EAE5]">
              4. Response Transmission Channel
            </h2>
            <span className="text-[11px] font-mono text-[#8A9389]">
              MODE: <span className="text-[#B8FF62] uppercase font-semibold">{mode}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setMode('voice')}
              className={`p-5 rounded-2xl text-left transition-all ${
                mode === 'voice'
                  ? 'chrome-panel-active'
                  : 'chrome-panel chrome-panel-hover'
              } focus:outline-none focus:ring-2 focus:ring-[#B8FF62]`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#B8FF62]" />
                  <span className="font-space font-bold text-base text-[#E8EAE5]">
                    Voice Transmission Mode
                  </span>
                </div>
                {mode === 'voice' && (
                  <span className="w-2 h-2 rounded-full bg-[#B8FF62] shadow-[0_0_8px_#B8FF62]" />
                )}
              </div>
              <p className="text-xs text-[#8A9389] leading-relaxed">
                Vocal answer delivery under real-time acoustic pressure. Microphone required.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('typed');
                if (isTesting) stopTest();
              }}
              className={`p-5 rounded-2xl text-left transition-all ${
                mode === 'typed'
                  ? 'chrome-panel-active'
                  : 'chrome-panel chrome-panel-hover'
              } focus:outline-none focus:ring-2 focus:ring-[#B8FF62]`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-[#B8FF62]" />
                  <span className="font-space font-bold text-base text-[#E8EAE5]">
                    Silent Typed Mode
                  </span>
                </div>
                {mode === 'typed' && (
                  <span className="w-2 h-2 rounded-full bg-[#B8FF62] shadow-[0_0_8px_#B8FF62]" />
                )}
              </div>
              <p className="text-xs text-[#8A9389] leading-relaxed">
                Keyboard-based answers with zero ambient noise. Ideal for quiet libraries and dorms.
              </p>
            </button>
          </div>

          {/* Opt-in Microphone Test for Voice Mode */}
          {mode === 'voice' && (
            <div className="p-4 rounded-2xl chrome-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#B8FF62] shadow-[0_0_8px_#B8FF62]" />
                <span className="text-xs font-mono text-[#E8EAE5]">
                  Microphone Readiness Check (Optional):
                </span>
                {isTesting && (
                  <span className="text-xs font-mono text-[#B8FF62] font-semibold">
                    Signal: {(audioLevel * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (isTesting) {
                    stopTest();
                  } else {
                    await startTest();
                  }
                }}
                className={`text-xs font-mono px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2 ${
                  isTesting
                    ? 'bg-[#B8FF62] text-[#0B0D0C] font-semibold shadow-[0_0_12px_rgba(184,255,98,0.3)]'
                    : 'chrome-badge hover:border-white/20 text-[#E8EAE5]'
                }`}
              >
                {isTesting ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Stop Mic Test</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-[#B8FF62]" />
                    <span>Test Microphone Input</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-[#FF8277]/10 border border-[#FF8277]/40 text-xs font-mono text-[#FF8277] flex items-center justify-between gap-2 shadow-[0_0_16px_rgba(255,130,119,0.1)]">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setMode('typed')}
                className="shrink-0 underline hover:text-[#E8EAE5]"
              >
                Switch to Typed Mode
              </button>
            </div>
          )}
        </section>

        {/* 5. Session Dossier & Enter Interview Room */}
        <section
          aria-labelledby="prep-heading"
          className="p-6 sm:p-8 rounded-2xl chrome-panel space-y-6"
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[#B8FF62]" />
              <h2 id="prep-heading" className="font-space font-bold text-lg sm:text-xl text-[#E8EAE5]">
                5. Session Dossier & Protocols
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#B8FF62] uppercase font-semibold">
              CALIBRATED
            </span>
          </div>

          {/* Verified Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3.5 rounded-xl bg-[#0B0D0C] border border-white/[0.06]">
              <span className="text-[10px] font-mono text-[#8A9389] uppercase block">
                Arena Track
              </span>
              <span className="text-xs font-mono text-[#E8EAE5] font-semibold mt-1 block truncate">
                {track === 'technical' ? 'Technical Interview' : 'HR & Behavioral'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B0D0C] border border-white/[0.06]">
              <span className="text-[10px] font-mono text-[#8A9389] uppercase block">
                Rigor Level
              </span>
              <span className="text-xs font-mono text-[#B8FF62] font-semibold mt-1 block truncate capitalize">
                {difficulty.replace('-', ' ')}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B0D0C] border border-white/[0.06]">
              <span className="text-[10px] font-mono text-[#8A9389] uppercase block">
                Focus Domain
              </span>
              <span className="text-xs font-mono text-[#E8EAE5] font-semibold mt-1 block truncate">
                {activeTopicDisplay}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B0D0C] border border-white/[0.06]">
              <span className="text-[10px] font-mono text-[#8A9389] uppercase block">
                Transmission
              </span>
              <span className="text-xs font-mono text-[#E8EAE5] font-semibold mt-1 block truncate">
                {mode === 'voice' ? 'Voice (Acoustic)' : 'Silent Typed'}
              </span>
            </div>
          </div>

          {/* Preparation Advice */}
          <div className="p-4 rounded-xl bg-[#0B0D0C] border border-white/[0.06] text-xs text-[#8A9389] space-y-2 font-mono">
            <p className="text-[#E8EAE5] font-semibold">TACTICAL PREPARATION PROTOCOL:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>Observe a 3-second strategic pause before answering to organize response pillars.</li>
              <li>Structure responses cleanly: Context → Core Decision / Trade-off → Concrete Outcome.</li>
              <li>Under pressure, state assumptions explicitly rather than guessing silently.</li>
            </ul>
          </div>

          {/* Primary Action Button: Enter Interview Room */}
          <div className="pt-2">
            <button
              type="button"
              id="enter-interview-room-btn"
              onClick={handleEnterRoom}
              className="w-full min-h-[56px] px-8 py-4 rounded-xl bg-[#B8FF62] hover:bg-[#9DE644] active:scale-[0.99] text-[#0B0D0C] font-space font-bold text-base sm:text-lg tracking-tight inline-flex items-center justify-center gap-2.5 transition-all shadow-[0_0_24px_rgba(184,255,98,0.25)] focus:outline-none focus:ring-2 focus:ring-[#B8FF62] focus:ring-offset-2 focus:ring-offset-[#0B0D0C]"
            >
              <span>Enter Interview Studio</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
            <p className="text-center text-[11px] font-mono text-[#8A9389] mt-3">
              Zero judgment. Calibrated for deliberate practice and iterative improvement under pressure.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
