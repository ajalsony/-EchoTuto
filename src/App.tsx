import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
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
import { PublicLandingPage } from './components/landing/PublicLandingPage';
import type {
  InterviewTrack,
  PracticeMode,
  ScreenView,
  InterviewConfig,
} from './types';

const STORAGE_KEY_TRACK = 'echotutor_selected_track';
const STORAGE_KEY_MODE = 'echotutor_practice_mode';
const STORAGE_KEY_DIFFICULTY = 'echotutor_difficulty';
const STORAGE_KEY_TOPIC = 'echotutor_topic';
const STORAGE_KEY_CUSTOM_TOPIC = 'echotutor_custom_topic';


function getScreenFromHash(): ScreenView {
  const hash = window.location.hash.replace('#/', '').replace('#', '').split('?')[0];
  if (
    hash === 'entry' ||
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
  return 'entry';
}

export function App() {
  const { user, isLoading: isAuthLoading } = useAuth();

  // Screen router: 'entry' | 'setup' | 'room' | 'login' | 'register' | 'forgot-password' | 'verify-email' | 'dashboard'
  const [currentScreen, setCurrentScreen] = useState<ScreenView>(() => getScreenFromHash());

  // Email state for email verification screen and login prefill
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const [prefilledLoginEmail, setPrefilledLoginEmail] = useState<string>('');

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

  // Real Web Audio Microphone diagnostics hook
  const {
    micStatus,
    audioLevel: realAudioLevel,
    isTesting,
    startTest,
    stopTest,
    resetError,
  } = useMicrophoneTest();

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
      // Unauthenticated visitor: protect studio and dashboard routes (entry is public landing)
      if (
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
        currentScreen === 'register'
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

  // Handle switching to typed mode
  const handleSelectMode = (mode: PracticeMode) => {
    setPracticeMode(mode);
    if (mode === 'typed' && isTesting) {
      stopTest();
    }
    if (mode === 'typed') {
      resetError();
    }
  };

  // Handle live microphone toggle
  const handleToggleMicTest = async () => {
    if (isTesting) {
      stopTest();
    } else {
      await startTest();
    }
  };

  const handleEnterRoom = (config: InterviewConfig) => {
    setSessionConfig(config);
    setSelectedTrack(config.track);
    setPracticeMode(config.mode);
    navigateTo('room');
  };

  // Full-bleed Public Landing Page (Stitch Design Suite)
  if (currentScreen === 'entry') {
    return (
      <PublicLandingPage
        onStartTraining={() => {
          if (user) {
            navigateTo('setup');
          } else {
            navigateTo('login');
          }
        }}
        onNavigateLogin={() => navigateTo('login')}
        onNavigateRegister={() => navigateTo('register')}
        onNavigateDashboard={() => navigateTo('dashboard')}
        isAuthenticated={Boolean(user)}
        userEmail={user?.email || undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-[#FFFFFF] flex flex-col font-inria selection:bg-[#00F0FF] selection:text-[#0A0B0D]">
      {/* 1. Daemon Studio Header with Top Spectral Hairline Bar */}
      {currentScreen !== 'dashboard' && currentScreen !== 'room' && (
        <Header
          sessionCode={
            currentScreen === 'setup'
              ? 'CALIBRATE // 002'
              : undefined
          }
          onBack={
            currentScreen === 'setup'
              ? () => navigateTo('dashboard')
              : undefined
          }
          backLabel={
            currentScreen === 'setup'
              ? 'Dashboard'
              : undefined
          }
          onHome={() => (user ? navigateTo('dashboard') : navigateTo('entry'))}
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
      )}

      {/* 2. Main Content Routing */}

      {/* View: Interview Setup */}
      {currentScreen === 'setup' && (
        <main className="flex-1 w-full">
          <InterviewSetup
            initialTrack={sessionConfig.track}
            initialMode={sessionConfig.mode}
            initialDifficulty={sessionConfig.difficulty}
            initialTopic={sessionConfig.topic}
            initialCustomTopic={sessionConfig.customTopic}
            onBack={() => navigateTo(user ? 'dashboard' : 'entry')}
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
            onExitHome={() => navigateTo(user ? 'dashboard' : 'login')}
          />
        </main>
      )}

      {/* View: Candidate Login */}
      {currentScreen === 'login' && (
        <main className="flex-1 w-full">
          <LoginPage
            initialEmail={prefilledLoginEmail}
            onNavigateRegister={() => navigateTo('register')}
            onNavigateLanding={() => navigateTo('entry')}
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
            onNavigateLogin={(email) => {
              if (email) setPrefilledLoginEmail(email);
              navigateTo('login');
            }}
            onNavigateLanding={() => navigateTo('entry')}
            onSuccess={(needsVerification, registeredEmail) => {
              setPrefilledLoginEmail(registeredEmail);
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
            onNavigateLogin={() => {
              if (verificationEmail) setPrefilledLoginEmail(verificationEmail);
              navigateTo('login');
            }}
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
                try {
                  localStorage.setItem(STORAGE_KEY_TRACK, track);
                } catch {}
              }
              navigateTo('setup');
            }}
            onResumeSession={(resumedConfig) => {
              setSelectedTrack(resumedConfig.track);
              setSessionConfig(resumedConfig);
              navigateTo('room');
            }}
            currentConfig={sessionConfig}
            onSelectMode={(mode) => {
              handleSelectMode(mode);
              setSessionConfig((prev) => ({ ...prev, mode }));
              try {
                localStorage.setItem(STORAGE_KEY_MODE, mode);
              } catch {}
            }}
            onSelectDifficulty={(difficulty) => {
              setSessionConfig((prev) => ({ ...prev, difficulty }));
              try {
                localStorage.setItem(STORAGE_KEY_DIFFICULTY, difficulty);
              } catch {}
            }}
            onSelectTopic={(topic) => {
              setSessionConfig((prev) => ({ ...prev, topic, customTopic: '' }));
              try {
                localStorage.setItem(STORAGE_KEY_TOPIC, topic);
                localStorage.removeItem(STORAGE_KEY_CUSTOM_TOPIC);
              } catch {}
            }}
            onSelectTrack={(track) => {
              setSelectedTrack(track);
              const defaultTopics = track === 'technical'
                ? ['Python', 'Data Structures and Algorithms', 'Computer Networks', 'Cybersecurity', 'Web Development', 'General Technical']
                : ['Self-introduction', 'Strengths and weaknesses', 'Teamwork and conflict', 'Leadership', 'Problem-solving', 'General HR'];
              setSessionConfig((prev) => ({
                ...prev,
                track,
                topic: defaultTopics[0],
                customTopic: '',
              }));
              try {
                localStorage.setItem(STORAGE_KEY_TRACK, track);
                localStorage.setItem(STORAGE_KEY_TOPIC, defaultTopics[0]);
              } catch {}
            }}
            onLogout={() => navigateTo('login')}
            onNavigateLanding={() => navigateTo('entry')}
          />
        </main>
      )}

      {/* 3. Daemon Editorial Footer */}
      {currentScreen !== 'dashboard' && currentScreen !== 'room' && <Footer />}
    </div>
  );
}

export default App;
