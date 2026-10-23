import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowRight,
  SlidersHorizontal,
  History,
  TrendingUp,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Award,
  Terminal,
  GraduationCap,
  Edit3,
  Check,
  X,
  Loader2,
  AlertCircle,
  Code2,
  Users2,
  Volume2,
  Keyboard,
  Clock,
  Target,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type {
  StudentProfileData,
  ExperienceLevel,
  EducationLevel,
  InterviewTrack,
  InterviewConfig,
  PracticeMode,
  InterviewHistoryItem,
} from '../../types';

interface UserDashboardProps {
  onStartPractice: (track?: InterviewTrack) => void;
  onLogout: () => void;
  currentConfig?: InterviewConfig;
  onSelectMode?: (mode: PracticeMode) => void;
}

const educationOptions: EducationLevel[] = [
  'Undergraduate',
  'Postgraduate',
  'High School',
  'Doctorate',
  'Diploma',
  'Other',
];

const studyYearOptions = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year / Final Year',
  'Recent Graduate (2025)',
  'Recent Graduate (2024)',
  'Alumni / Working Professional',
];

const experienceOptions: ExperienceLevel[] = ['Fresher', 'Internship', 'Experienced'];

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onStartPractice,
  onLogout,
  currentConfig,
  onSelectMode,
}) => {
  const { profile, user, isLoading: isAuthLoading, signOut, updateProfile } = useAuth();

  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'Candidate';
  const displayUsername = profile?.username || user?.email?.split('@')[0] || 'candidate';
  const displayEmail = user?.email || profile?.email || 'candidate@domain.com';

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  const [editFullName, setEditFullName] = useState(profile?.fullName || '');
  const [editAge, setEditAge] = useState(profile?.age ? String(profile.age) : '');
  const [editEducationLevel, setEditEducationLevel] = useState(profile?.educationLevel || 'Undergraduate');
  const [editCourseDegree, setEditCourseDegree] = useState(profile?.courseDegree || '');
  const [editStudyYear, setEditStudyYear] = useState(profile?.studyYear || '1st Year');
  const [editCollege, setEditCollege] = useState(profile?.college || '');
  const [editTargetRole, setEditTargetRole] = useState(profile?.targetRole || '');
  const [editExperienceLevel, setEditExperienceLevel] = useState<ExperienceLevel>(profile?.experienceLevel || 'Fresher');
  const [editSkills, setEditSkills] = useState(profile?.skills || '');

  // Session History State (Loaded from public.interview_sessions)
  const [sessions, setSessions] = useState<InterviewHistoryItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  // Fetch real interview sessions from Supabase
  const loadSessions = useCallback(async () => {
    if (!user || !supabase || !isSupabaseConfigured) {
      setIsLoadingSessions(false);
      return;
    }

    try {
      setIsLoadingSessions(true);
      setSessionsError(null);

      // Query sessions strictly for the authenticated candidate
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Table may not have been migrated yet via SQL migration; handle gracefully
        setSessions([]);
        if (!error.message.includes('does not exist') && !error.message.includes('schema cache')) {
          setSessionsError(error.message);
        }
      } else if (data) {
        const mappedSessions: InterviewHistoryItem[] = data.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          userId: String(row.user_id),
          track: (row.track as InterviewTrack) || 'technical',
          difficulty: (row.difficulty as InterviewHistoryItem['difficulty']) || 'pressure-cooker',
          topic: String(row.topic || 'General Practice'),
          mode: (row.mode as PracticeMode) || 'voice',
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
        }));
        setSessions(mappedSessions);
      }
    } catch (err) {
      setSessions([]);
      console.warn('[EchoTutor Dashboard] Sessions fetch caught:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleStartEdit = () => {
    setEditFullName(profile?.fullName || '');
    setEditAge(profile?.age ? String(profile.age) : '');
    setEditEducationLevel(profile?.educationLevel || 'Undergraduate');
    setEditCourseDegree(profile?.courseDegree || '');
    setEditStudyYear(profile?.studyYear || '1st Year');
    setEditCollege(profile?.college || '');
    setEditTargetRole(profile?.targetRole || '');
    setEditExperienceLevel(profile?.experienceLevel || 'Fresher');
    setEditSkills(profile?.skills || '');
    setEditSuccessMsg(null);
    setEditErrorMsg(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditSuccessMsg(null);
    setEditErrorMsg(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setEditSuccessMsg(null);
    setEditErrorMsg(null);

    const updates: Partial<StudentProfileData> = {
      fullName: editFullName.trim(),
      age: editAge ? Number(editAge) : '',
      educationLevel: editEducationLevel,
      courseDegree: editCourseDegree.trim(),
      studyYear: editStudyYear,
      college: editCollege.trim() || undefined,
      targetRole: editTargetRole.trim() || undefined,
      experienceLevel: editExperienceLevel,
      skills: editSkills.trim() || undefined,
    };

    const { error } = await updateProfile(updates);
    setIsSaving(false);

    if (error) {
      setEditErrorMsg(error.message);
    } else {
      setEditSuccessMsg('Candidate profile updated successfully.');
      setIsEditing(false);
      setTimeout(() => setEditSuccessMsg(null), 4000);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onLogout();
  };

  const formattedJoinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Active Session';

  // Format seconds to human readable
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Auth Loading Skeleton
  if (isAuthLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center justify-center min-h-[60vh] font-inria">
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center animate-fade-in font-inria">
      {/* Top Telemetry Breadcrumb */}
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-4 mb-8">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF] animate-pulse" />
          <span className="text-[11px] font-mono text-[#00F0FF] tracking-wider uppercase font-bold">
            CANDIDATE WORKSTATION // ID #{user?.id?.substring(0, 8) || '0000'}
          </span>
          <span className="text-xs text-white/20">•</span>
          <span className="text-xs font-mono text-[#9EA6B0] uppercase hidden sm:inline">
            Acoustic Cadence Armed & Ready
          </span>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="text-xs font-mono text-[#9EA6B0] hover:text-[#FF4D6D] transition-colors inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg daemon-card daemon-card-hover uppercase tracking-wider"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Hero Welcome Banner */}
      <div className="w-full mb-8 p-6 sm:p-8 rounded-xl daemon-card relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-tr" aria-hidden="true">+</span>
        <span className="daemon-crosshair-bl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-br" aria-hidden="true">+</span>

        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-md daemon-badge">
            <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#00F0FF] font-bold">
              AI INTERVIEW WORKSTATION // DAEMON V0.4
            </span>
          </div>
          <h1 className="font-anton text-3xl sm:text-4xl md:text-5xl text-[#FFFFFF] uppercase tracking-wide leading-tight">
            Welcome, <span className="text-[#00F0FF]">{displayName}</span>
          </h1>
          <div className="flex items-center gap-2.5 mt-2 text-xs font-mono text-[#9EA6B0]">
            <span className="text-[#00F0FF] font-bold">@{displayUsername}</span>
            <span>•</span>
            <span>{profile?.courseDegree || 'Engineering'}</span>
            <span>•</span>
            <span>{profile?.studyYear || '1st Year'}</span>
          </div>
          <p className="text-sm sm:text-base text-[#9EA6B0] mt-3 leading-relaxed">
            Targeting{' '}
            <span className="text-[#FFFFFF] font-bold">{profile?.targetRole || 'Software Engineering'}</span> roles.
            Rehearse under real-time acoustic frequency analysis and structured defense evaluation.
          </p>
        </div>

        {/* Quick Launch Action */}
        <div className="shrink-0 w-full sm:w-auto">
          <button
            type="button"
            id="dashboard-start-practice-btn"
            onClick={() => onStartPractice()}
            className="w-full sm:w-auto min-h-[52px] px-7 py-3 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] active:scale-[0.98] text-[#0A0B0D] font-anton text-lg tracking-wider uppercase inline-flex items-center justify-center gap-2.5 transition-all shadow-[0_0_20px_rgba(0,240,255,0.35)] focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
          >
            <span>[ ⨂ Quick Launch Studio ⨂ ]</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Active Calibration State Bar */}
      {currentConfig && (
        <div className="w-full mb-8 p-4 rounded-xl bg-[#0A0B0D] border border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <span className="text-[#9EA6B0] uppercase tracking-wider text-[11px] font-bold">
              CALIBRATION PRESETS:
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#14181B] border border-white/[0.08]">
              <Target className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="text-[#9EA6B0]">Topic:</span>
              <span className="text-white font-bold truncate max-w-[200px]">{currentConfig.topic}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#14181B] border border-white/[0.08]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="text-[#9EA6B0]">Difficulty:</span>
              <span className="text-[#00F0FF] font-bold uppercase">{currentConfig.difficulty}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Quick Practice Mode Switcher */}
            {onSelectMode && (
              <div className="inline-flex rounded-lg bg-[#14181B] p-1 border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => onSelectMode('voice')}
                  className={`text-xs font-mono px-3 py-1 rounded-md inline-flex items-center gap-1.5 transition-all ${
                    currentConfig.mode === 'voice'
                      ? 'bg-[#00F0FF] text-[#0A0B0D] font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                      : 'text-[#9EA6B0] hover:text-[#FFFFFF]'
                  }`}
                  aria-pressed={currentConfig.mode === 'voice'}
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Voice</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectMode('typed')}
                  className={`text-xs font-mono px-3 py-1 rounded-md inline-flex items-center gap-1.5 transition-all ${
                    currentConfig.mode === 'typed'
                      ? 'bg-[#00F0FF] text-[#0A0B0D] font-bold shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                      : 'text-[#9EA6B0] hover:text-[#FFFFFF]'
                  }`}
                  aria-pressed={currentConfig.mode === 'typed'}
                >
                  <Keyboard className="w-3 h-3" />
                  <span>Typed</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => onStartPractice()}
              className="text-xs font-mono text-[#00F0FF] hover:underline uppercase tracking-wider inline-flex items-center gap-1"
            >
              <span>Adjust in Setup</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Section 2: Start Practicing Track Action Cards */}
      <div className="w-full mb-10">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-6">
          <div className="flex items-center gap-2.5">
            <Target className="w-4 h-4 text-[#00F0FF]" />
            <h2 className="font-anton text-2xl text-[#FFFFFF] uppercase tracking-wide">
              Select Practice Track
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded daemon-badge font-bold">
            STEP 01 // CALIBRATION
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Track 1: Technical Interview */}
          <div className="daemon-card rounded-xl p-6 sm:p-7 relative flex flex-col justify-between group hover:border-[#00F0FF]/50 transition-all">
            <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
            <span className="daemon-crosshair-tr" aria-hidden="true">+</span>
            <span className="daemon-crosshair-bl" aria-hidden="true">+</span>
            <span className="daemon-crosshair-br" aria-hidden="true">+</span>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono text-[#00F0FF] tracking-widest uppercase font-bold px-2 py-0.5 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/30">
                  TRACK // 01
                </span>
                <span className="text-xs font-mono text-[#9EA6B0]">
                  SYSTEMS & ARCHITECTURE
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#0A0B0D] border border-white/[0.1] group-hover:border-[#00F0FF]/50 flex items-center justify-center transition-colors">
                  <Code2 className="w-5 h-5 text-[#00F0FF]" />
                </div>
                <h3 className="font-anton text-2xl text-[#FFFFFF] uppercase tracking-wide group-hover:text-[#00F0FF] transition-colors">
                  Technical Interview
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-[#9EA6B0] leading-relaxed mb-5 font-inria">
                Rigorous algorithmic challenges, distributed consensus, data structures, trade-off defense, and code architecture questions.
              </p>

              {/* Focus tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {['Algorithms', 'System Design', 'Clean Code', 'Edge Defense'].map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono px-2.5 py-1 rounded bg-[#0A0B0D] border border-white/[0.08] text-[#9EA6B0]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              id="dashboard-track-technical-btn"
              onClick={() => onStartPractice('technical')}
              className="w-full min-h-[46px] px-5 py-2.5 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] text-[#0A0B0D] font-anton text-base tracking-wider uppercase inline-flex items-center justify-center gap-2 transition-all shadow-[0_0_16px_rgba(0,240,255,0.25)]"
            >
              <span>[ Launch Technical Track ]</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Track 2: HR & Behavioral Interview */}
          <div className="daemon-card rounded-xl p-6 sm:p-7 relative flex flex-col justify-between group hover:border-[#00F0FF]/50 transition-all">
            <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
            <span className="daemon-crosshair-tr" aria-hidden="true">+</span>
            <span className="daemon-crosshair-bl" aria-hidden="true">+</span>
            <span className="daemon-crosshair-br" aria-hidden="true">+</span>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono text-[#00F0FF] tracking-widest uppercase font-bold px-2 py-0.5 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/30">
                  TRACK // 02
                </span>
                <span className="text-xs font-mono text-[#9EA6B0]">
                  CULTURE & LEADERSHIP
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#0A0B0D] border border-white/[0.1] group-hover:border-[#00F0FF]/50 flex items-center justify-center transition-colors">
                  <Users2 className="w-5 h-5 text-[#00F0FF]" />
                </div>
                <h3 className="font-anton text-2xl text-[#FFFFFF] uppercase tracking-wide group-hover:text-[#00F0FF] transition-colors">
                  HR & Behavioral Interview
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-[#9EA6B0] leading-relaxed mb-5 font-inria">
                STAR framework storytelling, conflict resolution, executive tone, cross-functional collaboration, and leadership principles.
              </p>

              {/* Focus tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {['STAR Narrative', 'Conflict Resolution', 'Leadership', 'Pressure Resilience'].map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono px-2.5 py-1 rounded bg-[#0A0B0D] border border-white/[0.08] text-[#9EA6B0]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              id="dashboard-track-hr-btn"
              onClick={() => onStartPractice('hr')}
              className="w-full min-h-[46px] px-5 py-2.5 rounded-lg daemon-chip hover:border-[#00F0FF]/60 hover:bg-[#00F0FF]/15 text-[#FFFFFF] font-anton text-base tracking-wider uppercase inline-flex items-center justify-center gap-2 transition-all border border-white/[0.12]"
            >
              <span>[ Launch Behavioral Track ]</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5] text-[#00F0FF]" />
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {editSuccessMsg && (
        <div className="w-full mb-6 p-4 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/40 flex items-center gap-2.5 text-xs font-mono text-[#00F0FF]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{editSuccessMsg}</span>
        </div>
      )}

      {/* Candidate Dossier & Academic Profile Card */}
      <div className="w-full daemon-card rounded-xl p-6 sm:p-8 relative mb-8">
        <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-tr" aria-hidden="true">+</span>
        <span className="daemon-crosshair-bl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-br" aria-hidden="true">+</span>

        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-[#00F0FF]" />
            <div>
              <span className="text-[10px] font-mono text-[#00F0FF] tracking-widest uppercase font-bold block">
                VERIFIED CANDIDATE DOSSIER
              </span>
              <h2 className="font-anton text-2xl text-[#FFFFFF] uppercase tracking-wide">
                Candidate Academic & Career Profile
              </h2>
            </div>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              className="text-xs font-mono px-3.5 py-1.5 rounded-lg daemon-card daemon-card-hover text-[#00F0FF] border border-[#00F0FF]/40 inline-flex items-center gap-1.5 uppercase tracking-wider transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs font-mono px-3 py-1.5 rounded-lg daemon-card daemon-card-hover text-[#9EA6B0] hover:text-[#FFFFFF] inline-flex items-center gap-1.5 uppercase tracking-wider transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {/* View Mode */}
        {!isEditing ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.08]">
                <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">
                  Education & Degree
                </span>
                <span className="text-sm font-mono text-[#FFFFFF] font-bold mt-1 block truncate">
                  {profile?.courseDegree || 'Computer Science'}
                </span>
                <span className="text-[11px] font-mono text-[#9EA6B0] block mt-0.5">
                  {profile?.educationLevel || 'Undergraduate'}
                </span>
              </div>

              <div className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.08]">
                <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">
                  Study Year & Age
                </span>
                <span className="text-sm font-mono text-[#FFFFFF] font-bold mt-1 block">
                  {profile?.studyYear || '1st Year'}
                </span>
                <span className="text-[11px] font-mono text-[#00F0FF] block mt-0.5">
                  Age: {profile?.age || '--'}
                </span>
              </div>

              <div className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.08]">
                <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">
                  College / Institution
                </span>
                <span className="text-sm font-mono text-[#FFFFFF] font-bold mt-1 block truncate">
                  {profile?.college || 'Not specified'}
                </span>
                <span className="text-[11px] font-mono text-[#9EA6B0] block mt-0.5">
                  Institution ID
                </span>
              </div>

              <div className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.08]">
                <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">
                  Target Role & Experience
                </span>
                <span className="text-sm font-mono text-[#00F0FF] font-bold mt-1 block truncate">
                  {profile?.targetRole || 'Software Engineer'}
                </span>
                <span className="text-[11px] font-mono text-[#7AE582] block mt-0.5">
                  Level: {profile?.experienceLevel || 'Fresher'}
                </span>
              </div>
            </div>

            {/* Skills & Focus Areas */}
            <div className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.08]">
              <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block mb-1.5">
                Technical Focus & Skills
              </span>
              <p className="text-xs font-mono text-[#FFFFFF] leading-relaxed">
                {profile?.skills || 'System Architecture, Algorithms, Clean Code, STAR Narrative Framework'}
              </p>
            </div>
          </div>
        ) : (
          /* Inline Profile Edit Form */
          <form onSubmit={handleSaveProfile} className="space-y-5 animate-fadeIn">
            {editErrorMsg && (
              <div className="p-3 rounded-lg bg-[#FF4D6D]/10 border border-[#FF4D6D]/40 text-xs font-mono text-[#FF4D6D] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editErrorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-[#0A0B0D] text-sm font-mono px-3 py-2 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1">
                  Age
                </label>
                <input
                  type="number"
                  min={13}
                  max={120}
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  className="w-full bg-[#0A0B0D] text-sm font-mono px-3 py-2 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1">
                  Education Level
                </label>
                <select
                  value={editEducationLevel}
                  onChange={(e) => setEditEducationLevel(e.target.value)}
                  className="w-full bg-[#0A0B0D] text-sm font-mono px-3 py-2 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:outline-none"
                >
                  {educationOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#14181B]">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1">
                  Course or Degree
                </label>
                <input
                  type="text"
                  value={editCourseDegree}
                  onChange={(e) => setEditCourseDegree(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science"
                  className="w-full bg-[#0A0B0D] text-sm font-mono px-3 py-2 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1">
                  Study Year
                </label>
                <select
                  value={editStudyYear}
                  onChange={(e) => setEditStudyYear(e.target.value)}
                  className="w-full bg-[#0A0B0D] text-sm font-mono px-3 py-2 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:outline-none"
                >
                  {studyYearOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#14181B]">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1">
                  College / Institution
                </label>
                <input
                  type="text"
                  value={editCollege}
                  onChange={(e) => setEditCollege(e.target.value)}
                  placeholder="e.g. IIT Delhi"
                  className="w-full bg-[#0A0B0D] text-sm font-mono px-3 py-2 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1">
                  Target Job Role
                </label>
                <input
                  type="text"
                  value={editTargetRole}
                  onChange={(e) => setEditTargetRole(e.target.value)}
                  placeholder="e.g. SDE-1 / Frontend Engineer"
                  className="w-full bg-[#0A0B0D] text-sm font-mono px-3 py-2 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1">
                  Experience Level
                </label>
                <select
                  value={editExperienceLevel}
                  onChange={(e) => setEditExperienceLevel(e.target.value as ExperienceLevel)}
                  className="w-full bg-[#0A0B0D] text-sm font-mono px-3 py-2 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:outline-none"
                >
                  {experienceOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#14181B]">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1">
                Skills & Technical Focus Areas
              </label>
              <input
                type="text"
                value={editSkills}
                onChange={(e) => setEditSkills(e.target.value)}
                placeholder="e.g. React, TypeScript, Python, System Design"
                className="w-full bg-[#0A0B0D] text-sm font-mono px-3 py-2 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] text-[#0A0B0D] font-mono font-bold text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-all disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Profile Changes</span>
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2.5 rounded-lg daemon-card daemon-card-hover text-[#9EA6B0] hover:text-[#FFFFFF] font-mono text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Main Grid: Session History (Left, 7 cols) & Progress / Weaknesses (Right, 5 cols) */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        {/* Left Column: Interview Session History */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="daemon-card rounded-xl p-6 sm:p-7 relative flex-1 flex flex-col justify-between">
            <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
            <span className="daemon-crosshair-tr" aria-hidden="true">+</span>

            <div>
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-[#00F0FF]" />
                  <h2 className="font-anton text-xl text-[#FFFFFF] uppercase tracking-wide">
                    Interview Practice History
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadSessions}
                    title="Reload session records"
                    className="p-1 text-[#9EA6B0] hover:text-white transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                  </button>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded daemon-chip font-bold">
                    {sessions.length} {sessions.length === 1 ? 'SESSION' : 'SESSIONS'} RECORDED
                  </span>
                </div>
              </div>

              {sessionsError && (
                <div className="mb-4 p-3 rounded-lg bg-[#FF4D6D]/10 border border-[#FF4D6D]/40 text-xs font-mono text-[#FF4D6D] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Session fetch notice: {sessionsError}</span>
                </div>
              )}

              {/* Sessions List or Honest Empty State */}
              {isLoadingSessions ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-6 h-6 text-[#00F0FF] animate-spin mb-2" />
                  <span className="text-xs font-mono text-[#9EA6B0]">Querying encrypted session history...</span>
                </div>
              ) : sessions.length > 0 ? (
                <div className="space-y-3 my-2">
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.08] hover:border-[#00F0FF]/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                              sess.track === 'technical'
                                ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40'
                                : 'bg-[#B8A5FF]/15 text-[#B8A5FF] border border-[#B8A5FF]/40'
                            }`}
                          >
                            {sess.track === 'technical' ? 'TECHNICAL' : 'BEHAVIORAL'}
                          </span>
                          <span className="text-[10px] font-mono text-[#9EA6B0] uppercase">
                            {sess.difficulty}
                          </span>
                          <span className="text-xs text-white/20">•</span>
                          <span className="text-[10px] font-mono text-[#9EA6B0]">
                            {sess.mode === 'voice' ? 'Voice' : 'Typed'}
                          </span>
                        </div>
                        <h4 className="text-sm font-mono text-white font-bold truncate max-w-sm">
                          {sess.topic}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-[#9EA6B0]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#00F0FF]" />
                            {formatDuration(sess.durationSeconds)}
                          </span>
                          <span>•</span>
                          <span>{sess.date}</span>
                        </div>
                      </div>

                      {/* Scores if available */}
                      {sess.overallScore != null && (
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">
                            Overall Score
                          </span>
                          <span className="text-lg font-mono text-[#00F0FF] font-bold">
                            {sess.overallScore.toFixed(0)}/100
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Honest Empty State for Interview History */
                <div className="p-8 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-center flex flex-col items-center justify-center my-4">
                  <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#9EA6B0] flex items-center justify-center mb-3.5">
                    <Terminal className="w-5 h-5 text-[#00F0FF]" />
                  </div>
                  <h3 className="font-anton text-lg text-[#FFFFFF] uppercase tracking-wide">
                    Zero Practice Sessions Completed
                  </h3>
                  <p className="text-xs sm:text-sm text-[#9EA6B0] max-w-md mt-1.5 leading-relaxed font-inria">
                    Complete your first technical defense or behavioral challenge to record response transcripts, acoustic cadence, and AI follow-up history.
                  </p>
                  <button
                    type="button"
                    onClick={() => onStartPractice()}
                    className="mt-5 text-xs font-mono font-bold px-5 py-2.5 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] text-[#0A0B0D] inline-flex items-center gap-2 transition-all uppercase tracking-wider shadow-[0_0_12px_rgba(0,240,255,0.25)]"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Configure First Practice Session</span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-[#9EA6B0]">
              <span>STORAGE: ENCRYPTED SUPABASE DB</span>
              <span className="text-[#00F0FF]">ZERO HALLUCINATED METRICS</span>
            </div>
          </div>
        </div>

        {/* Right Column: Progress & Weaknesses Matrix */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="daemon-card rounded-xl p-6 sm:p-7 relative flex-1 flex flex-col justify-between">
            <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
            <span className="daemon-crosshair-tr" aria-hidden="true">+</span>

            <div>
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-[#00F0FF]" />
                  <h2 className="font-anton text-xl text-[#FFFFFF] uppercase tracking-wide">
                    Progress & Weakness Vector
                  </h2>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded daemon-badge font-bold">
                  {sessions.length >= 2 ? 'ACTIVE TELEMETRY' : 'CALIBRATING'}
                </span>
              </div>

              {/* Honest Empty State for Performance Metrics */}
              {sessions.length < 2 ? (
                <div className="p-6 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-center flex flex-col items-center justify-center my-4">
                  <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#9EA6B0] flex items-center justify-center mb-3">
                    <Award className="w-5 h-5 text-[#00F0FF]" />
                  </div>
                  <h3 className="font-anton text-base text-[#FFFFFF] uppercase tracking-wide">
                    Acoustic Cadence & Weaknesses Pending
                  </h3>
                  <p className="text-xs text-[#9EA6B0] mt-1.5 leading-relaxed font-inria">
                    Trade-off defense depth, hesitation index, and STAR narrative structure will compute automatically across your practice sessions.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.08] space-y-3 my-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#9EA6B0]">Sessions Evaluated:</span>
                    <span className="text-white font-bold">{sessions.length} Completed</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#9EA6B0]">Cadence Consistency:</span>
                    <span className="text-[#00F0FF] font-bold">Optimal Tracking</span>
                  </div>
                </div>
              )}

              {/* Metric Pillars Preview (Honest State) */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-left">
                  <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">
                    Cadence Clarity
                  </span>
                  <span className="text-sm font-mono text-[#FFFFFF]/50 font-bold mt-1 block">
                    -- / 100
                  </span>
                  <span className="text-[9px] font-mono text-[#9EA6B0] block mt-0.5">
                    Audio Engine Verified
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-left">
                  <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">
                    Trade-off Defense
                  </span>
                  <span className="text-sm font-mono text-[#FFFFFF]/50 font-bold mt-1 block">
                    -- / 100
                  </span>
                  <span className="text-[9px] font-mono text-[#9EA6B0] block mt-0.5">
                    STAR Analysis Gated
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] text-[11px] font-mono text-[#9EA6B0]">
              ANALYSIS PIPELINE: <span className="text-[#00F0FF]">REAL WEB AUDIO ENGINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Security Footer Dossier */}
      <div className="w-full daemon-card rounded-xl p-6 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs font-mono text-[#9EA6B0]">
            <ShieldCheck className="w-4 h-4 text-[#00F0FF]" />
            <span>
              Candidate account: <strong className="text-white">{displayEmail}</strong> • Member since{' '}
              {formattedJoinDate} • RLS Protected
            </span>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs font-mono font-bold px-4 py-2 rounded-lg bg-[#FF4D6D]/15 hover:bg-[#FF4D6D]/25 border border-[#FF4D6D]/40 text-[#FF4D6D] inline-flex items-center gap-2 transition-all uppercase tracking-wider"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
