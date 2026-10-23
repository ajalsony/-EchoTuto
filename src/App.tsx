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
  SlidersHorizontal,
  Compass,
} from 'lucide-react';
import { Header } from './components/Header';
import { EchoRings } from './components/EchoRings';
import { InterviewCard } from './components/InterviewCard';
import { Footer } from './components/Footer';
import { InterviewSetup } from './components/InterviewSetup';
import { InterviewRoomPlaceholder } from './components/InterviewRoomPlaceholder';
import { LiquidMetal } from './components/LiquidMetal';
import { useMicrophoneTest } from './hooks/useMicrophoneTest';
import type {
  EchoRingsState,
  InterviewTrack,
  InterviewTrackInfo,
  PracticeMode,
  ScreenView,
  InterviewConfig,
} from './types';

const STORAGE_KEY_TRACK = 'echotutor_selected_track';
const STORAGE_KEY_MODE = 'echotutor_practice_mode';
const STORAGE_KEY_DIFFICULTY = 'echotutor_difficulty';
const STORAGE_KEY_TOPIC = 'echotutor_topic';
const STORAGE_KEY_CUSTOM_TOPIC = 'echotutor_custom_topic';

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
  // Current screen router: 'entry' | 'setup' | 'room'
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('entry');

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

  // 3. Interview Session Config State
  const [sessionConfig, setSessionConfig] = useState<InterviewConfig>(() => {
    let diff: InterviewConfig['difficulty'] = 'pressure-cooker';
    let top = 'Data Structures and Algorithms';
    let custom = '';
    try {
      const savedDiff = localStorage.getItem(STORAGE_KEY_DIFFICULTY);
      if (savedDiff === 'foundation' || savedDiff === 'pressure-cooker' || savedDiff === 'executive') {
        diff = savedDiff;
      }
      const savedTop = localStorage.getItem(STORAGE_KEY_TOPIC);
      if (savedTop) top = savedTop;
      custom = localStorage.getItem(STORAGE_KEY_CUSTOM_TOPIC) || '';
    } catch {
      // Fallback
    }

    return {
      track: selectedTrack,
      difficulty: diff,
      topic: custom.trim() ? custom.trim() : top,
      customTopic: custom,
      mode: practiceMode,
    };
  });

  // 4. Reusable Echo Rings visual state
  const [manualState, setManualState] = useState<EchoRingsState>('idle');

  // 5. Real Web Audio Microphone diagnostics hook
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

  // Handle switching to typed mode on entry screen
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

  // Determine active Echo Rings state for entry screen
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
      heroRingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await startTest();
    }
  };

  const handleStartPractice = () => {
    if (isTesting) {
      stopTest();
    }
    setCurrentScreen('setup');
  };

  const handleEnterRoom = (config: InterviewConfig) => {
    setSessionConfig(config);
    setSelectedTrack(config.track);
    setPracticeMode(config.mode);
    setCurrentScreen('room');
  };

  const selectedTrackData = tracks.find((t) => t.id === selectedTrack);

  return (
    <div className="min-h-screen bg-[#0B0D0C] text-[#E8EAE5] flex flex-col font-inter selection:bg-[#B8FF62] selection:text-[#0B0D0C]">
      {/* 1. Dynamic Studio Header */}
      <Header
        sessionCode={
          currentScreen === 'entry'
            ? 'PRACTICE / 001'
            : currentScreen === 'setup'
            ? 'SETUP // 002'
            : 'ROOM // 003'
        }
        onBack={
          currentScreen === 'setup'
            ? () => setCurrentScreen('entry')
            : currentScreen === 'room'
            ? () => setCurrentScreen('setup')
            : undefined
        }
        backLabel={currentScreen === 'setup' ? 'Arena' : 'Setup'}
        onHome={() => setCurrentScreen('entry')}
        statusBadgeText={
          currentScreen === 'room'
            ? 'STUDIO ARMED'
            : practiceMode === 'typed'
            ? 'SILENT MODE READY'
            : 'VOICE ENGINE READY'
        }
      />

      {/* 2. Main Content Routing */}
      {currentScreen === 'entry' && (
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 w-full flex flex-col items-center">
          {/* Hero Section with Ambient Liquid-Metal Shimmer */}
          <section className="w-full pt-6 sm:pt-10 pb-8 sm:pb-12 flex flex-col items-center text-center">
            {/* Liquid-Metal Studio Atmosphere Chamber */}
            <LiquidMetal
              variant="mercury"
              opacity={0.22}
              speed={0.6}
              distortion={0.85}
              className="w-full rounded-3xl p-6 sm:p-12 mb-8 border border-white/[0.08] bg-[#121514] shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col items-center text-center"
            >
              {/* Echo Chamber Rings Visual Container */}
              <div ref={heroRingsRef} className="relative mb-6">
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

                {/* State Inspector (For visual testing across all design states) */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 p-1 chrome-badge rounded-xl max-w-xs sm:max-w-md mx-auto">
                  <span className="text-[10px] font-mono text-[#8A9389] px-2 py-0.5 uppercase tracking-wider hidden xs:inline">
                    State:
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
                          className={`text-[11px] font-mono uppercase px-2.5 py-1 rounded-lg transition-colors ${
                            isActive
                              ? st === 'error'
                                ? 'bg-[#FF8277] text-[#0B0D0C] font-semibold shadow-[0_0_8px_#FF8277]'
                                : 'bg-[#B8FF62] text-[#0B0D0C] font-semibold shadow-[0_0_8px_#B8FF62]'
                              : 'text-[#8A9389] hover:text-[#E8EAE5] hover:bg-white/5'
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
              <div className="inline-flex items-center gap-2 mb-3.5 px-3 py-1 rounded-full chrome-badge">
                <Compass className="w-3 h-3 text-[#B8FF62]" />
                <span className="font-mono text-[11px] sm:text-xs tracking-[0.2em] uppercase text-[#B8FF62] font-semibold">
                  YOUR VOICE. YOUR NEXT LEVEL.
                </span>
              </div>

              {/* Main Editorial Heading with Chrome Text Gradient */}
              <h1 className="font-space font-bold text-3xl xs:text-4xl sm:text-5xl md:text-6xl tracking-tight text-[#E8EAE5] max-w-2xl leading-[1.08] mb-4">
                Don't just prepare. <br />
                <span className="text-[#B8FF62]">Get better under pressure.</span>
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-[#8A9389] max-w-xl font-normal leading-relaxed mb-8">
                Practise difficult questions. Learn from every answer.
              </p>

              {/* Primary Action Button (Prominent Signal Lime with tactile sheen) */}
              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  id="start-practice-btn"
                  onClick={handleStartPractice}
                  className="w-full sm:w-auto min-h-[54px] px-9 py-4 rounded-xl bg-[#B8FF62] hover:bg-[#9DE644] active:scale-[0.98] text-[#0B0D0C] font-space font-bold text-base sm:text-lg tracking-tight inline-flex items-center justify-center gap-2.5 transition-all shadow-[0_0_28px_rgba(184,255,98,0.3)] focus:outline-none focus:ring-2 focus:ring-[#B8FF62] focus:ring-offset-2 focus:ring-offset-[#0B0D0C]"
                >
                  <span>Start a practice</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </LiquidMetal>
          </section>

          {/* Interview Choices & Calibration Section */}
          <section
            ref={selectionRef}
            aria-labelledby="tracks-heading"
            className="w-full pt-2 pb-8"
          >
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6 border-b border-white/[0.08] pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#B8FF62] tracking-wider uppercase font-semibold">
                    STEP 01
                  </span>
                  <span className="text-xs text-[#8A9389]">•</span>
                  <h2
                    id="tracks-heading"
                    className="font-space font-bold text-xl sm:text-2xl text-[#E8EAE5]"
                  >
                    Choose Your Arena
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-[#8A9389] mt-1 font-mono">
                  Select your track and input mode for today's simulated interview session.
                </p>
              </div>

              <div className="text-[11px] font-mono text-[#8A9389]">
                SAVED PREFERENCE:{' '}
                <span className="text-[#B8FF62] uppercase font-semibold">
                  {selectedTrack} / {practiceMode}
                </span>
              </div>
            </div>

            {/* Mode Switcher: Voice vs Typed Fallback */}
            <div className="mb-6 p-4 rounded-2xl chrome-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono text-[#8A9389] uppercase tracking-wider">
                  Practice Mode:
                </span>
                <div className="inline-flex rounded-xl bg-[#0B0D0C] p-1 border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => handleSelectMode('voice')}
                    className={`text-xs font-mono px-3.5 py-1.5 rounded-lg inline-flex items-center gap-2 transition-all ${
                      practiceMode === 'voice'
                        ? 'bg-[#B8FF62] text-[#0B0D0C] font-semibold shadow-[0_0_10px_rgba(184,255,98,0.25)]'
                        : 'text-[#8A9389] hover:text-[#E8EAE5]'
                    }`}
                    aria-pressed={practiceMode === 'voice'}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Voice Mode (Default)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectMode('typed')}
                    className={`text-xs font-mono px-3.5 py-1.5 rounded-lg inline-flex items-center gap-2 transition-all ${
                      practiceMode === 'typed'
                        ? 'bg-[#B8FF62] text-[#0B0D0C] font-semibold shadow-[0_0_10px_rgba(184,255,98,0.25)]'
                        : 'text-[#8A9389] hover:text-[#E8EAE5]'
                    }`}
                    aria-pressed={practiceMode === 'typed'}
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    <span>Silent Typed Mode</span>
                  </button>
                </div>
              </div>

              <span className="text-[11px] font-mono text-[#8A9389]">
                {practiceMode === 'voice'
                  ? 'Mic input required'
                  : 'No mic needed • Library friendly'}
              </span>
            </div>

            {/* Real Audio Permission Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-2xl bg-[#FF8277]/10 border border-[#FF8277]/40 text-[#E8EAE5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-[0_0_16px_rgba(255,130,119,0.12)]"
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
                    className="w-full sm:w-auto text-xs font-mono font-semibold px-3.5 py-2 rounded-xl bg-[#FF8277] hover:bg-[#FF8277]/90 text-[#0B0D0C] transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    <span>Switch to Typed Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetError}
                    aria-label="Dismiss error"
                    className="p-1.5 text-[#8A9389] hover:text-[#E8EAE5] rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Responsive Track Cards Grid */}
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

            {/* Confirmation & Proceed Action Card with Metallic Sheen */}
            <div className="mt-6 p-5 rounded-2xl chrome-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-1 ${
                    isTesting
                      ? 'bg-[#B8FF62] animate-ping'
                      : 'bg-[#B8FF62] shadow-[0_0_8px_#B8FF62]'
                  }`}
                />
                <div>
                  <p className="text-xs sm:text-sm font-mono text-[#E8EAE5]">
                    Track:{' '}
                    <span className="text-[#B8FF62] font-semibold">
                      {selectedTrackData?.title}
                    </span>{' '}
                    <span className="text-[#8A9389]">
                      ({selectedTrackData?.tagline})
                    </span>
                  </p>
                  <p className="text-xs font-mono text-[#8A9389] mt-0.5">
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

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                {practiceMode === 'voice' ? (
                  <button
                    type="button"
                    id="voice-check-btn"
                    onClick={handleToggleMicTest}
                    className={`w-full sm:w-auto text-xs font-mono font-medium px-4 py-2.5 rounded-xl transition-all inline-flex items-center justify-center gap-2 ${
                      isTesting
                        ? 'bg-[#B8FF62] text-[#0B0D0C] font-semibold shadow-[0_0_12px_rgba(184,255,98,0.3)]'
                        : 'chrome-badge hover:border-white/20 text-[#E8EAE5]'
                    }`}
                  >
                    {isTesting ? (
                      <>
                        <MicOff className="w-3.5 h-3.5 text-[#0B0D0C]" />
                        <span>Stop Mic Test ({(realAudioLevel * 100).toFixed(0)}%)</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-[#B8FF62]" />
                        <span>Test Live Microphone</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-full sm:w-auto text-xs font-mono text-[#B8FF62] px-3.5 py-2 rounded-xl chrome-badge inline-flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#B8FF62]" />
                    <span>Ready for Silent Practice</span>
                  </div>
                )}

                {/* Primary Transition to Setup Screen */}
                <button
                  type="button"
                  id="proceed-setup-btn"
                  onClick={handleStartPractice}
                  className="w-full sm:w-auto text-xs font-mono font-semibold px-5 py-2.5 rounded-xl bg-[#B8FF62] hover:bg-[#9DE644] text-[#0B0D0C] inline-flex items-center justify-center gap-2 transition-all shadow-[0_0_16px_rgba(184,255,98,0.25)] focus:outline-none focus:ring-2 focus:ring-[#B8FF62]"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Configure Parameters</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Screen 2: Interview Setup */}
      {currentScreen === 'setup' && (
        <main className="flex-1 w-full">
          <InterviewSetup
            initialTrack={selectedTrack}
            initialMode={practiceMode}
            onBack={() => setCurrentScreen('entry')}
            onEnterRoom={handleEnterRoom}
          />
        </main>
      )}

      {/* Screen 3: Interview Room Studio */}
      {currentScreen === 'room' && (
        <main className="flex-1 w-full">
          <InterviewRoomPlaceholder
            config={sessionConfig}
            onBackToSetup={() => setCurrentScreen('setup')}
            onExitHome={() => setCurrentScreen('entry')}
          />
        </main>
      )}

      {/* 3. Editorial Footer */}
      <Footer />
    </div>
  );
}

export default App;
