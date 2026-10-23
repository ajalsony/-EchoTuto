import { useState, useRef, useEffect } from 'react';
import {
  ArrowRight,
  Mic,
  MicOff,
  Keyboard,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Header } from './components/Header';
import { EchoRings } from './components/EchoRings';
import { InterviewCard } from './components/InterviewCard';
import { Footer } from './components/Footer';
import { useMicrophoneTest } from './hooks/useMicrophoneTest';
import type {
  EchoRingsState,
  InterviewTrack,
  InterviewTrackInfo,
  PracticeMode,
} from './types';

const STORAGE_KEY_TRACK = 'echotutor_selected_track';
const STORAGE_KEY_MODE = 'echotutor_practice_mode';

const tracks: InterviewTrackInfo[] = [
  {
    id: 'technical',
    code: 'TRACK // 01',
    title: 'Technical Interview',
    tagline: 'Explain. Defend. Solve.',
    description:
      'Live engineering conversation. Defend your data structures, architectural trade-offs, and debug complex edge cases under direct scrutiny.',
    focusAreas: ['System Trade-offs', 'Algorithmic Logic', 'Debugging Live', 'Edge Defense'],
  },
  {
    id: 'hr',
    code: 'TRACK // 02',
    title: 'HR & Behavioral',
    tagline: 'Communicate with clarity.',
    description:
      'High-impact conversational challenges. Articulate conflict resolution, leadership ownership, and STAR responses with confidence.',
    focusAreas: ['STAR Method', 'Conflict Nuance', 'Ownership Stories', 'Executive Presence'],
  },
];

export function App() {
  // 1. Persisted Interview Track (technical | hr)
  const [selectedTrack, setSelectedTrack] = useState<InterviewTrack>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRACK);
      if (saved === 'technical' || saved === 'hr') {
        return saved;
      }
    } catch {
      // LocalStorage access fallback
    }
    return 'technical';
  });

  // 2. Persisted Practice Mode (voice | typed)
  const [practiceMode, setPracticeMode] = useState<PracticeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MODE);
      if (saved === 'voice' || saved === 'typed') {
        return saved;
      }
    } catch {
      // LocalStorage access fallback
    }
    return 'voice';
  });

  // 3. Reusable Echo Rings visual state
  const [manualState, setManualState] = useState<EchoRingsState>('idle');

  // 4. Real Web Audio Microphone diagnostics hook
  const {
    micStatus,
    audioLevel: realAudioLevel,
    errorMessage,
    isTesting,
    startTest,
    stopTest,
    resetError,
  } = useMicrophoneTest();

  const heroRingsRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<HTMLDivElement>(null);

  // Sync track selection to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRACK, selectedTrack);
    } catch {
      // Storage quota or private mode fallback
    }
  }, [selectedTrack]);

  // Sync practice mode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MODE, practiceMode);
    } catch {
      // Storage quota or private mode fallback
    }
  }, [practiceMode]);

  // Handle switching to typed mode
  const handleSelectMode = (mode: PracticeMode) => {
    setPracticeMode(mode);
    if (mode === 'typed' && isTesting) {
      stopTest();
    }
    if (mode === 'typed') {
      resetError();
      setManualState('idle');
    }
  };

  // Determine active Echo Rings state
  let effectiveState: EchoRingsState = manualState;
  if (micStatus === 'denied' || micStatus === 'missing' || micStatus === 'unsupported' || micStatus === 'error') {
    effectiveState = 'error';
  } else if (isTesting) {
    effectiveState = 'recording';
  }

  // Handle live microphone toggle
  const handleToggleMicTest = async () => {
    if (isTesting) {
      stopTest();
      setManualState('idle');
    } else {
      // Bring rings into view so user sees acoustic feedback
      heroRingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await startTest();
    }
  };

  const handleStartPractice = () => {
    selectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const selectedTrackData = tracks.find((t) => t.id === selectedTrack);

  return (
    <div className="min-h-screen bg-[#101211] text-[#E8EAE5] flex flex-col font-inter selection:bg-[#B8FF62] selection:text-[#101211]">
      {/* 1. Header */}
      <Header sessionCode="PRACTICE / 001" />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 w-full flex flex-col items-center">
        {/* 2. Hero Section */}
        <section className="w-full pt-8 sm:pt-14 pb-8 sm:pb-12 flex flex-col items-center text-center">
          {/* Echo Chamber Rings Visual Container */}
          <div ref={heroRingsRef} className="relative mb-6 sm:mb-8">
            <EchoRings
              state={effectiveState}
              audioLevel={isTesting ? realAudioLevel : 0}
              size="responsive"
              showStatusLabel={true}
              customLabel={
                isTesting
                  ? 'LIVE INPUT'
                  : practiceMode === 'typed'
                  ? 'TYPED MODE'
                  : undefined
              }
              customText={
                isTesting
                  ? `Signal ${(realAudioLevel * 100).toFixed(0)}%`
                  : practiceMode === 'typed'
                  ? 'Silent Practice Active'
                  : undefined
              }
              customSubtext={
                isTesting
                  ? 'Real-time microphone input verified'
                  : practiceMode === 'typed'
                  ? 'Keyboard answers — no microphone required'
                  : undefined
              }
            />

            {/* Reusable State Inspector (For visual testing across all design states) */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 p-1 bg-[#1B201D]/90 border border-[#28302B] rounded-lg max-w-xs sm:max-w-md mx-auto">
              <span className="text-[10px] font-mono text-[#929991] px-2 py-0.5 uppercase tracking-wider hidden xs:inline">
                Acoustic State:
              </span>
              {(['idle', 'speaking', 'recording', 'processing', 'error'] as EchoRingsState[]).map(
                (st) => {
                  const isActive = effectiveState === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        if (isTesting) stopTest();
                        resetError();
                        setManualState(st);
                      }}
                      className={`text-[11px] font-mono uppercase px-2.5 py-1 rounded transition-colors ${
                        isActive
                          ? st === 'error'
                            ? 'bg-[#FF8277] text-[#101211] font-semibold'
                            : 'bg-[#B8FF62] text-[#101211] font-semibold'
                          : 'text-[#929991] hover:text-[#E8EAE5] hover:bg-[#101211]'
                      }`}
                    >
                      {st}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Uppercase Tagline */}
          <div className="inline-flex items-center gap-2 mb-3.5 px-3 py-1 rounded bg-[#1B201D] border border-[#28302B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B8FF62]" />
            <span className="font-mono text-[11px] sm:text-xs tracking-[0.2em] uppercase text-[#B8FF62]">
              YOUR VOICE. YOUR NEXT LEVEL.
            </span>
          </div>

          {/* Main Editorial Heading */}
          <h1 className="font-space font-bold text-3xl xs:text-4xl sm:text-5xl md:text-6xl tracking-tight text-[#E8EAE5] max-w-2xl leading-[1.1] mb-4">
            Don't just prepare. <br />
            <span className="text-[#B8FF62]">Get better under pressure.</span>
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg text-[#929991] max-w-xl font-normal leading-relaxed mb-8 sm:mb-10">
            Practise difficult questions. Learn from every answer.
          </p>

          {/* Primary Action Button (Prominent Signal Lime) */}
          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              id="start-practice-btn"
              onClick={handleStartPractice}
              className="w-full sm:w-auto min-h-[52px] px-8 py-3.5 rounded-xl bg-[#B8FF62] hover:bg-[#9CE646] active:scale-[0.98] text-[#101211] font-space font-bold text-base sm:text-lg tracking-tight inline-flex items-center justify-center gap-2.5 transition-all shadow-[0_4px_24px_rgba(184,255,98,0.2)] focus:outline-none focus:ring-2 focus:ring-[#B8FF62] focus:ring-offset-2 focus:ring-offset-[#101211]"
            >
              <span>Start a practice</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </section>

        {/* 3. Interview Choices & Calibration Section */}
        <section
          ref={selectionRef}
          aria-labelledby="tracks-heading"
          className="w-full pt-4 sm:pt-6 pb-8"
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6 border-b border-[#28302B]/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#B8FF62] tracking-wider uppercase">
                  CALIBRATION
                </span>
                <span className="text-xs text-[#929991]">•</span>
                <h2
                  id="tracks-heading"
                  className="font-space font-bold text-xl sm:text-2xl text-[#E8EAE5]"
                >
                  Choose Your Arena
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#929991] mt-1 font-mono">
                Select your track and input mode for today's simulated interview session.
              </p>
            </div>

            <div className="text-[11px] font-mono text-[#929991]">
              SAVED PREFERENCE:{' '}
              <span className="text-[#B8FF62] uppercase font-semibold">
                {selectedTrack} / {practiceMode}
              </span>
            </div>
          </div>

          {/* Mode Switcher: Voice vs Typed Fallback */}
          <div className="mb-6 p-3.5 rounded-xl bg-[#1B201D] border border-[#28302B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono text-[#929991] uppercase tracking-wider">
                Practice Mode:
              </span>
              <div className="inline-flex rounded-lg bg-[#101211] p-1 border border-[#28302B]">
                <button
                  type="button"
                  onClick={() => handleSelectMode('voice')}
                  className={`text-xs font-mono px-3 py-1.5 rounded-md inline-flex items-center gap-2 transition-all ${
                    practiceMode === 'voice'
                      ? 'bg-[#B8FF62] text-[#101211] font-semibold shadow-sm'
                      : 'text-[#929991] hover:text-[#E8EAE5]'
                  }`}
                  aria-pressed={practiceMode === 'voice'}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Voice Mode (Default)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMode('typed')}
                  className={`text-xs font-mono px-3 py-1.5 rounded-md inline-flex items-center gap-2 transition-all ${
                    practiceMode === 'typed'
                      ? 'bg-[#B8FF62] text-[#101211] font-semibold shadow-sm'
                      : 'text-[#929991] hover:text-[#E8EAE5]'
                  }`}
                  aria-pressed={practiceMode === 'typed'}
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Silent Typed Mode</span>
                </button>
              </div>
            </div>

            <span className="text-[11px] font-mono text-[#929991]">
              {practiceMode === 'voice'
                ? 'Mic input required'
                : 'No mic needed • Library friendly'}
            </span>
          </div>

          {/* Real Audio Permission / Hardware Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-[#FF8277]/10 border border-[#FF8277]/40 text-[#E8EAE5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#FF8277] shrink-0 mt-0.5" />
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-[#FF8277] font-semibold">
                    Microphone Hardware Notice
                  </p>
                  <p className="text-xs sm:text-sm text-[#E8EAE5] mt-0.5 leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectMode('typed')}
                  className="w-full sm:w-auto text-xs font-mono font-semibold px-3 py-1.5 rounded bg-[#FF8277] hover:bg-[#FF8277]/90 text-[#101211] transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Switch to Typed Mode</span>
                </button>
                <button
                  type="button"
                  onClick={resetError}
                  aria-label="Dismiss error"
                  className="p-1.5 text-[#929991] hover:text-[#E8EAE5] rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Responsive Single-Column Mobile -> 2-Column Desktop Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {tracks.map((track) => (
              <InterviewCard
                key={track.id}
                id={track.id}
                code={track.code}
                title={track.title}
                tagline={track.tagline}
                description={track.description}
                focusAreas={track.focusAreas}
                isSelected={selectedTrack === track.id}
                onSelect={(id) => setSelectedTrack(id)}
              />
            ))}
          </div>

          {/* Selected Track Confirmation & Genuine Hardware Diagnostic Bar */}
          <div className="mt-6 p-4 sm:p-5 rounded-xl bg-[#1B201D] border border-[#28302B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full mt-1 ${
                  isTesting
                    ? 'bg-[#B8FF62] animate-ping'
                    : practiceMode === 'typed'
                    ? 'bg-[#B8FF62]'
                    : 'bg-[#B8FF62]'
                }`}
              />
              <div>
                <p className="text-xs sm:text-sm font-mono text-[#E8EAE5]">
                  Track:{' '}
                  <span className="text-[#B8FF62] font-semibold">
                    {selectedTrackData?.title}
                  </span>{' '}
                  <span className="text-[#929991]">
                    ({selectedTrackData?.tagline})
                  </span>
                </p>
                <p className="text-xs font-mono text-[#929991] mt-0.5">
                  Input Mode:{' '}
                  <span className="text-[#E8EAE5]">
                    {practiceMode === 'voice'
                      ? 'Voice Conversation (Acoustic)'
                      : 'Silent Typed (Keyboard Input)'}
                  </span>
                  {isTesting && (
                    <span className="ml-2 text-[#B8FF62] font-semibold">
                      • Live Mic: {(realAudioLevel * 100).toFixed(0)}%
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Hardware Diagnostic or Silent Mode Status */}
            {practiceMode === 'voice' ? (
              <button
                type="button"
                id="voice-check-btn"
                onClick={handleToggleMicTest}
                className={`w-full sm:w-auto text-xs font-mono font-medium px-4 py-2.5 rounded-lg border transition-all inline-flex items-center justify-center gap-2 ${
                  isTesting
                    ? 'bg-[#B8FF62] text-[#101211] border-[#B8FF62] font-semibold shadow-[0_0_12px_rgba(184,255,98,0.3)]'
                    : 'bg-[#101211] hover:bg-[#232A26] border-[#28302B] hover:border-[#B8FF62]/40 text-[#E8EAE5]'
                }`}
              >
                {isTesting ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-[#101211]" />
                    <span>Stop Mic Test ({ (realAudioLevel * 100).toFixed(0) }%)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-[#B8FF62]" />
                    <span>Test Live Microphone</span>
                  </>
                )}
              </button>
            ) : (
              <div className="w-full sm:w-auto text-xs font-mono text-[#B8FF62] px-3.5 py-2 rounded-lg bg-[#101211] border border-[#28302B] inline-flex items-center justify-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#B8FF62]" />
                <span>Ready for Silent Practice</span>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 4. Footer Detail */}
      <Footer />
    </div>
  );
}

export default App;
