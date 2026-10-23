import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, ArrowRight, ArrowLeft, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isEmailRateLimitError } from '../../lib/authErrors';

interface EmailVerificationPageProps {
  email: string;
  onNavigateLogin: () => void;
}

export const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({
  email,
  onNavigateLogin,
}) => {
  const { resendVerificationEmail } = useAuth();

  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    // Disable repeated resend attempts while a request is pending or cooldown active
    if (cooldown > 0 || isSending) return;

    setIsSending(true);
    setMessage(null);

    const { error } = await resendVerificationEmail(email);

    setIsSending(false);

    if (error) {
      const isRateLimit = isEmailRateLimitError(error);
      setMessage({ text: error.message, isError: true });
      if (isRateLimit) {
        // Enforce a 120s cooldown when rate limited to prevent repeated rejections
        setCooldown(120);
      }
    } else {
      setMessage({ text: 'A fresh verification dispatch has been sent to your inbox.', isError: false });
      setCooldown(60); // 60s standard cooldown
    }
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
          STATUS: <span className="text-[#00F0FF] font-bold">VERIFICATION PENDING</span>
        </span>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md daemon-card rounded-xl p-7 sm:p-8 relative text-center">
        <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-tr" aria-hidden="true">+</span>
        <span className="daemon-crosshair-bl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-br" aria-hidden="true">+</span>

        {/* Pulsing Envelope Icon */}
        <div className="w-14 h-14 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(0,240,255,0.25)]">
          <Mail className="w-7 h-7 text-[#00F0FF] animate-pulse" />
        </div>

        {/* Title */}
        <div className="mb-4">
          <span className="text-[10px] font-mono text-[#00F0FF] tracking-widest uppercase font-bold block mb-1">
            SECURITY DISPATCH
          </span>
          <h1 className="font-anton text-2xl sm:text-3xl text-[#FFFFFF] uppercase tracking-wide">
            Verify Your Email
          </h1>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-[#9EA6B0] font-inria leading-relaxed mb-6">
          We have transmitted an activation link to{' '}
          <span className="text-[#FFFFFF] font-mono font-bold block mt-1 break-all bg-[#0A0B0D] py-1.5 px-3 rounded border border-white/[0.08]">
            {email || 'your registered email'}
          </span>
          Please click the confirmation link in the email to activate your account.
        </p>

        {/* Feedback Banner */}
        {message && (
          <div
            role="alert"
            className={`mb-5 p-3.5 rounded-lg text-xs font-mono flex items-start gap-2.5 text-left ${
              message.isError
                ? message.text.includes('verification emails')
                  ? 'bg-[#FFB800]/15 border border-[#FFB800]/50 text-[#FFB800]'
                  : 'bg-[#FF4D6D]/15 border border-[#FF4D6D]/40 text-[#FF4D6D]'
                : 'bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF]'
            }`}
          >
            {message.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className="leading-relaxed block">{message.text}</span>
              {message.isError && message.text.includes('verification emails') && (
                <div className="mt-2.5 pt-2 border-t border-[#FFB800]/30 text-[11px] text-[#FFFFFF]/85 leading-relaxed font-mono">
                  <span className="text-[#FFB800] font-bold block mb-0.5">RECOMMENDED FIX:</span>
                  In Supabase Dashboard ➔ <span className="text-[#00F0FF] font-bold">Authentication</span> ➔ <span className="text-[#00F0FF] font-bold">Providers</span> ➔ <span className="text-[#00F0FF] font-bold">Email</span>, disable <span className="text-[#00F0FF] font-bold">"Confirm email"</span> to bypass rate limits during development.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isSending}
            className="w-full min-h-[46px] px-6 py-2.5 rounded-lg daemon-chip hover:border-[#00F0FF]/50 text-xs font-mono uppercase tracking-wider text-[#FFFFFF] inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#00F0FF] ${isSending ? 'animate-spin' : ''}`} />
            <span>
              {cooldown > 0
                ? `Resend available in ${cooldown}s`
                : isSending
                ? 'Dispatching email...'
                : 'Resend Verification Email'}
            </span>
          </button>

          <button
            type="button"
            onClick={onNavigateLogin}
            className="w-full min-h-[48px] px-6 py-3 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] text-[#0A0B0D] font-anton text-base tracking-wider uppercase inline-flex items-center justify-center gap-2 transition-all shadow-[0_0_16px_rgba(0,240,255,0.3)]"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#606873]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00F0FF]/60" />
          <span>CRYPTOGRAPHIC VERIFICATION TOKEN EXPIRES IN 24H</span>
        </div>
      </div>
    </div>
  );
};
