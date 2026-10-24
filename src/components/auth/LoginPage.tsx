import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, ArrowRight, ArrowLeft, AlertCircle, Loader2, ShieldCheck, Box } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginPageProps {
  initialEmail?: string;
  onNavigateRegister: () => void;
  onNavigateForgotPassword: () => void;
  onNavigateLanding?: () => void;
  onSuccess: () => void;
  onNavigateVerifyEmail?: (email?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  initialEmail = '',
  onNavigateRegister,
  onNavigateForgotPassword,
  onNavigateLanding,
  onSuccess,
  onNavigateVerifyEmail,
}) => {
  const { signIn, isConfigured } = useAuth();

  const [identifier, setIdentifier] = useState(() => {
    return initialEmail || (() => {
      try {
        return localStorage.getItem('echotutor_remembered_email') || '';
      } catch {
        return '';
      }
    })();
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return localStorage.getItem('echotutor_remember_me') !== 'false';
    } catch {
      return true;
    }
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initialEmail when prop updates (e.g. redirected from registration)
  useEffect(() => {
    if (initialEmail) {
      setIdentifier(initialEmail);
    }
  }, [initialEmail]);

  const validate = (): string | null => {
    const trimmed = identifier.trim();
    if (!trimmed) return 'Email address is required.';

    if (!trimmed.includes('@')) {
      return 'EchoTutor uses secure email authentication to protect candidate privacy. Please sign in with your registered email address (e.g. candidate@example.com).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return 'Please enter a valid email address.';
    }

    if (!password) return 'Password is required.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate sign-in attempts while pending
    setErrorMsg(null);

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsSubmitting(true);

    const { error } = await signIn(identifier, password);

    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // Persist or remove remembered email for seamless browser login
    try {
      if (rememberMe) {
        localStorage.setItem('echotutor_remembered_email', identifier.trim());
        localStorage.setItem('echotutor_remember_me', 'true');
      } else {
        localStorage.removeItem('echotutor_remembered_email');
        localStorage.setItem('echotutor_remember_me', 'false');
      }
    } catch {
      // LocalStorage access fallback
    }

    // Success
    onSuccess();
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-12 relative daemon-grid-bg">
      {/* Ambient Radial Illumination */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-[#00F0FF]/10 via-[#00F0FF]/[0.02] to-transparent blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Status Header */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        {onNavigateLanding ? (
          <button
            type="button"
            id="login-return-landing-top-btn"
            onClick={onNavigateLanding}
            className="text-xs font-mono text-[#9EA6B0] hover:text-[#00F0FF] transition-colors inline-flex items-center gap-1.5 uppercase tracking-wider py-1 focus:outline-none focus:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Return to Landing Page</span>
          </button>
        ) : (
          <span className="text-xs font-mono text-[#9EA6B0] tracking-wider uppercase">
            ONBOARDING // <span className="text-[#00F0FF] font-bold">CANDIDATE SIGN IN</span>
          </span>
        )}

        <span className="text-[11px] font-mono text-[#9EA6B0]">
          SECURITY: <span className="text-[#00F0FF] font-bold">256-BIT TLS</span>
        </span>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md daemon-card rounded-xl p-7 sm:p-8 relative">
        <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-tr" aria-hidden="true">+</span>
        <span className="daemon-crosshair-bl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-br" aria-hidden="true">+</span>

        {/* Card Header with Industrial Wordmark & Title */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#0A0B0D] border border-white/[0.1] flex items-center justify-center">
              <Box className="w-4 h-4 text-[#00F0FF]" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#00F0FF] tracking-widest uppercase font-bold block">
                AUTHENTICATION PORTAL
              </span>
              <h1 className="font-anton text-2xl text-[#FFFFFF] uppercase tracking-wide">
                Sign In to Studio
              </h1>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded daemon-badge font-bold">
            GATE // 01
          </span>
        </div>

        {/* Supabase Notice if unconfigured */}
        {!isConfigured && (
          <div className="mb-5 p-3 rounded-lg bg-[#FFB800]/10 border border-[#FFB800]/40 flex items-start gap-2 text-xs font-mono text-[#FFB800]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Supabase configuration required. Please add credentials to{' '}
              <code className="text-white font-bold">.env.local</code>.
            </span>
          </div>
        )}

        {/* Error Notification Banner */}
        {errorMsg && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-lg bg-[#FF4D6D]/10 border border-[#FF4D6D]/40 flex items-start gap-2.5 text-xs font-mono text-[#FF4D6D] animate-fadeIn"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold uppercase tracking-wider block mb-0.5">Authentication Error</span>
              <span className="block leading-relaxed">{errorMsg}</span>
              {errorMsg.toLowerCase().includes('not confirmed') && (
                <div className="mt-2.5 pt-2 border-t border-[#FF4D6D]/30 text-[11px] text-[#FFFFFF]/85">
                  <span className="block text-[#9EA6B0] mb-1">Your email address requires confirmation:</span>
                  <button
                    type="button"
                    onClick={() => onNavigateVerifyEmail?.(identifier.includes('@') ? identifier.trim() : undefined)}
                    className="text-[#00F0FF] hover:underline font-bold uppercase tracking-wider inline-flex items-center gap-1"
                  >
                    <span>Go to Verification Screen</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <form id="candidate-login-form" name="candidate-login-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Email Address Input */}
          <div>
            <label htmlFor="login-email" className="block text-xs font-mono uppercase tracking-wider text-[#9EA6B0] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-[#9EA6B0]/60" />
              <input
                type="email"
                id="login-email"
                name="email"
                autoComplete="username email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="candidate@gmail.com"
                className="w-full bg-[#0A0B0D] text-[#FFFFFF] text-sm font-mono placeholder:text-[#9EA6B0]/40 pl-10 pr-4 py-3 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:outline-none transition-all"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="text-xs font-mono uppercase tracking-wider text-[#9EA6B0]">
                Password
              </label>
              <button
                type="button"
                onClick={onNavigateForgotPassword}
                className="text-xs font-mono text-[#00F0FF] hover:underline focus:outline-none"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#9EA6B0]/60" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0A0B0D] text-[#FFFFFF] text-sm font-mono placeholder:text-[#9EA6B0]/40 pl-10 pr-11 py-3 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:outline-none transition-all"
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9EA6B0] hover:text-[#FFFFFF] focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Option */}
          <div className="flex items-center pt-1">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded bg-[#0A0B0D] border-white/[0.2] text-[#00F0FF] focus:ring-[#00F0FF] focus:ring-offset-[#0A0B0D]"
            />
            <label
              htmlFor="remember-me"
              className="ml-2.5 text-xs font-mono text-[#9EA6B0] select-none cursor-pointer uppercase tracking-wider"
            >
              Remember this device
            </label>
          </div>

          {/* Primary Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[50px] px-6 py-3.5 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] active:scale-[0.99] text-[#0A0B0D] font-anton text-lg tracking-wider uppercase inline-flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,240,255,0.35)] focus:outline-none focus:ring-2 focus:ring-[#00F0FF] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <span>[ ⨂ SIGN IN TO STUDIO ⨂ ]</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Navigation: Link to Registration & Landing */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] text-center space-y-3">
          <p className="text-xs font-mono text-[#9EA6B0]">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onNavigateRegister}
              className="text-[#00F0FF] hover:underline font-bold uppercase tracking-wider ml-1 focus:outline-none"
            >
              Create an account →
            </button>
          </p>

          {onNavigateLanding && (
            <div className="pt-2">
              <button
                type="button"
                id="login-return-landing-bottom-btn"
                onClick={onNavigateLanding}
                className="text-xs font-mono text-[#9EA6B0] hover:text-[#00F0FF] transition-colors inline-flex items-center gap-1.5 uppercase tracking-wider py-1 focus:outline-none focus:underline"
              >
                <ArrowLeft className="w-3 h-3 text-[#00F0FF]" />
                <span>← Back to Public Landing Page</span>
              </button>
            </div>
          )}
        </div>

        {/* Security Stamp */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#606873]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00F0FF]/60" />
          <span>ZERO-PASSWORD-PLAINTEXT STORAGE • RLS PROTECTED</span>
        </div>
      </div>
    </div>
  );
};
