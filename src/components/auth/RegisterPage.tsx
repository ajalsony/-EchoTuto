import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  Loader2,
  Check,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Sparkles,
  BookOpen,
  Calendar,
  Building,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { StudentProfileData, ExperienceLevel, EducationLevel } from '../../types';

interface RegisterPageProps {
  onNavigateLogin: () => void;
  onSuccess: (needsVerification: boolean, email: string) => void;
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

const experienceOptions: { id: ExperienceLevel; label: string }[] = [
  { id: 'Fresher', label: 'Fresher / Student' },
  { id: 'Internship', label: 'Internship Experience' },
  { id: 'Experienced', label: 'Experienced Professional' },
];

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigateLogin,
  onSuccess,
}) => {
  const { signUp, checkUsernameAvailable, isConfigured } = useAuth();

  // Credentials State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Student Profile State
  const [age, setAge] = useState<string>('');
  const [educationLevel, setEducationLevel] = useState<string>('Undergraduate');
  const [courseDegree, setCourseDegree] = useState('');
  const [studyYear, setStudyYear] = useState('1st Year');

  // Optional Career Targeting State
  const [college, setCollege] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Fresher');
  const [skills, setSkills] = useState('');

  // Consent & Status State
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Username validation state: 'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const usernameDebounceRef = useRef<number | null>(null);

  // Live password requirements
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;

  // Handle live username check
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (usernameDebounceRef.current) {
      window.clearTimeout(usernameDebounceRef.current);
    }

    if (!trimmed) {
      setUsernameStatus('idle');
      return;
    }

    // Alphanumeric + underscore/hyphen, 3-20 chars
    const isValidFormat = /^[a-zA-Z0-9_-]{3,20}$/.test(trimmed);
    if (!isValidFormat) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    usernameDebounceRef.current = window.setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(trimmed);
        setUsernameStatus(available ? 'available' : 'taken');
      } catch {
        setUsernameStatus('available');
      }
    }, 400);

    return () => {
      if (usernameDebounceRef.current) {
        window.clearTimeout(usernameDebounceRef.current);
      }
    };
  }, [username, checkUsernameAvailable]);

  const validate = (): string | null => {
    // 1. Credentials
    if (!fullName.trim()) return 'Full name is required.';
    if (!username.trim()) return 'Username is required.';
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username.trim())) {
      return 'Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens.';
    }
    if (usernameStatus === 'taken') return 'Username is already taken. Please choose another.';

    if (!email.trim()) return 'Email address is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return 'Please enter a valid email address.';

    if (!hasMinLength) return 'Password must be at least 8 characters.';
    if (!hasNumber) return 'Password must include at least one number.';
    if (!hasLetter) return 'Password must include at least one letter.';
    if (password !== confirmPassword) return 'Passwords do not match.';

    // 2. Academic Profile
    if (!age || isNaN(Number(age)) || Number(age) < 13 || Number(age) > 120) {
      return 'Please enter a valid age (13 to 120).';
    }
    if (!courseDegree.trim()) {
      return 'Course or degree is required (e.g. B.Tech Computer Science).';
    }

    // 3. Terms
    if (!agreeTerms) return 'Please accept the EchoTutor Telemetry Terms and Privacy Protocol.';

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent concurrent or duplicate registration attempts
    setErrorMsg(null);

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    const studentData: StudentProfileData = {
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim(),
      age: Number(age),
      educationLevel,
      courseDegree: courseDegree.trim(),
      studyYear,
      college: college.trim() || undefined,
      targetRole: targetRole.trim() || undefined,
      experienceLevel,
      skills: skills.trim() || undefined,
    };

    const { error, needsEmailVerification } = await signUp(studentData, password);

    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    onSuccess(Boolean(needsEmailVerification), email.trim());
  };

  const isRateLimit = Boolean(errorMsg && errorMsg.includes('verification emails'));
  const isExistingAccount = Boolean(errorMsg && errorMsg.includes('already registered'));

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-10 relative daemon-grid-bg">
      {/* Ambient Illumination */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[360px] bg-gradient-to-b from-[#00F0FF]/10 via-[#00F0FF]/[0.02] to-transparent blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Status Header Bar */}
      <div className="w-full max-w-2xl mb-4 flex items-center justify-between">
        <span className="text-xs font-mono text-[#9EA6B0] tracking-wider uppercase">
          ONBOARDING // <span className="text-[#00F0FF] font-bold">STUDENT REGISTRATION</span>
        </span>

        <span className="text-[11px] font-mono text-[#9EA6B0]">
          SECURITY: <span className="text-[#00F0FF] font-bold">256-BIT TLS</span>
        </span>
      </div>

      {/* Main Registration Card */}
      <div className="w-full max-w-2xl daemon-card rounded-xl p-6 sm:p-9 relative">
        <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-tr" aria-hidden="true">+</span>
        <span className="daemon-crosshair-bl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-br" aria-hidden="true">+</span>

        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#0A0B0D] border border-white/[0.1] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[#00F0FF]" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#00F0FF] tracking-widest uppercase font-bold block">
                CANDIDATE PROFILE DOSSIER
              </span>
              <h1 className="font-anton text-2xl sm:text-3xl text-[#FFFFFF] uppercase tracking-wide">
                Create Candidate Account
              </h1>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded daemon-badge font-bold">
            STAGE: 01 // IDENTITY
          </span>
        </div>

        {/* Supabase Notice if unconfigured */}
        {!isConfigured && (
          <div className="mb-6 p-3.5 rounded-lg bg-[#FFB800]/10 border border-[#FFB800]/40 flex items-start gap-2.5 text-xs font-mono text-[#FFB800]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Supabase configuration required. Please add credentials to{' '}
              <code className="text-white font-bold">.env.local</code>.
            </span>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div
            role="alert"
            className={`mb-6 p-4 rounded-lg border flex items-start gap-3 text-xs font-mono animate-fadeIn ${
              isRateLimit
                ? 'bg-[#FFB800]/15 border-[#FFB800]/50 text-[#FFB800]'
                : isExistingAccount
                ? 'bg-[#00F0FF]/15 border-[#00F0FF]/50 text-[#FFFFFF]'
                : 'bg-[#FF4D6D]/10 border-[#FF4D6D]/40 text-[#FF4D6D]'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold uppercase tracking-wider block mb-1">
                {isRateLimit
                  ? 'Email Rate Limit Exceeded'
                  : isExistingAccount
                  ? 'Account Already Exists'
                  : 'Registration Notice'}
              </span>
              <span className="leading-relaxed block">{errorMsg}</span>
              {isRateLimit && (
                <div className="mt-3 pt-2.5 border-t border-[#FFB800]/30 text-[11px] text-[#FFFFFF]/85 leading-relaxed font-mono">
                  <span className="text-[#FFB800] font-bold block mb-1">RECOMMENDED FIX (30 SECONDS):</span>
                  <p className="mb-2 text-[#9EA6B0]">
                    Supabase free tier restricts the whole project to 3 emails/hour. To create accounts immediately without hitting rate limits:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 mb-3 text-[#9EA6B0]">
                    <li>Open Supabase <span className="text-[#00F0FF] font-bold">Email Provider</span> settings below.</li>
                    <li>Toggle OFF <span className="text-[#00F0FF] font-bold">"Confirm email"</span> and click <span className="text-white font-bold">Save</span>.</li>
                    <li>Return here and click <span className="text-[#00F0FF] font-bold">Register Candidate</span>.</li>
                  </ol>
                  <a
                    href="https://supabase.com/dashboard/project/dorctnnbwmbdvmklxjew/auth/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-lg bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/50 text-[#00F0FF] text-[11px] font-mono font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)]"
                  >
                    <span>Open Supabase Email Settings ↗</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
              {isExistingAccount && (
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="mt-2.5 text-xs font-mono font-bold text-[#00F0FF] hover:underline uppercase tracking-wider inline-flex items-center gap-1"
                >
                  <span>Proceed to Sign In with this email</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: CREDENTIALS & IDENTITY */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-white/[0.06]">
              <User className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#9EA6B0] font-bold">
                01 // ACCOUNT CREDENTIALS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1.5">
                  Full Name <span className="text-[#00F0FF]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-[#9EA6B0]/60" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Vance"
                    className="w-full bg-[#0A0B0D] text-[#FFFFFF] text-sm font-mono placeholder:text-[#9EA6B0]/40 pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:outline-none transition-all"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#9EA6B0]">
                    Username <span className="text-[#00F0FF]">*</span>
                  </label>
                  {/* Status Indicator */}
                  {usernameStatus === 'checking' && (
                    <span className="text-[10px] font-mono text-[#00F0FF] flex items-center gap-1">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" /> checking...
                    </span>
                  )}
                  {usernameStatus === 'available' && (
                    <span className="text-[10px] font-mono text-[#00F0FF] flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" /> available
                    </span>
                  )}
                  {usernameStatus === 'taken' && (
                    <span className="text-[10px] font-mono text-[#FF4D6D]">taken</span>
                  )}
                  {usernameStatus === 'invalid' && (
                    <span className="text-[10px] font-mono text-[#FFB800]">3-20 chars</span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-[#9EA6B0]/60 font-mono text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="alex_vance"
                    maxLength={20}
                    className={`w-full bg-[#0A0B0D] text-[#FFFFFF] text-sm font-mono placeholder:text-[#9EA6B0]/40 pl-9 pr-4 py-2.5 rounded-lg border focus:outline-none transition-all ${
                      usernameStatus === 'available'
                        ? 'border-[#00F0FF]/60 focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]'
                        : usernameStatus === 'taken'
                        ? 'border-[#FF4D6D]/60 focus:border-[#FF4D6D]'
                        : 'border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]'
                    }`}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1.5">
                Email Address <span className="text-[#00F0FF]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#9EA6B0]/60" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@gmail.com"
                  className="w-full bg-[#0A0B0D] text-[#FFFFFF] text-sm font-mono placeholder:text-[#9EA6B0]/40 pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:outline-none transition-all"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1.5">
                  Password <span className="text-[#00F0FF]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#9EA6B0]/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#0A0B0D] text-[#FFFFFF] text-sm font-mono placeholder:text-[#9EA6B0]/40 pl-10 pr-10 py-2.5 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:outline-none transition-all"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9EA6B0] hover:text-[#FFFFFF] focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1.5">
                  Confirm Password <span className="text-[#00F0FF]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#9EA6B0]/60" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`w-full bg-[#0A0B0D] text-[#FFFFFF] text-sm font-mono placeholder:text-[#9EA6B0]/40 pl-10 pr-10 py-2.5 rounded-lg border focus:outline-none transition-all ${
                      confirmPassword && !isMatch
                        ? 'border-[#FF4D6D]/60 focus:border-[#FF4D6D]'
                        : 'border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]'
                    }`}
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9EA6B0] hover:text-[#FFFFFF] focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Live Password Requirements Checklist */}
            <div className="p-3 rounded-lg bg-[#0A0B0D] border border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
              <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-[#00F0FF]' : 'text-[#606873]'}`}>
                <Check className={`w-3.5 h-3.5 ${hasMinLength ? 'text-[#00F0FF]' : 'opacity-30'}`} />
                <span>8+ chars</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasLetter ? 'text-[#00F0FF]' : 'text-[#606873]'}`}>
                <Check className={`w-3.5 h-3.5 ${hasLetter ? 'text-[#00F0FF]' : 'opacity-30'}`} />
                <span>One letter</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-[#00F0FF]' : 'text-[#606873]'}`}>
                <Check className={`w-3.5 h-3.5 ${hasNumber ? 'text-[#00F0FF]' : 'opacity-30'}`} />
                <span>One number</span>
              </div>
              <div className={`flex items-center gap-1.5 ${isMatch ? 'text-[#00F0FF]' : 'text-[#606873]'}`}>
                <Check className={`w-3.5 h-3.5 ${isMatch ? 'text-[#00F0FF]' : 'opacity-30'}`} />
                <span>Match</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: ACADEMIC PROFILE */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-1 border-b border-white/[0.06]">
              <BookOpen className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#9EA6B0] font-bold">
                02 // ACADEMIC PROFILE (REQUIRED)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Age */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1.5">
                  Age <span className="text-[#00F0FF]">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-3.5 text-[#9EA6B0]/60" />
                  <input
                    type="number"
                    min={13}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="21"
                    className="w-full bg-[#0A0B0D] text-[#FFFFFF] text-sm font-mono placeholder:text-[#9EA6B0]/40 pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:outline-none transition-all"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              {/* Education Level */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1.5">
                  Education Level <span className="text-[#00F0FF]">*</span>
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full bg-[#0A0B0D] text-[#FFFFFF] text-sm font-mono px-3 py-2.5 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:outline-none transition-all cursor-pointer"
                  disabled={isSubmitting}
                >
                  {educationOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#14181B] text-white">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Study Year / Graduation */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1.5">
                  Study Year <span className="text-[#00F0FF]">*</span>
                </label>
                <select
                  value={studyYear}
                  onChange={(e) => setStudyYear(e.target.value)}
                  className="w-full bg-[#0A0B0D] text-[#FFFFFF] text-sm font-mono px-3 py-2.5 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:outline-none transition-all cursor-pointer"
                  disabled={isSubmitting}
                >
                  {studyYearOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#14181B] text-white">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Course / Degree */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1.5">
                Course or Degree <span className="text-[#00F0FF]">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 absolute left-3.5 top-3.5 text-[#9EA6B0]/60" />
                <input
                  type="text"
                  value={courseDegree}
                  onChange={(e) => setCourseDegree(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science / BCA / MBA"
                  className="w-full bg-[#0A0B0D] text-[#FFFFFF] text-sm font-mono placeholder:text-[#9EA6B0]/40 pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:outline-none transition-all"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: CAREER OBJECTIVES (OPTIONAL) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-1 border-b border-white/[0.06]">
              <Briefcase className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#9EA6B0] font-bold">
                03 // CAREER OBJECTIVES (OPTIONAL)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* College / Institution */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1.5">
                  College / Institution
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3.5 top-3.5 text-[#9EA6B0]/60" />
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. IIT Delhi / State University"
                    className="w-full bg-[#0A0B0D] text-[#FFFFFF] text-sm font-mono placeholder:text-[#9EA6B0]/40 pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:outline-none transition-all"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Target Job Role */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1.5">
                  Target Job Role
                </label>
                <div className="relative">
                  <Sparkles className="w-4 h-4 absolute left-3.5 top-3.5 text-[#9EA6B0]/60" />
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. SDE-1 / Full Stack Engineer"
                    className="w-full bg-[#0A0B0D] text-[#FFFFFF] text-sm font-mono placeholder:text-[#9EA6B0]/40 pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:outline-none transition-all"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Experience Level Selector */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1.5">
                Experience Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {experienceOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setExperienceLevel(opt.id)}
                    className={`text-xs font-mono py-2 px-2.5 rounded-lg border transition-all text-center min-h-[38px] ${
                      experienceLevel === opt.id
                        ? 'bg-[#00F0FF] text-[#0A0B0D] border-[#00F0FF] font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                        : 'bg-[#0A0B0D] border-white/[0.08] text-[#9EA6B0] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills / Key Interests */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1.5">
                Skills & Technical Focus Areas
              </label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. React, TypeScript, Python, System Design, Algorithms"
                className="w-full bg-[#0A0B0D] text-[#FFFFFF] text-sm font-mono placeholder:text-[#9EA6B0]/40 px-3.5 py-2.5 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:outline-none transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* SECTION 4: PROTOCOL CONSENT & SUBMIT */}
          <div className="pt-2 space-y-4">
            <div className="flex items-start">
              <input
                id="agree-terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded bg-[#0A0B0D] border-white/[0.2] text-[#00F0FF] focus:ring-[#00F0FF] focus:ring-offset-[#0A0B0D]"
                required
              />
              <label
                htmlFor="agree-terms"
                className="ml-2.5 text-xs font-mono text-[#9EA6B0] select-none cursor-pointer"
              >
                I accept the EchoTutor Telemetry Terms and Privacy Protocol. I consent to real-time audio and textual reasoning evaluation.
              </label>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[50px] px-6 py-3.5 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] active:scale-[0.99] text-[#0A0B0D] font-anton text-lg tracking-wider uppercase inline-flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,240,255,0.35)] focus:outline-none focus:ring-2 focus:ring-[#00F0FF] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>INITIALIZING CANDIDATE DOSSIER...</span>
                </>
              ) : (
                <>
                  <span>[ ⨂ CREATE CANDIDATE PROFILE ⨂ ]</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Navigation: Link to Login */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] text-center">
          <p className="text-xs font-mono text-[#9EA6B0]">
            Already registered candidate?{' '}
            <button
              type="button"
              onClick={onNavigateLogin}
              className="text-[#00F0FF] hover:underline font-bold uppercase tracking-wider ml-1 focus:outline-none"
            >
              Sign In →
            </button>
          </p>
        </div>

        {/* Security Stamp */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#606873]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00F0FF]/60" />
          <span>ZERO-PASSWORD-PLAINTEXT STORAGE • ENCRYPTED TELEMETRY</span>
        </div>
      </div>
    </div>
  );
};
