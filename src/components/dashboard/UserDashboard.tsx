import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowRight,
  Terminal,
  Play,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Clock,
  History,
  Target,
  SlidersHorizontal,
  RefreshCw,
  CheckCircle2,
  Lock,
  Bolt,
  Layers,
  Award,
  Users2,
  Code2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  loadDashboardMetrics,
  updateSessionStatus,
  type DashboardMetrics,
} from '../../lib/interviewPersistence';
import type {
  InterviewTrack,
  DifficultyLevel,
  PracticeMode,
  InterviewConfig,
  InterviewHistoryItem,
} from '../../types';
import { useMicrophoneTest } from '../../hooks/useMicrophoneTest';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { SkillRadarChart, type RadarDimension } from './SkillRadarChart';
import { ProfileEditModal } from './ProfileEditModal';

interface UserDashboardProps {
  onStartPractice: (track?: InterviewTrack) => void;
  onResumeSession?: (config: InterviewConfig) => void;
  onLogout: () => void;
  currentConfig?: InterviewConfig;
  onSelectMode?: (mode: PracticeMode) => void;
  onSelectDifficulty?: (difficulty: DifficultyLevel) => void;
  onSelectTopic?: (topic: string) => void;
  onSelectTrack?: (track: InterviewTrack) => void;
  onNavigateLanding?: () => void;
}

interface FlaggedDeficit {
  id: string;
  skill: string;
  topic: string;
  track: InterviewTrack;
  isResolved: boolean;
  score: number | null;
  explanation?: string;
  createdAt: string;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onStartPractice,
  onResumeSession,
  onLogout,
  currentConfig,
  onSelectMode,
  onSelectDifficulty,
  onSelectTopic,
  onSelectTrack,
  onNavigateLanding,
}) => {
  const { profile, user, isLoading: isAuthLoading, signOut } = useAuth();

  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'Candidate';
  const displayUsername = profile?.username || user?.email?.split('@')[0] || 'candidate';
  const targetRole = profile?.targetRole || 'Software Engineering';

  // State Management
  const [selectedTrack, setSelectedTrack] = useState<InterviewTrack>(
    currentConfig?.track || 'technical'
  );
  const [activeNavSection, setActiveNavSection] = useState<
    'overview' | 'ledger' | 'diagnostic' | 'dossier'
  >('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Data State
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [sessions, setSessions] = useState<InterviewHistoryItem[]>([]);
  const [deficits, setDeficits] = useState<FlaggedDeficit[]>([]);
  const [radarDimensions, setRadarDimensions] = useState<RadarDimension[]>([
    { label: 'Technical Accuracy', value: 50, code: 'ACC' },
    { label: 'Reasoning Depth', value: 50, code: 'REA' },
    { label: 'Code Architecture', value: 50, code: 'ARC' },
    { label: 'Defense / Edge Cases', value: 50, code: 'DEF' },
    { label: 'Structure & Clarity', value: 50, code: 'STR' },
    { label: 'Remediation Mastery', value: 50, code: 'REM' },
  ]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'technical' | 'hr'>('all');

  // Real Microphone Test Sensor
  const {
    isTesting: isTestingMic,
    audioLevel: micAudioLevel,
    startTest: startMicTest,
    stopTest: stopMicTest,
  } = useMicrophoneTest();

  const handleToggleMic = async () => {
    if (isTestingMic) {
      stopMicTest();
    } else {
      await startMicTest();
    }
  };

  // Synchronize incoming track prop
  useEffect(() => {
    if (currentConfig?.track && currentConfig.track !== selectedTrack) {
      setSelectedTrack(currentConfig.track);
    }
  }, [currentConfig?.track, selectedTrack]);

  // Fetch real persistent data from Supabase
  const loadDashboardData = useCallback(async () => {
    if (!user || !supabase || !isSupabaseConfigured) {
      setIsLoadingData(false);
      return;
    }

    try {
      setIsLoadingData(true);
      setDataError(null);

      // 1. Fetch metrics & in-progress session
      const dashMetrics = await loadDashboardMetrics(user.id);
      setMetrics(dashMetrics);

      // 2. Fetch recorded sessions
      const { data: sessionRows, error: sessionsErr } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sessionsErr && !sessionsErr.message.includes('schema cache')) {
        setDataError(sessionsErr.message);
      } else if (sessionRows) {
        const mappedSessions: InterviewHistoryItem[] = sessionRows.map(
          (row: Record<string, unknown>) => ({
            id: String(row.id),
            userId: String(row.user_id),
            track: (row.track as InterviewTrack) || 'technical',
            difficulty: (row.difficulty as InterviewHistoryItem['difficulty']) || 'pressure-cooker',
            topic: String(row.topic || 'General Practice'),
            mode: (row.mode as PracticeMode) || 'voice',
            status: (row.status as InterviewHistoryItem['status']) || 'completed',
            durationSeconds: Number(row.duration_seconds || 0),
            overallScore: row.overall_score != null ? Number(row.overall_score) : null,
            cadenceScore: row.cadence_score != null ? Number(row.cadence_score) : null,
            defenseScore: row.defense_score != null ? Number(row.defense_score) : null,
            feedbackSummary: row.feedback_summary ? String(row.feedback_summary) : null,
            date: row.created_at
              ? new Date(String(row.created_at)).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent',
          })
        );
        setSessions(mappedSessions);
      }

      // 3. Fetch real interactions for deficits & radar dimensions
      const { data: interactionRows } = await supabase
        .from('interview_interactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(25);

      if (interactionRows && interactionRows.length > 0) {
        // Extract real flagged deficits
        const deficitList: FlaggedDeficit[] = [];
        const seenSkills = new Set<string>();

        for (const row of interactionRows) {
          if (row.weakest_skill && !seenSkills.has(row.weakest_skill)) {
            seenSkills.add(row.weakest_skill);
            deficitList.push({
              id: String(row.id),
              skill: String(row.weakest_skill),
              topic: String(row.topic || 'Core Concept'),
              track: (row.track as InterviewTrack) || 'technical',
              isResolved: Boolean(row.is_weakness_resolved),
              score: row.overall_score != null ? Number(row.overall_score) : null,
              explanation: row.lesson_title ? String(row.lesson_title) : undefined,
              createdAt: String(row.created_at),
            });
          }
        }
        setDeficits(deficitList.slice(0, 4));

        // Compute real dimensional scores for radar chart
        const evaluatedRows = interactionRows.filter((r) => r.overall_score != null);
        if (evaluatedRows.length > 0) {
          const avgOf = (key: string, def = 50) => {
            const valid = evaluatedRows.filter((r) => r[key] != null);
            if (valid.length === 0) return def;
            const sum = valid.reduce((acc, r) => acc + Number(r[key]), 0);
            return Math.min(100, Math.max(10, Math.round(sum / valid.length)));
          };

          const resolutionRate =
            deficitList.length > 0
              ? Math.round(
                  (deficitList.filter((d) => d.isResolved).length / deficitList.length) * 100
                )
              : 60;

          setRadarDimensions([
            {
              label: 'Technical Accuracy',
              value: avgOf('technical_accuracy', avgOf('overall_score', 65)),
              code: 'ACC',
            },
            {
              label: 'Reasoning Depth',
              value: avgOf('reasoning_score', avgOf('overall_score', 60)),
              code: 'REA',
            },
            {
              label: 'Code Architecture',
              value: avgOf('overall_score', 65),
              code: 'ARC',
            },
            {
              label: 'Defense / Edge Cases',
              value: avgOf('reasoning_score', 60),
              code: 'DEF',
            },
            {
              label: 'Structure & Clarity',
              value: avgOf('structure_score', 70),
              code: 'STR',
            },
            {
              label: 'Remediation Mastery',
              value: resolutionRate,
              code: 'REM',
            },
          ]);
        }
      } else {
        setDeficits([]);
      }
    } catch (err: unknown) {
      console.warn('[EchoTutor Dashboard] Data load notice:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle Track Switching
  const handleSwitchTrack = (track: InterviewTrack) => {
    setSelectedTrack(track);
    if (onSelectTrack) {
      onSelectTrack(track);
    }
  };

  // Discard In-Progress Session
  const handleDiscardInProgressSession = async () => {
    if (!metrics?.inProgressSession || !user) return;
    try {
      await updateSessionStatus({
        sessionId: metrics.inProgressSession.id,
        userId: user.id,
        status: 'abandoned',
      });
      setToastNotice('Session archived. Ready for fresh evaluation vector.');
      await loadDashboardData();
    } catch (err) {
      console.warn('[EchoTutor Dashboard] Archive error:', err);
    }
  };

  // Resume In-Progress Session
  const handleResumeSession = () => {
    if (!metrics?.inProgressSession) return;
    if (onResumeSession) {
      onResumeSession({
        track: metrics.inProgressSession.track,
        difficulty: metrics.inProgressSession.difficulty,
        topic: metrics.inProgressSession.topic,
        customTopic: '',
        mode: metrics.inProgressSession.mode,
      });
    } else {
      onStartPractice(metrics.inProgressSession.track);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    await signOut();
    onLogout();
  };

  // Human readable duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Filtered Sessions for Execution Ledger
  const filteredSessions = useMemo(() => {
    if (historyFilter === 'all') return sessions;
    return sessions.filter((s) => s.track === historyFilter);
  }, [sessions, historyFilter]);

  // Current progression level in selected track
  const currentLevelForTrack =
    metrics?.currentLevelByTrack[selectedTrack] || 'foundation';

  const isCalibrating =
    !metrics || metrics.totalInteractionsEvaluated < 2;

  // Loading skeleton during authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-xl daemon-card relative text-center">
          <Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin mx-auto mb-4" />
          <span className="text-xs font-mono text-[#00F0FF] uppercase tracking-widest block font-bold">
            AUTHENTICATING CANDIDATE // DOSSIER SYNC
          </span>
          <p className="text-xs font-mono text-[#9EA6B0] mt-2">
            Restoring encrypted candidate profile and telemetry parameters...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-[#F8FAFC] selection:bg-[#00F0FF] selection:text-[#0A0B0D] relative font-inter">
      {/* 1. Desktop & Mobile Navigation Sidebar */}
      <DashboardSidebar
        currentTrack={selectedTrack}
        progressionTier={currentLevelForTrack}
        userName={displayName}
        userUsername={displayUsername}
        userRole={targetRole}
        activeSection={activeNavSection}
        onSelectSection={(sec) => {
          setActiveNavSection(sec);
          if (sec === 'dossier') setIsDossierModalOpen(true);
        }}
        onOpenStudio={() => onStartPractice(selectedTrack)}
        onOpenDossier={() => setIsDossierModalOpen(true)}
        onNavigateLanding={onNavigateLanding}
        onLogout={handleSignOut}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area (offset by 64 tailwind units on desktop for sidebar) */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* 2. Top Telemetry Command Header */}
        <DashboardHeader
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          targetRole={targetRole}
          practiceMode={currentConfig?.mode || 'voice'}
          onSelectMode={onSelectMode}
          isTestingMic={isTestingMic}
          audioLevel={micAudioLevel}
          onToggleMicTest={handleToggleMic}
          userName={displayName}
          onOpenDossier={() => setIsDossierModalOpen(true)}
        />

        {/* 3. Main Dashboard Workspace */}
        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8 max-w-7xl w-full mx-auto">
          {/* Notification Toast */}
          {toastNotice && (
            <div className="p-3.5 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-xs font-mono text-[#00F0FF] flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{toastNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastNotice(null)}
                className="text-[10px] uppercase font-bold text-white hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Database Query Notice */}
          {dataError && (
            <div className="p-3.5 rounded-lg bg-[#FF4D6D]/15 border border-[#FF4D6D]/40 text-xs font-mono text-[#FF4D6D] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Session telemetry sync notice: {dataError}</span>
              </div>
              <button
                type="button"
                onClick={loadDashboardData}
                className="px-2.5 py-1 rounded bg-[#FF4D6D]/20 hover:bg-[#FF4D6D]/30 text-white font-bold text-[10px] uppercase shrink-0"
              >
                Retry Query
              </button>
            </div>
          )}

          {/* Section 1: Top Command Telemetry Bar & Track Switcher */}
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-[#14181B] border border-white/[0.08] p-5 sm:p-6 rounded-xl shadow-xl relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-56 h-56 bg-[#00F0FF]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1B2126] border border-white/[0.1] flex items-center justify-center text-[#00F0FF] shrink-0">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-syne text-base sm:text-lg font-bold text-white tracking-tight">
                      {targetRole} Runtime
                    </span>
                    <span className="bg-[#00F0FF]/15 text-[#00F0FF] font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                      {selectedTrack === 'technical' ? 'SYS-DEFENSE' : 'STAR-LEAD'}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#9EA6B0] uppercase tracking-wider block mt-0.5">
                    Target Domain: {selectedTrack === 'technical' ? 'Distributed Systems & Trade-Offs' : 'Executive Storytelling & Conflict Resolution'}
                  </span>
                </div>
              </div>

              <div className="h-8 w-px bg-white/[0.1] hidden md:block" />

              {/* Live Session Status */}
              <div className="flex items-center gap-2.5 bg-[#1B2126] px-3.5 py-2 rounded-lg border border-white/[0.06]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF85] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF85]" />
                </span>
                <div className="flex flex-col">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#9EA6B0]">
                    SESSION PIPELINE
                  </span>
                  <span className="font-mono text-[11px] text-[#00FF85] font-bold tracking-wide">
                    {metrics?.inProgressSession ? 'IN-PROGRESS RESUMABLE' : 'ARMED & READY'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Drill Telemetry & Track Switcher */}
            <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-between xl:justify-end z-10">
              <div className="flex items-center gap-5 sm:gap-6 text-right">
                <div className="flex flex-col">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#9EA6B0]">
                    Sessions Recorded
                  </span>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    <History className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span className="font-mono text-base font-bold text-white">
                      {sessions.length}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#9EA6B0]">
                    Eval Accuracy
                  </span>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    <span className="font-mono text-base font-bold text-[#00F0FF]">
                      {metrics?.averageOverallScore != null ? `${metrics.averageOverallScore}%` : '--%'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#9EA6B0]">
                    Weaknesses Fixed
                  </span>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    <span className="font-mono text-base font-bold text-[#00FF85]">
                      {metrics?.totalWeaknessesResolved || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Track Selector Switcher */}
              <div className="inline-flex rounded-lg bg-[#0A0B0D] p-1 border border-white/[0.08]">
                <button
                  type="button"
                  id="dashboard-track-tech-btn"
                  onClick={() => handleSwitchTrack('technical')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs font-bold transition-all ${
                    selectedTrack === 'technical'
                      ? 'bg-[#14181B] text-[#00F0FF] border border-[#00F0FF]/40 shadow-sm'
                      : 'text-[#9EA6B0] hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Systems & Architecture</span>
                </button>
                <button
                  type="button"
                  id="dashboard-track-lead-btn"
                  onClick={() => handleSwitchTrack('hr')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs font-bold transition-all ${
                    selectedTrack === 'hr'
                      ? 'bg-[#14181B] text-[#00F0FF] border border-[#00F0FF]/40 shadow-sm'
                      : 'text-[#9EA6B0] hover:text-white'
                  }`}
                >
                  <Users2 className="w-3.5 h-3.5" />
                  <span>Executive Leadership</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Primary Action Card (In-Progress Session OR Recommended Vector) */}
          {metrics?.inProgressSession ? (
            /* Genuine Unfinished In-Progress Session Resume Card */
            <div className="relative bg-[#14181B] border-2 border-[#00F0FF]/60 rounded-xl p-6 sm:p-7 overflow-hidden shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 animate-fadeIn">
              <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-[#00F0FF]/15 rounded-full blur-2xl pointer-events-none" />
              <div className="flex flex-col gap-2 z-10 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-[#00F0FF]/15 text-[#00F0FF] px-2.5 py-0.5 rounded font-mono text-[10px] uppercase tracking-widest font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                    RESUME ACTIVE INTERVIEW SESSION
                  </span>
                  <span className="font-mono text-[11px] text-[#9EA6B0] uppercase">
                    {metrics.inProgressSession.difficulty} • {metrics.inProgressSession.track.toUpperCase()}
                  </span>
                </div>
                <h1 className="font-syne text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {metrics.inProgressSession.topic}
                </h1>
                <p className="font-inter text-xs sm:text-sm text-[#9EA6B0] leading-relaxed">
                  Your interview state and submitted answers are safely locked in cloud storage. Pick up your practice where you paused without losing progression evidence.
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-1 font-mono text-xs text-[#9EA6B0]">
                  <span className="text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#00F0FF]" />
                    Mode: {metrics.inProgressSession.mode.toUpperCase()}
                  </span>
                  <span>•</span>
                  <span className="text-[#00F0FF] font-bold">
                    STATUS: RESTORABLE
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 z-10 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  id="dashboard-resume-session-btn"
                  onClick={handleResumeSession}
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#00F0FF] hover:bg-[#00D4E5] active:scale-[0.98] text-[#0A0B0D] font-mono text-xs uppercase tracking-wider font-extrabold rounded-lg shadow-lg shadow-[#00F0FF]/25 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>RESUME INTERVIEW STUDIO</span>
                </button>
                <button
                  type="button"
                  onClick={handleDiscardInProgressSession}
                  className="px-4 py-3.5 bg-[#1B2126] hover:bg-white/[0.08] text-[#9EA6B0] hover:text-white rounded-lg transition-colors font-mono text-xs uppercase tracking-wider"
                  title="Archive this session and free studio"
                >
                  Archive
                </button>
              </div>
            </div>
          ) : (
            /* Recommended Training Vector (When no session in-progress) */
            <div className="relative bg-[#14181B] border border-white/[0.08] rounded-xl p-6 sm:p-7 overflow-hidden shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-[#00F0FF]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex flex-col gap-2 z-10 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-[#00F0FF]/15 text-[#00F0FF] px-2.5 py-0.5 rounded font-mono text-[10px] uppercase tracking-widest font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                    Recommended Training Vector
                  </span>
                  <span className="font-mono text-[11px] text-[#9EA6B0] uppercase">
                    NODE::{selectedTrack === 'technical' ? 'PRESSURE-SYS-02' : 'BEHAVIORAL-STAR-02'}
                  </span>
                </div>
                <h1 className="font-syne text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {selectedTrack === 'technical'
                    ? 'Distributed Consensus & Raft Split-Brain Scenarios'
                    : 'STAR Conflict Resolution & Cross-Functional Alignment'}
                </h1>
                <p className="font-inter text-xs sm:text-sm text-[#9EA6B0] leading-relaxed">
                  {selectedTrack === 'technical'
                    ? 'High-pressure diagnostic drill: synthesize minority partition isolation, prevent uncommitted log truncation, and defend state quorum resolution.'
                    : 'Executive presence drill: construct rigorous STAR narratives, de-escalate cross-functional resistance, and defend data-backed project decisions.'}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-1 font-mono text-xs text-[#9EA6B0]">
                  <span className="flex items-center gap-1.5 text-white">
                    <Clock className="w-3.5 h-3.5 text-[#00F0FF]" />
                    EST. 15 MINS
                  </span>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#9EA6B0] text-[10px] uppercase">DIFFICULTY:</span>
                    {(['foundation', 'pressure-cooker', 'executive'] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => onSelectDifficulty?.(diff)}
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-all ${
                          (currentConfig?.difficulty || 'foundation') === diff
                            ? 'bg-[#00F0FF] text-[#0A0B0D]'
                            : 'bg-[#1B2126] text-[#9EA6B0] hover:text-white border border-white/[0.08]'
                        }`}
                      >
                        {diff === 'foundation' ? 'Foundation' : diff === 'pressure-cooker' ? 'Pressure' : 'Executive'}
                      </button>
                    ))}
                  </div>
                  <span>•</span>
                  <span className="text-[#00F0FF] font-bold">
                    +35 MASTERY PTS
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 z-10 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  id="dashboard-start-practice-btn"
                  onClick={() => onStartPractice(selectedTrack)}
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#00F0FF] hover:bg-[#00D4E5] active:scale-[0.98] text-[#0A0B0D] font-mono text-xs uppercase tracking-wider font-extrabold rounded-lg shadow-lg shadow-[#00F0FF]/25 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>ENTER INTERVIEW STUDIO</span>
                </button>
                <button
                  type="button"
                  onClick={() => onStartPractice(selectedTrack)}
                  className="px-3.5 py-3.5 bg-[#1B2126] hover:bg-white/[0.08] text-[#9EA6B0] hover:text-white rounded-lg transition-colors flex items-center justify-center"
                  title="Calibrate Vector in Setup Deck"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Section 3: Main Grid (Progression Engine 8 cols + Skill Diagnostic 4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (8 cols): Progression Engine + Execution Ledger */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* 3.1 Progression Engine Crucible */}
              <div className="bg-[#14181B] border border-white/[0.08] rounded-xl p-5 sm:p-6 shadow-md flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div className="flex items-center gap-3">
                    <Layers className="w-5 h-5 text-[#00F0FF]" />
                    <div>
                      <h2 className="font-syne text-lg sm:text-xl font-bold text-white tracking-wide">
                        Progression Engine
                      </h2>
                      <span className="font-mono text-[10px] text-[#9EA6B0] uppercase tracking-wider block mt-0.5">
                        Multi-Stage Technical Crucible Tier Mapping
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xs bg-[#1B2126] border border-white/[0.08] text-white px-2.5 py-1 rounded-md font-bold">
                    STAGE {currentLevelForTrack === 'executive' ? '3' : currentLevelForTrack === 'pressure-cooker' ? '2' : '1'} OF 3
                  </span>
                </div>

                {/* Crucible Tier Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Tier 1: Foundation */}
                  <div
                    className={`rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4 border transition-all ${
                      currentLevelForTrack !== 'foundation'
                        ? 'bg-[#14181B] border-[#00FF85]/40 hover:bg-[#1B2126]'
                        : 'bg-gradient-to-b from-[#14181B] to-[#1B2126] border-[#00F0FF]/50 shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#9EA6B0] font-bold tracking-wider">
                        LEVEL 01
                      </span>
                      {currentLevelForTrack !== 'foundation' ? (
                        <div className="flex items-center gap-1 text-[#00FF85] font-mono text-[10px] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>CLEARED</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[#00F0FF] font-mono text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                          <span>ACTIVE</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="font-syne text-base font-bold text-white">
                        Foundation Crucible
                      </div>
                      <div className="font-inter text-xs text-[#9EA6B0] mt-1 leading-relaxed">
                        Core system invariants, cache topologies & scale fundamentals.
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.06]">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-[#9EA6B0]">Benchmark</span>
                        <span className="text-[#00FF85] font-bold">
                          {currentLevelForTrack !== 'foundation' ? '100% Verified' : `${Math.min(100, (metrics?.totalInteractionsEvaluated || 0) * 50)}% Calibrated`}
                        </span>
                      </div>
                      <div className="w-full bg-[#0A0B0D] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#00FF85] h-full rounded-full transition-all duration-500"
                          style={{
                            width: currentLevelForTrack !== 'foundation' ? '100%' : `${Math.min(100, (metrics?.totalInteractionsEvaluated || 0) * 50)}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-[#9EA6B0]">
                        {currentLevelForTrack !== 'foundation' ? 'Verified Baseline' : `${metrics?.totalInteractionsEvaluated || 0}/2 Vectors Evaluated`}
                      </span>
                    </div>
                  </div>

                  {/* Tier 2: Pressure Cooker */}
                  <div
                    className={`rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4 border transition-all ${
                      currentLevelForTrack === 'pressure-cooker'
                        ? 'bg-gradient-to-b from-[#14181B] to-[#1B2126] border-[#00F0FF] shadow-[0_0_16px_rgba(0,240,255,0.15)]'
                        : currentLevelForTrack === 'executive'
                        ? 'bg-[#14181B] border-[#00FF85]/40'
                        : 'bg-[#14181B]/50 border-white/[0.06] opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#9EA6B0] font-bold tracking-wider">
                        LEVEL 02
                      </span>
                      {currentLevelForTrack === 'pressure-cooker' ? (
                        <div className="flex items-center gap-1 text-[#00F0FF] font-mono text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-ping" />
                          <span>ACTIVE</span>
                        </div>
                      ) : currentLevelForTrack === 'executive' ? (
                        <div className="flex items-center gap-1 text-[#00FF85] font-mono text-[10px] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>CLEARED</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[#9EA6B0] font-mono text-[10px]">
                          <Lock className="w-3 h-3" />
                          <span>GATED</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="font-syne text-base font-bold text-white flex items-center gap-1.5">
                        <span>Pressure Cooker</span>
                        <Bolt className="w-3.5 h-3.5 text-[#00F0FF]" />
                      </div>
                      <div className="font-inter text-xs text-[#9EA6B0] mt-1 leading-relaxed">
                        Fault injection, consensus drift & degradation fallback drills.
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.06]">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-[#9EA6B0]">Mastery Index</span>
                        <span className="text-[#00F0FF] font-bold">
                          {currentLevelForTrack === 'foundation' ? '--' : `${metrics?.averageOverallScore || 0}%`}
                        </span>
                      </div>
                      <div className="w-full bg-[#0A0B0D] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#00F0FF] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#00F0FF]"
                          style={{
                            width: currentLevelForTrack === 'foundation' ? '0%' : `${metrics?.averageOverallScore || 0}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-[#9EA6B0]">
                        {currentLevelForTrack === 'foundation'
                          ? 'Req: >=75% Avg & 1 Fixed Deficit'
                          : `${metrics?.totalWeaknessesResolved || 0} Weaknesses Resolved`}
                      </span>
                    </div>
                  </div>

                  {/* Tier 3: Executive Defense */}
                  <div
                    className={`rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4 border transition-all ${
                      currentLevelForTrack === 'executive'
                        ? 'bg-gradient-to-b from-[#14181B] to-[#1B2126] border-[#00FF85] shadow-[0_0_16px_rgba(0,255,133,0.2)]'
                        : 'bg-[#14181B]/40 border-white/[0.06] opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#9EA6B0] font-bold tracking-wider">
                        LEVEL 03
                      </span>
                      {currentLevelForTrack === 'executive' ? (
                        <div className="flex items-center gap-1 text-[#00FF85] font-mono text-[10px] font-bold">
                          <Award className="w-3.5 h-3.5" />
                          <span>VERIFIED</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[#9EA6B0] font-mono text-[10px]">
                          <Lock className="w-3 h-3" />
                          <span>LOCKED</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="font-syne text-base font-bold text-white">
                        Executive Defense
                      </div>
                      <div className="font-inter text-xs text-[#9EA6B0] mt-1 leading-relaxed">
                        Boardroom trade-off defense, SLA margins & high-stakes cross-examination.
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.06] bg-[#0A0B0D]/50 p-2.5 rounded-lg">
                      <span className="font-mono text-[10px] text-[#9EA6B0] leading-tight">
                        {currentLevelForTrack === 'executive'
                          ? 'Elite defense verification cleared on verified database ledger.'
                          : 'Unlock Req: Maintain >=75% score with 0 active deficits in Level 2.'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cognitive Pacing Model Banner */}
                <div className="p-4 rounded-lg bg-[#1B2126] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#00F0FF] shrink-0" />
                    <div>
                      <span className="text-white font-bold block">
                        Real-time Cognitive Pacing Model
                      </span>
                      <span className="text-[#9EA6B0] text-[11px]">
                        Speech Cadence: {metrics?.averageCadenceScore ? `${metrics.averageCadenceScore} / 100` : 'Sensor Ready'} • Audio Engine Gated
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onStartPractice(selectedTrack)}
                    className="text-[#00F0FF] hover:underline inline-flex items-center gap-1 font-bold shrink-0 text-[11px]"
                  >
                    <span>Launch Calibrated Drill</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 3.2 Execution Ledger (Session History Table) */}
              <div
                id="ledger-section"
                className="bg-[#14181B] border border-white/[0.08] rounded-xl p-5 sm:p-6 shadow-md flex flex-col gap-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-[#00F0FF]" />
                    <div>
                      <h2 className="font-syne text-lg sm:text-xl font-bold text-white tracking-wide">
                        Execution Ledger
                      </h2>
                      <span className="font-mono text-[10px] text-[#9EA6B0] uppercase tracking-wider block mt-0.5">
                        Recorded Session Drills & Delta Feedback
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('all')}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                        historyFilter === 'all'
                          ? 'bg-[#00F0FF] text-[#0A0B0D] font-bold'
                          : 'bg-[#1B2126] text-[#9EA6B0] hover:text-white'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('technical')}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                        historyFilter === 'technical'
                          ? 'bg-[#00F0FF] text-[#0A0B0D] font-bold'
                          : 'bg-[#1B2126] text-[#9EA6B0] hover:text-white'
                      }`}
                    >
                      Technical
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryFilter('hr')}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                        historyFilter === 'hr'
                          ? 'bg-[#00F0FF] text-[#0A0B0D] font-bold'
                          : 'bg-[#1B2126] text-[#9EA6B0] hover:text-white'
                      }`}
                    >
                      Behavioral
                    </button>
                    <button
                      type="button"
                      onClick={loadDashboardData}
                      title="Reload session records"
                      className="p-1 text-[#9EA6B0] hover:text-white transition-colors ml-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Ledger Table */}
                {isLoadingData ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <Loader2 className="w-6 h-6 text-[#00F0FF] animate-spin mb-2" />
                    <span className="font-mono text-xs text-[#9EA6B0]">
                      Querying encrypted session ledger...
                    </span>
                  </div>
                ) : filteredSessions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-inter text-sm border-collapse">
                      <thead>
                        <tr className="font-mono text-[10px] text-[#9EA6B0] uppercase bg-[#1B2126]/60 border-b border-white/[0.08]">
                          <th className="py-2.5 px-3 font-semibold">Timestamp / Node</th>
                          <th className="py-2.5 px-3 font-semibold">Drill Scenario</th>
                          <th className="py-2.5 px-3 font-semibold">Duration</th>
                          <th className="py-2.5 px-3 font-semibold">Score</th>
                          <th className="py-2.5 px-3 font-semibold">Status</th>
                          <th className="py-2.5 px-3 text-right font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06] font-mono text-xs">
                        {filteredSessions.map((sess) => (
                          <tr key={sess.id} className="hover:bg-[#1B2126]/40 transition-colors">
                            <td className="py-3 px-3 text-[#9EA6B0]">
                              <span>{sess.date}</span>
                              <span className="block text-[10px] text-[#00F0FF] mt-0.5">
                                #{sess.id.substring(0, 8)}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-white font-inter text-xs sm:text-sm">
                                {sess.topic}
                              </div>
                              <div className="text-[10px] text-[#9EA6B0] mt-0.5 uppercase">
                                {sess.track === 'technical' ? 'SYS-ARCH' : 'BEHAVIORAL'} • {sess.difficulty} • {sess.mode}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-[#9EA6B0]">
                              {formatDuration(sess.durationSeconds)}
                            </td>
                            <td className="py-3 px-3">
                              {sess.overallScore != null ? (
                                <span
                                  className={`font-bold ${
                                    sess.overallScore >= 75
                                      ? 'text-[#00FF85]'
                                      : sess.overallScore >= 60
                                      ? 'text-[#00F0FF]'
                                      : 'text-[#FF4D6D]'
                                  }`}
                                >
                                  {sess.overallScore.toFixed(0)}%
                                </span>
                              ) : (
                                <span className="text-[#9EA6B0]">--</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  sess.status === 'completed'
                                    ? 'bg-[#00FF85]/15 text-[#00FF85]'
                                    : sess.status === 'in-progress'
                                    ? 'bg-[#00F0FF]/15 text-[#00F0FF]'
                                    : 'bg-white/[0.08] text-[#9EA6B0]'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    sess.status === 'completed'
                                      ? 'bg-[#00FF85]'
                                      : sess.status === 'in-progress'
                                      ? 'bg-[#00F0FF] animate-pulse'
                                      : 'bg-[#9EA6B0]'
                                  }`}
                                />
                                {sess.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectTopic?.(sess.topic);
                                  onSelectDifficulty?.(sess.difficulty);
                                  onStartPractice(sess.track);
                                }}
                                className="px-2.5 py-1 rounded bg-[#1B2126] hover:bg-white/[0.08] text-[#00F0FF] hover:text-white transition-colors text-[11px]"
                              >
                                Re-Drill
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Honest Empty State for Execution Ledger */
                  <div className="p-8 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-center flex flex-col items-center justify-center my-2">
                    <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#00F0FF] flex items-center justify-center mb-3">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <h3 className="font-syne text-lg text-white font-bold uppercase tracking-wide">
                      Zero Practice Sessions Recorded
                    </h3>
                    <p className="text-xs sm:text-sm text-[#9EA6B0] max-w-md mt-1.5 leading-relaxed font-inter">
                      Launch your first technical or behavioral drill to record answer transcripts, evaluation feedback, and progression verification deltas.
                    </p>
                    <button
                      type="button"
                      onClick={() => onStartPractice(selectedTrack)}
                      className="mt-5 text-xs font-mono font-bold px-5 py-2.5 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] active:scale-[0.98] text-[#0A0B0D] inline-flex items-center gap-2 transition-all uppercase tracking-wider shadow-[0_0_12px_rgba(0,240,255,0.25)]"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start First Practice Session</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (4 cols): Skill Diagnostic Radar + Flagged Weaknesses + Acoustic HUD */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* 3.3 Skill Diagnostic Card */}
              <div
                id="diagnostic-section"
                className="bg-[#14181B] border border-white/[0.08] rounded-xl p-5 sm:p-6 shadow-md flex flex-col gap-5"
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2.5">
                    <Target className="w-4 h-4 text-[#00F0FF]" />
                    <div>
                      <h2 className="font-syne text-base sm:text-lg font-bold text-white">
                        Skill Diagnostic
                      </h2>
                      <span className="font-mono text-[9px] text-[#9EA6B0] uppercase tracking-wider block">
                        Adaptive Deficit Detection
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-[#00F0FF] bg-[#1B2126] border border-white/[0.08] px-2 py-0.5 rounded font-bold">
                    {deficits.length} FLAGGED
                  </span>
                </div>

                {/* SVG Radar Chart Component */}
                <SkillRadarChart
                  dimensions={radarDimensions}
                  isCalibrating={isCalibrating}
                  userRole={targetRole}
                />

                {/* Actionable Flagged Weaknesses */}
                <div className="flex flex-col gap-3 pt-2 border-t border-white/[0.08]">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#9EA6B0] font-bold block">
                    IDENTIFIED REMEDIATION TARGETS:
                  </span>

                  {deficits.length > 0 ? (
                    deficits.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg bg-[#1B2126] border-l-2 flex flex-col gap-1.5 transition-all ${
                          item.isResolved
                            ? 'border-[#00FF85]'
                            : item.score != null && item.score < 60
                            ? 'border-[#FF4D6D]'
                            : 'border-[#00F0FF]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono text-[9px] font-bold uppercase tracking-wider ${
                              item.isResolved
                                ? 'text-[#00FF85]'
                                : item.score != null && item.score < 60
                                ? 'text-[#FF4D6D]'
                                : 'text-[#00F0FF]'
                            }`}
                          >
                            {item.isResolved ? 'RESOLVED' : 'DEFICIT EVIDENCED'}
                          </span>
                          {item.score != null && (
                            <span className="font-mono text-[10px] text-white font-bold">
                              {item.score}%
                            </span>
                          )}
                        </div>

                        <div className="font-inter text-xs font-semibold text-white">
                          {item.skill}
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-[#9EA6B0] mt-1 pt-1 border-t border-white/[0.04]">
                          <span className="truncate max-w-[150px]">{item.topic}</span>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectTopic?.(item.topic);
                              onStartPractice(item.track);
                            }}
                            className="text-[#00F0FF] hover:underline uppercase font-bold"
                          >
                            Practice Drill →
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    /* Honest Empty State for Flagged Weaknesses */
                    <div className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.06] text-center">
                      <p className="text-xs font-inter text-[#9EA6B0] leading-relaxed">
                        No recurring skill deficits flagged in your history yet. Complete evaluations to diagnose weak spots.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 3.4 Acoustic Articulation Node HUD */}
              <div className="bg-[#14181B] border border-white/[0.08] rounded-xl p-5 shadow-md flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
                    <span className="font-mono text-[10px] uppercase font-bold text-white tracking-wider">
                      Acoustic Articulation Node
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#00FF85] font-bold">
                    {isTestingMic ? 'LIVE SENSOR' : 'ONLINE // ARMED'}
                  </span>
                </div>

                {/* Visualizer Waveform Bars */}
                <div className="h-12 bg-[#0A0B0D] rounded-lg p-2 flex items-end justify-between gap-1 overflow-hidden border border-white/[0.06]">
                  {Array.from({ length: 18 }).map((_, idx) => {
                    const baseHeight = isTestingMic
                      ? Math.min(
                          100,
                          Math.max(15, Math.sin((idx + 1) * 0.8) * 30 + micAudioLevel * 140)
                        )
                      : (idx % 3 === 0 ? 30 : idx % 2 === 0 ? 45 : 20);
                    return (
                      <div
                        key={idx}
                        className={`w-1.5 rounded-full transition-all duration-150 ${
                          idx % 5 === 0
                            ? 'bg-[#00FF85]'
                            : 'bg-[#00F0FF]'
                        }`}
                        style={{ height: `${baseHeight}%` }}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between font-mono text-[10px] text-[#9EA6B0] pt-1">
                  <span>
                    Cadence Index:{' '}
                    <strong className="text-[#00FF85]">
                      {metrics?.averageCadenceScore ? `${metrics.averageCadenceScore}/100` : '--/100'}
                    </strong>
                  </span>
                  <span>
                    Defense Depth:{' '}
                    <strong className="text-[#00F0FF]">
                      {metrics?.averageDefenseScore ? `${metrics.averageDefenseScore}/100` : '--/100'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 4. Candidate Profile Dossier Edit Modal */}
      <ProfileEditModal
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
        onSuccessNotice={(msg) => {
          setToastNotice(msg);
          setTimeout(() => setToastNotice(null), 4000);
        }}
      />
    </div>
  );
};
