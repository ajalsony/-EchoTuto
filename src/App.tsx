import { useState, useRef, useEffect, useCallback } from 'react';
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
  Sparkles,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { Header } from './components/Header';
import { EchoRings } from './components/EchoRings';
import { InterviewCard } from './components/InterviewCard';
import { Footer } from './components/Footer';
import { InterviewSetup } from './components/InterviewSetup';
import { InterviewRoomPlaceholder } from './components/InterviewRoomPlaceholder';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { EmailVerificationPage } from './components/auth/EmailVerificationPage';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { useAuth } from './context/AuthContext';
// Preserved as per Requirement 5 (kept safely in repository)
import { ZenBackground as _ZenBackground } from './components/ZenBackground';
import { PerspectiveTunnel as _PerspectiveTunnel } from './components/PerspectiveTunnel';
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
      'Live engineering defense. Defend your data structures, architectural trade-offs, and debug complex edge cases under direct technical scrutiny.',
    focusAreas: ['System Trade-offs', 'Algorithmic Logic', 'Debugging Live', 'Edge Defense'],
  },
  {
    id: 'hr',
    code: 'TRACK // 02',
    title: 'HR & Behavioral',
    tagline: 'Communicate with clarity.',
    description:
      'High-impact conversational challenges. Articulate conflict resolution, leadership ownership, and structured STAR responses with confidence.',
    focusAreas: ['STAR Method', 'Conflict Nuance', 'Ownership Stories', 'Executive Presence'],
  },
];

const daemonIndexItems = [
  {
    num: '01',
    title: 'TECHNICAL DEPTH',
    detail: 'Algorithmic logic & trade-off defense under live scrutiny',
    track: 'technical' as const,
  },
  {
    num: '02',
    title: 'BEHAVIORAL STORIES',
    detail: 'STAR framework delivery & conflict resolution mastery',
    track: 'hr' as const,
  },
  {
    num: '03',
    title: 'ACOUSTIC CADENCE',
    detail: 'Real Web Audio frequency measurement & verbal clarity',
    action: 'diagnostic' as const,
  },
  {
    num: '04',
    title: 'DEFENSE MASTERY',
    detail: 'Iterative rehearsal with zero fabricated hallucinations',
    action: 'practice' as const,
  },
];

function getScreenFromHash(): ScreenView {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  if (
    hash === 'setup' ||
    hash === 'room' ||
    hash === 'login' ||
    hash === 'register' ||
    hash === 'forgot-password' ||
    hash === 'verify-email' ||
    hash === 'dashboard'
  ) {
    return hash;
  }
  return 'login';
}

export function App() {
  const { user, isLoading: isAuthLoading } = useAuth();

  // Screen router: 'entry' | 'setup' | 'room' | 'login' | 'register' | 'forgot-password' | 'verify-email' | 'dashboard'
  const [currentScreen, setCurrentScreen] = useState<ScreenView>(() => getScreenFromHash());

  // Email state for email verification screen
  const [verificationEmail, setVerificationEmail] = useState<string>('');

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

  const diagnosticRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<HTMLDivElement>(null);

  // Sync route changes to URL hash
  const navigateTo = useCallback((screen: ScreenView) => {
    setCurrentScreen(screen);
    window.location.hash = screen === 'login' ? '#/login' : `#/${screen}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen to browser popstate / hashchange
  useEffect(() => {
    const handleHashChange = () => {
      const target = getScreenFromHash();
      setCurrentScreen(target);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Route Guards & Authentication-First Onboarding
  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      // Unauthenticated visitor: protect studio and dashboard routes
      if (
        currentScreen === 'entry' ||
        currentScreen === 'dashboard' ||
        currentScreen === 'setup' ||
        currentScreen === 'room'
      ) {
        navigateTo('login');
      }
    } else {
      // Authenticated candidate: auth portals redirect to candidate dashboard
      if (
        currentScreen === 'login' ||
        currentScreen === 'register' ||
        currentScreen === 'entry'
      ) {
        navigateTo('dashboard');
      }
    }
  }, [user, currentScreen, isAuthLoading, navigateTo]);

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
      diagnosticRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await startTest();
    }
  };

  const handleStartPractice = () => {
    if (isTesting) {
      stopTest();
    }
    navigateTo('setup');
  };

  const handleEnterRoom = (config: InterviewConfig) => {
    setSessionConfig(config);
    setSelectedTrack(config.track);
    setPracticeMode(config.mode);
    navigateTo('room');
  };

  const selectedTrackData = tracks.find((t) => t.id === selectedTrack);

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-[#FFFFFF] flex flex-col font-inria selection:bg-[#00F0FF] selection:text-[#0A0B0D]">
      {/* 1. Daemon Studio Header with Top Spectral Hairline Bar */}
      <Header
        sessionCode={
          currentScreen === 'entry'
            ? 'STUDIO // 001'
            : currentScreen === 'setup'
            ? 'CALIBRATE // 002'
            : currentScreen === 'room'
            ? 'ROOM // 003'
            : currentScreen === 'dashboard'
            ? 'PORTAL // 004'
            : undefined
        }
        onBack={
          currentScreen === 'setup'
            ? () => navigateTo('dashboard')
            : currentScreen === 'room'
            ? () => navigateTo('setup')
            : undefined
        }
        backLabel={
          currentScreen === 'setup'
            ? 'Dashboard'
            : currentScreen === 'room'
            ? 'Setup'
            : undefined
        }
        onHome={() => (user ? navigateTo('dashboard') : navigateTo('login'))}
        practiceMode={practiceMode}
        onSelectMode={handleSelectMode}
        micStatus={micStatus}
        isTesting={isTesting}
        audioLevel={realAudioLevel}
        onToggleMicTest={handleToggleMicTest}
        currentScreen={currentScreen}
        onNavigateLogin={() => navigateTo('login')}
        onNavigateRegister={() => navigateTo('register')}
        onNavigateDashboard={() => navigateTo('dashboard')}
      />

      {/* 2. Main Content Routing */}

      {/* View: Entry / Landing Arena */}
      {currentScreen === 'entry' && (
        <main className="flex-1 w-full flex flex-col items-center">
          {/* Hero Section: Daemon SaaS Technical Layout */}
          <section className="relative w-full border-b border-white/[0.08] daemon-grid-bg pt-10 sm:pt-16 pb-14 sm:pb-20 overflow-hidden">
            {/* Ambient Cyan Radial Atmosphere Glow */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] sm:w-[900px] h-[350px] bg-gradient-to-b from-[#00F0FF]/10 via-[#00F0FF]/[0.03] to-transparent blur-3xl pointer-events-none" 
              aria-hidden="true"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                {/* Left Column: Massive Industrial Condensed Headline + CTAs (7 cols) */}
                <div className="lg:col-span-7 flex flex-col items-start text-left">
                  {/* Eyebrow Label with Precision Markers */}
                  <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-md daemon-badge text-xs font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                    <span className="tracking-widest uppercase font-bold text-[#00F0FF]">
                      [ ⨂ AI INTERVIEW STUDIO // MIL-STD ⨂ ]
                    </span>
                  </div>

                  {/* Massive Hero Headline (Anton Condensed Font) */}
                  <h1 className="font-anton text-5xl xs:text-6xl sm:text-7xl md:text-8xl tracking-tight text-[#FFFFFF] uppercase leading-[0.92] mb-6">
                    DON'T JUST PREPARE. <br />
                    <span className="text-[#00F0FF]">GET BETTER</span> UNDER PRESSURE.
                  </h1>

                  {/* Supporting Tactical Copy */}
                  <p className="text-base sm:text-lg text-[#9EA6B0] max-w-xl font-normal leading-relaxed mb-8 font-inria">
                    Precision AI interview coaching designed for engineering and behavioral defense. Rehearse difficult questions with real-time acoustic feedback and zero simulated fluff.
                  </p>

                  {/* Immediate Interview Track Selector */}
                  <div className="w-full max-w-md p-1.5 rounded-xl bg-[#14181B] border border-white/[0.08] mb-8 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedTrack('technical')}
                        className={`text-xs sm:text-sm font-mono py-2.5 px-3 rounded-lg transition-all min-h-[44px] flex items-center justify-center gap-2 ${
                          selectedTrack === 'technical'
                            ? 'bg-[#00F0FF] text-[#0A0B0D] font-bold shadow-[0_0_14px_rgba(0,240,255,0.35)]'
                            : 'text-[#9EA6B0] hover:text-[#FFFFFF] hover:bg-white/5'
                        }`}
                        aria-pressed={selectedTrack === 'technical'}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="uppercase tracking-wider">Technical Track</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedTrack('hr')}
                        className={`text-xs sm:text-sm font-mono py-2.5 px-3 rounded-lg transition-all min-h-[44px] flex items-center justify-center gap-2 ${
                          selectedTrack === 'hr'
                            ? 'bg-[#00F0FF] text-[#0A0B0D] font-bold shadow-[0_0_14px_rgba(0,240,255,0.35)]'
                            : 'text-[#9EA6B0] hover:text-[#FFFFFF] hover:bg-white/5'
                        }`}
                        aria-pressed={selectedTrack === 'hr'}
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span className="uppercase tracking-wider">HR & Behavioral</span>
                      </button>
                    </div>
                  </div>

                  {/* Daemon Signature Action Buttons */}
                  <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* Primary CTA (High-contrast Electric Cyan Button) */}
                    <button
                      type="button"
                      id="start-practice-btn"
                      onClick={handleStartPractice}
                      className="group relative min-h-[54px] px-8 py-3.5 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] active:scale-[0.98] text-[#0A0B0D] font-anton text-xl tracking-wider uppercase inline-flex items-center justify-center gap-3 transition-all shadow-[0_0_24px_rgba(0,240,255,0.35)] focus:outline-none focus:ring-2 focus:ring-[#00F0FF] focus:ring-offset-2 focus:ring-offset-[#0A0B0D]"
                    >
                      <span>[ ⨂ Start a Practice ⨂ ]</span>
                      <ArrowRight className="w-5 h-5 stroke-[2.5] transition-transform group-hover:translate-x-1" />
                    </button>

                    {/* Secondary Action: Audio Diagnostic Jump */}
                    <button
                      type="button"
                      onClick={() => {
                        diagnosticRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="min-h-[54px] px-6 py-3.5 rounded-lg daemon-card daemon-card-hover text-[#FFFFFF] font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-1 focus:ring-[#00F0FF]"
                    >
                      <Mic className="w-4 h-4 text-[#00F0FF]" />
                      <span>Audio Diagnostics</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Daemon 4-Pillar Index & Telemetry Card (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="daemon-card rounded-xl p-6 sm:p-7 relative">
                    <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
                    <span className="daemon-crosshair-tr" aria-hidden="true">+</span>
                    <span className="daemon-crosshair-bl" aria-hidden="true">+</span>
                    <span className="daemon-crosshair-br" aria-hidden="true">+</span>

                    {/* Card Header */}
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#00F0FF]" />
                        <span className="font-mono text-xs tracking-widest text-[#FFFFFF] uppercase font-bold">
                          STUDIO CADENCE INDEX
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded daemon-badge font-bold">
                        ECHOTUTOR® v0.4
                      </span>
                    </div>

                    {/* 4-Item Service Index (Daemon SaaS Pattern) */}
                    <div className="space-y-3 font-mono">
                      {daemonIndexItems.map((item) => {
                        const isActive = item.track === selectedTrack;
                        return (
                          <div
                            key={item.num}
                            onClick={() => {
                              if (item.track) {
                                setSelectedTrack(item.track);
                              } else if (item.action === 'diagnostic') {
                                diagnosticRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              } else if (item.action === 'practice') {
                                handleStartPractice();
                              }
                            }}
                            className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-start gap-3.5 ${
                              isActive
                                ? 'bg-[#00F0FF]/10 border-[#00F0FF]/60 text-[#FFFFFF]'
                                : 'bg-[#0A0B0D] border-white/[0.06] hover:border-white/[0.2] text-[#9EA6B0]'
                            }`}
                          >
                            <span className={`text-xs font-bold ${isActive ? 'text-[#00F0FF]' : 'text-[#606873]'}`}>
                              {item.num}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className={`text-xs font-bold tracking-wider uppercase ${isActive ? 'text-[#FFFFFF]' : 'text-[#9EA6B0]'}`}>
                                  {item.title}
                                </h4>
                                {isActive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] shadow-[0_0_6px_#00F0FF]" />
                                )}
                              </div>
                              <p className="text-[11px] text-[#9EA6B0] mt-1 font-inria leading-normal">
                                {item.detail}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Card Footer Telemetry */}
                    <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-[#9EA6B0]">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#00F0FF]" />
                        <span>ZERO SIMULATED FLUFF</span>
                      </span>
                      <span className="text-[#00F0FF] font-bold">100% REAL AUDIO</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Body Container */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col gap-12 py-12 sm:py-16">
            {/* Real Audio Diagnostic & Calibration Deck */}
            <section
              ref={diagnosticRef}
              aria-labelledby="diagnostic-heading"
              className="w-full py-6 relative"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 border-b border-white/[0.08] pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono text-[#00F0FF] tracking-wider uppercase font-bold">
                      TELEMETRY
                    </span>
                    <span className="text-xs text-white/20">•</span>
                    <h2
                      id="diagnostic-heading"
                      className="font-anton text-2xl sm:text-3xl text-[#FFFFFF] uppercase tracking-wide"
                    >
                      Acoustic Diagnostic Hub
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-[#9EA6B0] mt-1 font-mono">
                    Real Web Audio API frequency analysis. No simulated or artificial waveforms.
                  </p>
                </div>

                <div className="text-xs font-mono text-[#9EA6B0]">
                  TRANSMISSION:{' '}
                  <span className="text-[#00F0FF] uppercase font-bold">
                    {practiceMode === 'voice' ? 'Acoustic Voice' : 'Silent Typed'}
                  </span>
                </div>
              </div>

              {/* Real Audio Permission Error Notice */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-6 p-4 rounded-xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/40 text-[#FFFFFF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-[0_0_16px_rgba(255,77,109,0.15)]"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-[#FF4D6D] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-mono text-xs uppercase tracking-wider text-[#FF4D6D] font-bold">
                        Microphone Hardware Notice
                      </p>
                      <p className="text-xs sm:text-sm text-[#FFFFFF] mt-0.5 leading-relaxed font-inria">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSelectMode('typed')}
                      className="w-full sm:w-auto text-xs font-mono font-bold px-4 py-2 rounded-lg bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 text-[#0A0B0D] transition-colors inline-flex items-center justify-center gap-1.5 min-h-[40px] uppercase"
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                      <span>Switch to Typed Mode</span>
                    </button>
                    <button
                      type="button"
                      onClick={resetError}
                      aria-label="Dismiss error"
                      className="p-2 text-[#9EA6B0] hover:text-[#FFFFFF] rounded transition-colors min-h-[40px] min-w-[40px] inline-flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Acoustic Rings + Interactive Diagnostics */}
              <div className="flex flex-col items-center justify-center py-6">
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

                {/* Mode Selector and Diagnostic Actions */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-lg">
                  {/* Voice / Typed Switcher */}
                  <div className="inline-flex rounded-lg bg-[#14181B] p-1 border border-white/[0.08] w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleSelectMode('voice')}
                      className={`flex-1 sm:flex-none text-xs font-mono px-4 py-2 rounded-md inline-flex items-center justify-center gap-2 transition-all min-h-[40px] uppercase ${
                        practiceMode === 'voice'
                          ? 'bg-[#00F0FF] text-[#0A0B0D] font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                          : 'text-[#9EA6B0] hover:text-[#FFFFFF]'
                      }`}
                      aria-pressed={practiceMode === 'voice'}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Voice Mode</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectMode('typed')}
                      className={`flex-1 sm:flex-none text-xs font-mono px-4 py-2 rounded-md inline-flex items-center justify-center gap-2 transition-all min-h-[40px] uppercase ${
                        practiceMode === 'typed'
                          ? 'bg-[#00F0FF] text-[#0A0B0D] font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                          : 'text-[#9EA6B0] hover:text-[#FFFFFF]'
                      }`}
                      aria-pressed={practiceMode === 'typed'}
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                      <span>Silent Typed</span>
                    </button>
                  </div>

                  {/* Real Live Mic Test Trigger */}
                  {practiceMode === 'voice' ? (
                    <button
                      type="button"
                      id="voice-check-btn"
                      onClick={handleToggleMicTest}
                      className={`w-full sm:w-auto text-xs font-mono font-bold px-5 py-2.5 rounded-lg transition-all inline-flex items-center justify-center gap-2 min-h-[44px] uppercase tracking-wider ${
                        isTesting
                          ? 'bg-[#00F0FF] text-[#0A0B0D] shadow-[0_0_16px_rgba(0,240,255,0.4)]'
                          : 'daemon-chip hover:border-[#00F0FF]/50 text-[#FFFFFF]'
                      }`}
                    >
                      {isTesting ? (
                        <>
                          <MicOff className="w-3.5 h-3.5 text-[#0A0B0D]" />
                          <span>Stop Mic Test ({(realAudioLevel * 100).toFixed(0)}%)</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5 text-[#00F0FF]" />
                          <span>Test Live Microphone</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="w-full sm:w-auto text-xs font-mono text-[#00F0FF] px-4 py-2.5 rounded-lg daemon-badge inline-flex items-center justify-center gap-2 min-h-[44px] font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00F0FF]" />
                      <span>Ready for Silent Practice</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Detailed Track Selection Cards Section */}
            <section
              ref={selectionRef}
              aria-labelledby="tracks-heading"
              className="w-full"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-8 border-b border-white/[0.08] pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono text-[#00F0FF] tracking-wider uppercase font-bold">
                      DOMAINS
                    </span>
                    <span className="text-xs text-white/20">•</span>
                    <h2
                      id="tracks-heading"
                      className="font-anton text-2xl sm:text-3xl text-[#FFFFFF] uppercase tracking-wide"
                    >
                      Interview Tracks
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-[#9EA6B0] mt-1 font-mono">
                    Select a specialization track for tailored inquiry challenges.
                  </p>
                </div>

                <div className="text-xs font-mono text-[#9EA6B0]">
                  ACTIVE TRACK:{' '}
                  <span className="text-[#00F0FF] uppercase font-bold">
                    {selectedTrackData?.title}
                  </span>
                </div>
              </div>

              {/* 2-Column Responsive Track Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
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

              {/* Bottom Launch Bar with Daemon Precision Crosshairs */}
              <div className="mt-8 p-6 rounded-xl daemon-card relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
                <span className="daemon-crosshair-tr" aria-hidden="true">+</span>
                <span className="daemon-crosshair-bl" aria-hidden="true">+</span>
                <span className="daemon-crosshair-br" aria-hidden="true">+</span>

                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-3 h-3 rounded-full mt-1.5 ${
                      isTesting
                        ? 'bg-[#00F0FF] animate-ping'
                        : 'bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]'
                    }`}
                  />
                  <div>
                    <p className="text-xs sm:text-sm font-mono text-[#FFFFFF]">
                      Selected Track:{' '}
                      <span className="text-[#00F0FF] font-bold">
                        {selectedTrackData?.title}
                      </span>{' '}
                      <span className="text-[#9EA6B0]">
                        ({selectedTrackData?.tagline})
                      </span>
                    </p>
                    <p className="text-xs font-mono text-[#9EA6B0] mt-1">
                      Input:{' '}
                      <span className="text-[#FFFFFF]">
                        {practiceMode === 'voice'
                          ? 'Voice Conversation (Acoustic)'
                          : 'Silent Typed (Keyboard)'}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="proceed-setup-btn"
                  onClick={handleStartPractice}
                  className="w-full sm:w-auto text-xs font-mono font-bold px-6 py-3 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] text-[#0A0B0D] inline-flex items-center justify-center gap-2 transition-all shadow-[0_0_16px_rgba(0,240,255,0.3)] focus:outline-none focus:ring-2 focus:ring-[#00F0FF] min-h-[44px] uppercase tracking-wider"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Configure Parameters</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>
          </div>
        </main>
      )}

      {/* View: Interview Setup */}
      {currentScreen === 'setup' && (
        <main className="flex-1 w-full">
          <InterviewSetup
            initialTrack={selectedTrack}
            initialMode={practiceMode}
            onBack={() => navigateTo('entry')}
            onEnterRoom={handleEnterRoom}
          />
        </main>
      )}

      {/* View: Interview Room Studio */}
      {currentScreen === 'room' && (
        <main className="flex-1 w-full">
          <InterviewRoomPlaceholder
            config={sessionConfig}
            onBackToSetup={() => navigateTo('setup')}
            onExitHome={() => navigateTo('entry')}
          />
        </main>
      )}

      {/* View: Candidate Login */}
      {currentScreen === 'login' && (
        <main className="flex-1 w-full">
          <LoginPage
            onNavigateRegister={() => navigateTo('register')}
            onNavigateForgotPassword={() => navigateTo('forgot-password')}
            onNavigateVerifyEmail={(email) => {
              if (email) setVerificationEmail(email);
              navigateTo('verify-email');
            }}
            onSuccess={() => navigateTo('dashboard')}
          />
        </main>
      )}

      {/* View: Candidate Registration */}
      {currentScreen === 'register' && (
        <main className="flex-1 w-full">
          <RegisterPage
            onNavigateLogin={() => navigateTo('login')}
            onSuccess={(needsVerification, registeredEmail) => {
              if (needsVerification) {
                setVerificationEmail(registeredEmail);
                navigateTo('verify-email');
              } else {
                navigateTo('dashboard');
              }
            }}
          />
        </main>
      )}

      {/* View: Forgot Password */}
      {currentScreen === 'forgot-password' && (
        <main className="flex-1 w-full">
          <ForgotPasswordPage
            onNavigateLogin={() => navigateTo('login')}
          />
        </main>
      )}

      {/* View: Email Verification Notice */}
      {currentScreen === 'verify-email' && (
        <main className="flex-1 w-full">
          <EmailVerificationPage
            email={verificationEmail}
            onNavigateLogin={() => navigateTo('login')}
          />
        </main>
      )}

      {/* View: Candidate Dashboard */}
      {currentScreen === 'dashboard' && (
        <main className="flex-1 w-full">
          <UserDashboard
            onStartPractice={(track) => {
              if (track) {
                setSelectedTrack(track);
                setSessionConfig((prev) => ({ ...prev, track }));
              }
              navigateTo('setup');
            }}
            currentConfig={sessionConfig}
            onSelectMode={(mode) => {
              handleSelectMode(mode);
              setSessionConfig((prev) => ({ ...prev, mode }));
            }}
            onLogout={() => navigateTo('login')}
          />
        </main>
      )}

      {/* 3. Daemon Editorial Footer */}
      <Footer />
    </div>
  );
}

export default App;
