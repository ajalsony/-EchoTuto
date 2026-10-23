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

  // Real microphone hook (strictly opt-in via manual button, no auto-request)
  const {
    audioLevel,
    isTesting,
    errorMessage,
    startTest,
    stopTest,
  } = useMicrophoneTest();

  // Ensure topic aligns when track switches
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
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center animate-fade-in">
      {/* Top Breadcrumb & Step Metadata */}
      <div className="w-full flex items-center justify-between border-b border-[#28302B]/60 pb-3 mb-6 sm:mb-8">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#B8FF62] tracking-wider uppercase">
            SETUP // 002
          </span>
          <span className="text-xs text-[#929991]">•</span>
          <span className="text-xs font-mono text-[#929991] uppercase tracking-wide">
            Interview Calibration
          </span>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-mono text-[#929991] hover:text-[#B8FF62] transition-colors focus:outline-none focus:underline"
        >
          ← Change Arena
        </button>
      </div>

      {/* Hero Heading & Unobtrusive Acoustic Visual Indicator */}
      <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 sm:mb-10 bg-[#1B201D]/70 p-5 sm:p-7 rounded-2xl border border-[#28302B]">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 mb-2 px-2.5 py-0.5 rounded bg-[#101211] border border-[#28302B]">
            <Compass className="w-3.5 h-3.5 text-[#B8FF62]" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#B8FF62]">
              SESSION PARAMETERS
            </span>
          </div>
          <h1 className="font-space font-bold text-2xl sm:text-3xl md:text-4xl text-[#E8EAE5] tracking-tight">
            Calibrate Your Session
          </h1>
          <p className="text-sm sm:text-base text-[#929991] mt-1.5 leading-relaxed">
            Configure difficulty depth, role specialization, and acoustic response mode before
            stepping into the Echo Chamber.
          </p>
        </div>

        {/* Compact Echo Rings Indicator */}
        <div className="shrink-0 flex items-center gap-4 self-center md:self-auto">
          <EchoRings
            size="sm"
            state={isTesting ? 'recording' : 'idle'}
            audioLevel={audioLevel}
            showStatusLabel={false}
          />
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-mono uppercase text-[#929991] tracking-wider">
              Acoustic Core
            </span>
            <span className="text-xs font-mono text-[#B8FF62] font-semibold">
              {isTesting ? `Live Mic ${(audioLevel * 100).toFixed(0)}%` : 'Ready / Calibrated'}
            </span>
            <span className="text-[10px] font-mono text-[#929991]">
              {mode === 'voice' ? 'Acoustic input ready' : 'Silent typed mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="w-full space-y-8">
        {/* 1. Track Selection Switcher */}
        <section aria-labelledby="track-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="track-heading" className="font-space font-bold text-lg sm:text-xl text-[#E8EAE5]">
              1. Interview Track
            </h2>
            <span className="text-[11px] font-mono text-[#929991]">
              ACTIVE: <span className="text-[#B8FF62] uppercase font-semibold">{track}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleTrackChange('technical')}
              className={`p-4 rounded-xl border text-left transition-all ${
                track === 'technical'
                  ? 'bg-[#1B201D] border-[#B8FF62] shadow-[0_0_0_1px_#B8FF62]'
                  : 'bg-[#1B201D]/60 hover:bg-[#1B201D] border-[#28302B]'
              } focus:outline-none focus:ring-2 focus:ring-[#B8FF62]`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs text-[#929991]">TRACK // 01</span>
                {track === 'technical' && (
                  <span className="w-2 h-2 rounded-full bg-[#B8FF62]" />
                )}
              </div>
              <h3 className="font-space font-bold text-base sm:text-lg text-[#E8EAE5]">
                Technical Interview
              </h3>
              <p className="font-mono text-xs text-[#B8FF62] mt-0.5">“Explain. Defend. Solve.”</p>
              <p className="text-xs text-[#929991] mt-1.5">
                Architecture trade-offs, algorithmic logic, and technical justification.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleTrackChange('hr')}
              className={`p-4 rounded-xl border text-left transition-all ${
                track === 'hr'
                  ? 'bg-[#1B201D] border-[#B8FF62] shadow-[0_0_0_1px_#B8FF62]'
                  : 'bg-[#1B201D]/60 hover:bg-[#1B201D] border-[#28302B]'
              } focus:outline-none focus:ring-2 focus:ring-[#B8FF62]`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs text-[#929991]">TRACK // 02</span>
                {track === 'hr' && (
                  <span className="w-2 h-2 rounded-full bg-[#B8FF62]" />
                )}
              </div>
              <h3 className="font-space font-bold text-base sm:text-lg text-[#E8EAE5]">
                HR & Behavioral
              </h3>
              <p className="font-mono text-xs text-[#B8FF62] mt-0.5">“Communicate with clarity.”</p>
              <p className="text-xs text-[#929991] mt-1.5">
                STAR narrative framing, conflict resolution, and leadership ownership.
              </p>
            </button>
          </div>
        </section>

        {/* 2. Difficulty Level Selection */}
        <section aria-labelledby="difficulty-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="difficulty-heading" className="font-space font-bold text-lg sm:text-xl text-[#E8EAE5]">
              2. Difficulty Level
            </h2>
            <div className="inline-flex items-center gap-1 text-[11px] font-mono text-[#929991]">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Prompt Depth Calibration</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                  className={`p-4 sm:p-5 rounded-xl border cursor-pointer text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#1B201D] border-[#B8FF62] shadow-[0_0_0_1px_#B8FF62]'
                      : 'bg-[#1B201D]/60 hover:bg-[#1B201D] border-[#28302B]'
                  } focus:outline-none focus:ring-2 focus:ring-[#B8FF62]`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#101211] border border-[#28302B] text-[#B8FF62]">
                        {opt.badge}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#B8FF62] bg-[#B8FF62] text-[#101211]' : 'border-[#28302B]'
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

                    <p className="text-xs text-[#929991] leading-relaxed mb-3">
                      {opt.description}
                    </p>
                  </div>

                  <span className="text-[10px] font-mono text-[#929991] pt-2 border-t border-[#28302B]/60">
                    {opt.recommendation}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] font-mono text-[#929991]/80 mt-1">
            Note: Difficulty calibration defines the rigor of follow-up questions. Engine integration will connect in Milestone 3.
          </p>
        </section>

        {/* 3. Topic or Role Focus */}
        <section aria-labelledby="topic-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="topic-heading" className="font-space font-bold text-lg sm:text-xl text-[#E8EAE5]">
              3. Topic or Role Focus
            </h2>
            <span className="text-[11px] font-mono text-[#929991]">
              {availableTopics.length} STANDARD TOPICS + CUSTOM
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
                  className={`text-xs font-mono px-3.5 py-2 rounded-lg border transition-all text-left ${
                    isSelected
                      ? 'bg-[#B8FF62] text-[#101211] border-[#B8FF62] font-semibold'
                      : 'bg-[#1B201D] hover:bg-[#232A26] border-[#28302B] text-[#E8EAE5]'
                  } focus:outline-none focus:ring-1 focus:ring-[#B8FF62]`}
                >
                  {top}
                </button>
              );
            })}
          </div>

          {/* Optional Custom Topic Input */}
          <div className="mt-3 p-3.5 rounded-xl bg-[#1B201D]/70 border border-[#28302B]">
            <label htmlFor="custom-topic-input" className="block text-xs font-mono text-[#929991] mb-2">
              OR SPECIFY CUSTOM TOPIC / TARGET ROLE (OPTIONAL):
            </label>
            <div className="relative">
              <input
                id="custom-topic-input"
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder={
                  track === 'technical'
                    ? 'e.g. Distributed Consensus, Golang Microservices, React Concurrency...'
                    : 'e.g. Navigating Team Restructuring, Cross-functional Stakeholder Management...'
                }
                className="w-full bg-[#101211] text-[#E8EAE5] text-xs sm:text-sm font-mono placeholder:text-[#929991]/50 px-3.5 py-2.5 rounded-lg border border-[#28302B] focus:border-[#B8FF62] focus:outline-none transition-colors"
              />
              {customTopic && (
                <button
                  type="button"
                  onClick={() => setCustomTopic('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[#929991] hover:text-[#E8EAE5] px-1.5 py-0.5 rounded bg-[#1B201D]"
                >
                  Clear
                </button>
              )}
            </div>
            {customTopic.trim() && (
              <p className="text-[11px] font-mono text-[#B8FF62] mt-1.5">
                ✓ Custom override active: “{customTopic.trim()}”
              </p>
            )}
          </div>
        </section>

        {/* 4. Practice Mode & Opt-in Microphone Test */}
        <section aria-labelledby="mode-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="mode-heading" className="font-space font-bold text-lg sm:text-xl text-[#E8EAE5]">
              4. Practice Response Mode
            </h2>
            <span className="text-[11px] font-mono text-[#929991]">
              INPUT: <span className="text-[#B8FF62] uppercase font-semibold">{mode}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setMode('voice');
              }}
              className={`p-4 rounded-xl border text-left transition-all ${
                mode === 'voice'
                  ? 'bg-[#1B201D] border-[#B8FF62] shadow-[0_0_0_1px_#B8FF62]'
                  : 'bg-[#1B201D]/60 hover:bg-[#1B201D] border-[#28302B]'
              } focus:outline-none focus:ring-2 focus:ring-[#B8FF62]`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#B8FF62]" />
                  <span className="font-space font-bold text-base text-[#E8EAE5]">
                    Voice Mode
                  </span>
                </div>
                {mode === 'voice' && <span className="w-2 h-2 rounded-full bg-[#B8FF62]" />}
              </div>
              <p className="text-xs text-[#929991]">
                Speak naturally under real-time acoustic pressure. Microphone required.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('typed');
                if (isTesting) stopTest();
              }}
              className={`p-4 rounded-xl border text-left transition-all ${
                mode === 'typed'
                  ? 'bg-[#1B201D] border-[#B8FF62] shadow-[0_0_0_1px_#B8FF62]'
                  : 'bg-[#1B201D]/60 hover:bg-[#1B201D] border-[#28302B]'
              } focus:outline-none focus:ring-2 focus:ring-[#B8FF62]`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-[#B8FF62]" />
                  <span className="font-space font-bold text-base text-[#E8EAE5]">
                    Silent Typed Mode
                  </span>
                </div>
                {mode === 'typed' && <span className="w-2 h-2 rounded-full bg-[#B8FF62]" />}
              </div>
              <p className="text-xs text-[#929991]">
                Answer via keyboard with zero noise. Perfect for libraries and dorms.
              </p>
            </button>
          </div>

          {/* Opt-in Microphone Test for Voice Mode (never auto-requested) */}
          {mode === 'voice' && (
            <div className="p-3.5 rounded-xl bg-[#101211] border border-[#28302B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#B8FF62]" />
                <span className="text-xs font-mono text-[#E8EAE5]">
                  Microphone Readiness Check (Optional):
                </span>
                {isTesting && (
                  <span className="text-xs font-mono text-[#B8FF62]">
                    Input Level: {(audioLevel * 100).toFixed(0)}%
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
                className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all inline-flex items-center gap-2 ${
                  isTesting
                    ? 'bg-[#B8FF62] text-[#101211] border-[#B8FF62] font-semibold'
                    : 'bg-[#1B201D] hover:bg-[#232A26] border-[#28302B] text-[#E8EAE5]'
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

          {/* Error Notice if user tested mic and it failed */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-[#FF8277]/10 border border-[#FF8277]/40 text-xs font-mono text-[#FF8277] flex items-center justify-between gap-2">
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

        {/* 5. Session Preparation Guidance & Summary Card */}
        <section
          aria-labelledby="prep-heading"
          className="p-5 sm:p-7 rounded-2xl bg-[#1B201D] border border-[#28302B] space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#28302B]/60 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#B8FF62]" />
              <h2 id="prep-heading" className="font-space font-bold text-lg text-[#E8EAE5]">
                5. Session Dossier & Preparation
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#B8FF62] uppercase">
              CONFIRMED CALIBRATION
            </span>
          </div>

          {/* Grid of Confirmed Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3 rounded-lg bg-[#101211] border border-[#28302B]">
              <span className="text-[10px] font-mono text-[#929991] uppercase block">
                Arena Track
              </span>
              <span className="text-xs font-mono text-[#E8EAE5] font-semibold mt-0.5 block truncate">
                {track === 'technical' ? 'Technical Interview' : 'HR & Behavioral'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#101211] border border-[#28302B]">
              <span className="text-[10px] font-mono text-[#929991] uppercase block">
                Difficulty
              </span>
              <span className="text-xs font-mono text-[#B8FF62] font-semibold mt-0.5 block truncate capitalize">
                {difficulty.replace('-', ' ')}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#101211] border border-[#28302B]">
              <span className="text-[10px] font-mono text-[#929991] uppercase block">
                Focus Area
              </span>
              <span className="text-xs font-mono text-[#E8EAE5] font-semibold mt-0.5 block truncate">
                {activeTopicDisplay}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#101211] border border-[#28302B]">
              <span className="text-[10px] font-mono text-[#929991] uppercase block">
                Response Mode
              </span>
              <span className="text-xs font-mono text-[#E8EAE5] font-semibold mt-0.5 block truncate">
                {mode === 'voice' ? 'Voice (Acoustic)' : 'Silent Typed'}
              </span>
            </div>
          </div>

          {/* Preparation Advice */}
          <div className="p-3.5 rounded-lg bg-[#101211]/60 border border-[#28302B]/80 text-xs text-[#929991] space-y-1.5 font-mono">
            <p className="text-[#E8EAE5] font-semibold">PREPARATION PROTOCOL:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Take a 3-second tactical pause before starting your answer to organize your points.</li>
              <li>Structure your responses: Context → Core Decision / Trade-off → Concrete Outcome.</li>
              <li>Under pressure, state assumptions explicitly rather than guessing silently.</li>
            </ul>
          </div>

          {/* Primary Action Button: Enter Interview Room */}
          <div className="pt-2">
            <button
              type="button"
              id="enter-interview-room-btn"
              onClick={handleEnterRoom}
              className="w-full min-h-[54px] px-8 py-4 rounded-xl bg-[#B8FF62] hover:bg-[#9CE646] active:scale-[0.99] text-[#101211] font-space font-bold text-base sm:text-lg tracking-tight inline-flex items-center justify-center gap-2.5 transition-all shadow-[0_4px_24px_rgba(184,255,98,0.25)] focus:outline-none focus:ring-2 focus:ring-[#B8FF62] focus:ring-offset-2 focus:ring-offset-[#101211]"
            >
              <span>Enter Interview Room</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
            <p className="text-center text-[11px] font-mono text-[#929991] mt-2.5">
              Zero judgment. Calibrated for deliberate practice and iterative improvement.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
