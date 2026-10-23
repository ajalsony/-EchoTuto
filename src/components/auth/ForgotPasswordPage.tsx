import React, { useState } from 'react';
import { Mail, ArrowRight, AlertCircle, Loader2, ArrowLeft, CheckCircle2, Box } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ForgotPasswordPageProps {
  onNavigateLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onNavigateLogin,
}) => {
  const { resetPassword, isConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent concurrent password reset submissions
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    const { error } = await resetPassword(email);

    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-12 relative daemon-grid-bg">
      {/* Ambient Illumination */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-[#00F0FF]/10 via-[#00F0FF]/[0.02] to-transparent blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Bar with Back to Login */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateLogin}
          className="text-xs font-mono text-[#00F0FF] hover:underline inline-flex items-center gap-1.5 uppercase tracking-wider focus:outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>[ Back to Login ]</span>
        </button>

        <span className="text-[11px] font-mono text-[#9EA6B0]">
          SECURITY: <span className="text-[#00F0FF] font-bold">256-BIT TLS</span>
        </span>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md daemon-card rounded-xl p-7 sm:p-8 relative">
        <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-tr" aria-hidden="true">+</span>
        <span className="daemon-crosshair-bl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-br" aria-hidden="true">+</span>

        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#0A0B0D] border border-white/[0.1] flex items-center justify-center">
              <Box className="w-4 h-4 text-[#00F0FF]" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#00F0FF] tracking-widest uppercase font-bold block">
                CREDENTIAL RECOVERY
              </span>
              <h1 className="font-anton text-2xl text-[#FFFFFF] uppercase tracking-wide">
                Reset Password
              </h1>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded daemon-badge font-bold">
            AUTH // 03
          </span>
        </div>

        {/* Missing Config Banner */}
        {!isConfigured && (
          <div className="mb-5 p-3.5 rounded-lg bg-[#FF7A00]/10 border border-[#FF7A00]/30 text-xs font-mono text-[#FF7A00] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider block">Supabase Setup Required</span>
              <span className="text-[#9EA6B0] text-[11px] font-inria block mt-0.5 leading-relaxed">
                Add your project URL and publishable anon key to <code className="text-[#FFFFFF]">.env.local</code> to activate live password reset.
              </span>
            </div>
          </div>
        )}

        {/* Success Confirmation State */}
        {success ? (
          <div className="space-y-4 py-2 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] flex items-center justify-center mx-auto shadow-[0_0_16px_rgba(0,240,255,0.25)]">
              <CheckCircle2 className="w-6 h-6 text-[#00F0FF]" />
            </div>
            <div>
              <h2 className="font-anton text-xl text-[#FFFFFF] uppercase tracking-wide">
                Recovery Link Dispatched
              </h2>
              <p className="text-xs sm:text-sm text-[#9EA6B0] mt-2 font-inria leading-relaxed">
                We have transmitted password reset instructions to <span className="text-[#FFFFFF] font-mono font-bold">{email}</span>. Please check your inbox and spam folder.
              </p>
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={onNavigateLogin}
                className="w-full min-h-[48px] px-6 py-3 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] text-[#0A0B0D] font-anton text-base tracking-wider uppercase inline-flex items-center justify-center gap-2 transition-all shadow-[0_0_16px_rgba(0,240,255,0.3)]"
              >
                <span>Return to Login</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <p className="text-xs text-[#9EA6B0] font-inria leading-relaxed mb-4">
              Enter your registered email address and our authentication engine will dispatch a cryptographically signed password reset link.
            </p>

            {/* Error Banner */}
            {errorMsg && (
              <div
                role="alert"
                className={`p-3.5 rounded-lg border text-xs font-mono flex items-start gap-2.5 ${
                  errorMsg.includes('verification emails') || errorMsg.includes('rate limit')
                    ? 'bg-[#FFB800]/15 border-[#FFB800]/50 text-[#FFB800]'
                    : 'bg-[#FF4D6D]/15 border-[#FF4D6D]/40 text-[#FF4D6D] shadow-[0_0_14px_rgba(255,77,109,0.15)]'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="forgot-email"
                className="block text-xs font-mono text-[#9EA6B0] mb-1.5 uppercase tracking-wider font-medium"
              >
                Registered Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9EA6B0]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@studio.internal"
                  className="w-full bg-[#0A0B0D] text-[#FFFFFF] text-sm font-mono placeholder:text-[#9EA6B0]/40 pl-10 pr-4 py-3 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:outline-none transition-all"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[50px] px-6 py-3.5 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] active:scale-[0.99] text-[#0A0B0D] font-anton text-lg tracking-wider uppercase inline-flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,240,255,0.35)] focus:outline-none focus:ring-2 focus:ring-[#00F0FF] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>DISPATCHING RECOVERY LINK...</span>
                  </>
                ) : (
                  <>
                    <span>[ ⨂ SEND RESET LINK ⨂ ]</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] text-center">
          <p className="text-xs font-mono text-[#9EA6B0]">
            Remembered your credentials?{' '}
            <button
              type="button"
              onClick={onNavigateLogin}
              className="text-[#00F0FF] hover:underline font-bold uppercase tracking-wider ml-1 focus:outline-none"
            >
              Sign In →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
