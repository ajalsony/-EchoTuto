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
import { getTotalQuestionsForDifficulty } from '../lib/interviewPersistence';

interface InterviewSetupProps {
  initialTrack?: InterviewTrack;
  initialMode?: PracticeMode;
  initialDifficulty?: DifficultyLevel;
  initialTopic?: string;
  initialCustomTopic?: string;
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
  initialTrack,
  initialMode,
  initialDifficulty,
  initialTopic,
  initialCustomTopic,
  onBack,
  onEnterRoom,
}) => {
  // 1. Track State (persisted with prop priority)
  const [track, setTrack] = useState<InterviewTrack>(() => {
    if (initialTrack === 'technical' || initialTrack === 'hr') return initialTrack;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRACK);
      if (saved === 'technical' || saved === 'hr') return saved;
    } catch {
      // Fallback
    }
    return 'technical';
  });

  // 2. Difficulty State (persisted with prop priority)
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(() => {
    if (initialDifficulty) return initialDifficulty;
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

  // 3. Topic State (persisted with prop priority)
  const [topic, setTopic] = useState<string>(() => {
    if (initialTopic) return initialTopic;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TOPIC);
      if (saved) return saved;
    } catch {
      // Fallback
    }
    return 'Data Structures and Algorithms';
  });

  // 4. Custom Topic State (persisted with prop priority)
  const [customTopic, setCustomTopic] = useState<string>(() => {
    if (initialCustomTopic !== undefined) return initialCustomTopic;
    try {
      return localStorage.getItem(STORAGE_KEY_CUSTOM_TOPIC) || '';
    } catch {
      return '';
    }
  });

  // 5. Practice Mode (persisted with prop priority)
  const [mode, setMode] = useState<PracticeMode>(() => {
    if (initialMode === 'voice' || initialMode === 'typed') return initialMode;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MODE);
      if (saved === 'voice' || saved === 'typed') return saved;
    } catch {
      // Fallback
    }
    return 'voice';
  });

  // Synchronize incoming props if changed by caller
  useEffect(() => {
    if (initialTrack && initialTrack !== track) {
      setTrack(initialTrack);
    }
  }, [initialTrack]);

  useEffect(() => {
    if (initialDifficulty && initialDifficulty !== difficulty) {
      setDifficulty(initialDifficulty);
    }
  }, [initialDifficulty]);

  useEffect(() => {
    if (initialTopic && initialTopic !== topic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);

  useEffect(() => {
    if (initialCustomTopic !== undefined && initialCustomTopic !== customTopic) {
      setCustomTopic(initialCustomTopic);
    }
  }, [initialCustomTopic]);

  useEffect(() => {
    if (initialMode && initialMode !== mode) {
      setMode(initialMode);
    }
  }, [initialMode]);

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
    foundation: <Shield className="w-4 h-4 text-[#00F0FF]" />,
    'pressure-cooker': <Flame className="w-4 h-4 text-[#00F0FF]" />,
    executive: <Zap className="w-4 h-4 text-[#00F0FF]" />,
  };

  const activeTopicDisplay = customTopic.trim() ? `${customTopic.trim()} (Custom Focus)` : topic;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center">
      {/* Top Breadcrumb & Step Metadata */}
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-4 mb-8">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#00F0FF] tracking-wider uppercase font-bold">
            CALIBRATION // 002
          </span>
          <span className="text-xs text-[#9EA6B0]">•</span>
          <span className="text-xs font-mono text-[#9EA6B0] uppercase tracking-wide">
            Studio Calibration Deck
          </span>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-mono text-[#9EA6B0] hover:text-[#00F0FF] transition-colors focus:outline-none focus:underline uppercase tracking-wider"
        >
          [ ← Return to Studio ]
        </button>
      </div>

      {/* Hero Console Banner with Daemon Precision Styling */}
      <div className="w-full relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 daemon-card p-6 sm:p-8 rounded-xl">
        <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-tr" aria-hidden="true">+</span>
        <span className="daemon-crosshair-bl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-br" aria-hidden="true">+</span>

        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-md daemon-badge">
            <Compass className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#00F0FF] font-bold">
              CALIBRATION CONSOLE
            </span>
          </div>
          <h1 className="font-anton text-3xl sm:text-4xl text-[#FFFFFF] tracking-wide uppercase leading-tight">
            Calibrate Studio Parameters
          </h1>
          <p className="text-sm sm:text-base text-[#9EA6B0] mt-2 leading-relaxed font-inria">
            Configure rigor depth, role specialization, and response channel before entering the live interview room.
          </p>
        </div>

        {/* Compact Echo Rings Indicator */}
        <div className="shrink-0 flex items-center gap-4 self-center md:self-auto p-4 rounded-xl daemon-badge">
          <EchoRings
            size="sm"
            state={isTesting ? 'recording' : 'idle'}
            audioLevel={audioLevel}
            showStatusLabel={false}
          />
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-mono uppercase text-[#9EA6B0] tracking-wider">
              Acoustic Sensor
            </span>
            <span className="text-xs font-mono text-[#00F0FF] font-bold">
              {isTesting ? `Live Input ${(audioLevel * 100).toFixed(0)}%` : 'Sensor Ready'}
            </span>
            <span className="text-[10px] font-mono text-[#9EA6B0]">
              {mode === 'voice' ? 'Vocal channel armed' : 'Silent typed channel'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Studio Controls */}
      <div className="w-full space-y-8">
        {/* 1. Track Selection Switcher */}
        <section aria-labelledby="track-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="track-heading" className="font-anton text-xl sm:text-2xl tracking-wide uppercase text-[#FFFFFF]">
              1. Interview Track
            </h2>
            <span className="text-[11px] font-mono text-[#9EA6B0]">
              ACTIVE: <span className="text-[#00F0FF] uppercase font-bold">{track}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleTrackChange('technical')}
              className={`p-6 rounded-xl text-left transition-all relative ${
                track === 'technical'
                  ? 'daemon-card-active'
                  : 'daemon-card daemon-card-hover'
              } focus:outline-none focus:ring-2 focus:ring-[#00F0FF]`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-[#9EA6B0] font-bold tracking-wider">TRACK // 01</span>
                {track === 'technical' && (
                  <span className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
                )}
              </div>
              <h3 className="font-anton text-xl sm:text-2xl uppercase tracking-wide text-[#FFFFFF]">
                Technical Interview
              </h3>
              <p className="font-mono text-xs text-[#00F0FF] mt-0.5">“Explain. Defend. Solve.”</p>
              <p className="text-xs text-[#9EA6B0] mt-2.5 leading-relaxed font-inria">
                Systems architecture, trade-off defense, and algorithmic logic under direct scrutiny.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleTrackChange('hr')}
              className={`p-6 rounded-xl text-left transition-all relative ${
                track === 'hr'
                  ? 'daemon-card-active'
                  : 'daemon-card daemon-card-hover'
              } focus:outline-none focus:ring-2 focus:ring-[#00F0FF]`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-[#9EA6B0] font-bold tracking-wider">TRACK // 02</span>
                {track === 'hr' && (
                  <span className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
                )}
              </div>
              <h3 className="font-anton text-xl sm:text-2xl uppercase tracking-wide text-[#FFFFFF]">
                HR & Behavioral
              </h3>
              <p className="font-mono text-xs text-[#00F0FF] mt-0.5">“Communicate with clarity.”</p>
              <p className="text-xs text-[#9EA6B0] mt-2.5 leading-relaxed font-inria">
                STAR narrative framing, conflict resolution, ownership stories, and executive presence.
              </p>
            </button>
          </div>
        </section>

        {/* 2. Difficulty Level Selection */}
        <section aria-labelledby="difficulty-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="difficulty-heading" className="font-anton text-xl sm:text-2xl tracking-wide uppercase text-[#FFFFFF]">
              2. Rigor Calibration
            </h2>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#9EA6B0]">
              <HelpCircle className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>Prompt Depth Matrix</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className={`p-5 rounded-xl cursor-pointer text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'daemon-card-active'
                      : 'daemon-card daemon-card-hover'
                  } focus:outline-none focus:ring-2 focus:ring-[#00F0FF]`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded daemon-badge font-bold tracking-wider">
                          {opt.badge}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] font-bold">
                          {getTotalQuestionsForDifficulty(opt.id)} Questions
                        </span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-[#00F0FF] bg-[#00F0FF] text-[#0A0B0D] shadow-[0_0_8px_#00F0FF]'
                            : 'border-white/[0.12]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      {difficultyIcons[opt.id]}
                      <h3 className="font-anton text-lg tracking-wide uppercase text-[#FFFFFF]">
                        {opt.title}
                      </h3>
                    </div>

                    <p className="text-xs text-[#9EA6B0] leading-relaxed mb-4 font-inria">
                      {opt.description}
                    </p>
                  </div>

                  <span className="text-[10px] font-mono text-[#9EA6B0] pt-3 border-t border-white/[0.08]">
                    {opt.recommendation}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Specialization Domain */}
        <section aria-labelledby="topic-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="topic-heading" className="font-anton text-xl sm:text-2xl tracking-wide uppercase text-[#FFFFFF]">
              3. Specialization Domain
            </h2>
            <span className="text-[11px] font-mono text-[#9EA6B0]">
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
                  className={`text-xs font-mono px-4 py-2 rounded-lg border transition-all text-left uppercase tracking-wider ${
                    isSelected
                      ? 'daemon-chip-active'
                      : 'daemon-chip hover:border-[#00F0FF]/40 text-[#FFFFFF]'
                  } focus:outline-none focus:ring-1 focus:ring-[#00F0FF]`}
                >
                  {top}
                </button>
              );
            })}
          </div>

          {/* Optional Custom Topic Input */}
          <div className="mt-3 p-5 rounded-xl daemon-card">
            <label htmlFor="custom-topic-input" className="block text-xs font-mono text-[#9EA6B0] mb-2.5 uppercase tracking-wider">
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
                className="w-full bg-[#0A0B0D] text-[#FFFFFF] text-xs sm:text-sm font-mono placeholder:text-[#9EA6B0]/40 px-4 py-3 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:outline-none transition-all"
              />
              {customTopic && (
                <button
                  type="button"
                  onClick={() => setCustomTopic('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[#9EA6B0] hover:text-[#FFFFFF] px-2.5 py-1 rounded bg-[#14181B] border border-white/[0.1]"
                >
                  CLEAR
                </button>
              )}
            </div>
            {customTopic.trim() && (
              <p className="text-[11px] font-mono text-[#00F0FF] mt-2">
                ✓ Custom override active: “{customTopic.trim()}”
              </p>
            )}
          </div>
        </section>

        {/* 4. Response Transmission Channel */}
        <section aria-labelledby="mode-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="mode-heading" className="font-anton text-xl sm:text-2xl tracking-wide uppercase text-[#FFFFFF]">
              4. Response Transmission Channel
            </h2>
            <span className="text-[11px] font-mono text-[#9EA6B0]">
              MODE: <span className="text-[#00F0FF] uppercase font-bold">{mode}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMode('voice')}
              className={`p-6 rounded-xl text-left transition-all ${
                mode === 'voice'
                  ? 'daemon-card-active'
                  : 'daemon-card daemon-card-hover'
              } focus:outline-none focus:ring-2 focus:ring-[#00F0FF]`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#00F0FF]" />
                  <span className="font-anton text-lg tracking-wide uppercase text-[#FFFFFF]">
                    Voice Transmission Mode
                  </span>
                </div>
                {mode === 'voice' && (
                  <span className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
                )}
              </div>
              <p className="text-xs text-[#9EA6B0] leading-relaxed font-inria">
                Vocal answer delivery under real-time acoustic scrutiny. Real microphone analysis active.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('typed');
                if (isTesting) stopTest();
              }}
              className={`p-6 rounded-xl text-left transition-all ${
                mode === 'typed'
                  ? 'daemon-card-active'
                  : 'daemon-card daemon-card-hover'
              } focus:outline-none focus:ring-2 focus:ring-[#00F0FF]`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-[#00F0FF]" />
                  <span className="font-anton text-lg tracking-wide uppercase text-[#FFFFFF]">
                    Silent Typed Mode
                  </span>
                </div>
                {mode === 'typed' && (
                  <span className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
                )}
              </div>
              <p className="text-xs text-[#9EA6B0] leading-relaxed font-inria">
                Keyboard-based answers with zero audio required. Ideal for quiet libraries and dorms.
              </p>
            </button>
          </div>

          {/* Opt-in Microphone Test for Voice Mode */}
          {mode === 'voice' && (
            <div className="p-4 rounded-xl daemon-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
                <span className="text-xs font-mono text-[#FFFFFF] uppercase tracking-wider">
                  Microphone Readiness Check:
                </span>
                {isTesting && (
                  <span className="text-xs font-mono text-[#00F0FF] font-bold">
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
                className={`text-xs font-mono px-4 py-2 rounded-lg transition-all inline-flex items-center gap-2 ${
                  isTesting
                    ? 'bg-[#00F0FF] text-[#0A0B0D] font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                    : 'daemon-chip hover:border-[#00F0FF]/50 text-[#FFFFFF]'
                }`}
              >
                {isTesting ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>STOP MIC TEST</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span>TEST MICROPHONE INPUT</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/40 text-xs font-mono text-[#FF4D6D] flex items-center justify-between gap-2 shadow-[0_0_16px_rgba(255,77,109,0.15)]">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setMode('typed')}
                className="shrink-0 underline hover:text-[#FFFFFF] uppercase font-bold"
              >
                Switch to Typed Mode
              </button>
            </div>
          )}
        </section>

        {/* 5. Session Dossier & Enter Interview Room */}
        <section
          aria-labelledby="prep-heading"
          className="p-6 sm:p-8 rounded-xl daemon-card space-y-6 relative"
        >
          <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
          <span className="daemon-crosshair-tr" aria-hidden="true">+</span>
          <span className="daemon-crosshair-bl" aria-hidden="true">+</span>
          <span className="daemon-crosshair-br" aria-hidden="true">+</span>

          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[#00F0FF]" />
              <h2 id="prep-heading" className="font-anton text-xl sm:text-2xl uppercase tracking-wide text-[#FFFFFF]">
                5. Session Dossier & Protocols
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#00F0FF] uppercase font-bold">
              [ VERIFIED ]
            </span>
          </div>

          {/* Verified Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3.5 rounded-lg bg-[#0A0B0D] border border-white/[0.08]">
              <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">
                Arena Track
              </span>
              <span className="text-xs font-mono text-[#FFFFFF] font-bold mt-1 block truncate">
                {track === 'technical' ? 'Technical Interview' : 'HR & Behavioral'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0A0B0D] border border-white/[0.08]">
              <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">
                Rigor Level
              </span>
              <span className="text-xs font-mono text-[#00F0FF] font-bold mt-1 block truncate capitalize">
                {difficulty.replace('-', ' ')}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0A0B0D] border border-white/[0.08]">
              <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">
                Focus Domain
              </span>
              <span className="text-xs font-mono text-[#FFFFFF] font-bold mt-1 block truncate">
                {activeTopicDisplay}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0A0B0D] border border-white/[0.08]">
              <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">
                Transmission
              </span>
              <span className="text-xs font-mono text-[#FFFFFF] font-bold mt-1 block truncate">
                {mode === 'voice' ? 'Voice (Acoustic)' : 'Silent Typed'}
              </span>
            </div>
          </div>

          {/* Tactical Preparation Advice */}
          <div className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-xs text-[#9EA6B0] space-y-2 font-mono">
            <p className="text-[#FFFFFF] font-bold">TACTICAL PREPARATION PROTOCOL:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>Observe a 3-second strategic pause before answering to organize response pillars.</li>
              <li>Structure responses cleanly: Context → Core Decision / Trade-off → Concrete Outcome.</li>
              <li>Under scrutiny, state assumptions explicitly rather than guessing silently.</li>
            </ul>
          </div>

          {/* Primary Action Button: Enter Interview Studio */}
          <div className="pt-2">
            <button
              type="button"
              id="enter-interview-room-btn"
              onClick={handleEnterRoom}
              className="w-full min-h-[56px] px-8 py-4 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] active:scale-[0.99] text-[#0A0B0D] font-anton text-xl tracking-wider uppercase inline-flex items-center justify-center gap-2.5 transition-all shadow-[0_0_24px_rgba(0,240,255,0.35)] focus:outline-none focus:ring-2 focus:ring-[#00F0FF] focus:ring-offset-2 focus:ring-offset-[#0A0B0D]"
            >
              <span>[ ⨂ Enter Interview Studio ⨂ ]</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
            <p className="text-center text-[11px] font-mono text-[#9EA6B0] mt-3 uppercase tracking-wider">
              Zero judgment. Calibrated for deliberate practice and iterative improvement under pressure.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
