import React from 'react';
import type { EchoRingsState } from '../types';

interface EchoRingsProps {
  state?: EchoRingsState;
  audioLevel?: number; // 0 to 1 for dynamic reactive scaling
  size?: 'sm' | 'md' | 'lg' | 'responsive';
  className?: string;
  showStatusLabel?: boolean;
  customLabel?: string;
  customText?: string;
  customSubtext?: string;
}

export const EchoRings: React.FC<EchoRingsProps> = ({
  state = 'idle',
  audioLevel = 0,
  size = 'responsive',
  className = '',
  showStatusLabel = true,
  customLabel,
  customText,
  customSubtext,
}) => {
  // Status label text and colors
  const statusMeta: Record<
    EchoRingsState,
    { label: string; text: string; dotColor: string; strokeColor: string; subtext: string }
  > = {
    idle: {
      label: 'STANDBY',
      text: 'Echo Chamber Calibrated',
      dotColor: '#B8FF62',
      strokeColor: '#B8FF62',
      subtext: 'Awaiting practice session',
    },
    speaking: {
      label: 'AI SPEECH',
      text: 'Interviewer Speaking',
      dotColor: '#B8FF62',
      strokeColor: '#B8FF62',
      subtext: 'Acoustic guidance transmitted',
    },
    recording: {
      label: 'INPUT ACTIVE',
      text: 'Voice Capture Live',
      dotColor: '#B8FF62',
      strokeColor: '#B8FF62',
      subtext: 'Measuring verbal clarity and flow',
    },
    processing: {
      label: 'SYNTHESIS',
      text: 'Evaluating Response',
      dotColor: '#B8FF62',
      strokeColor: '#B8FF62',
      subtext: 'Formulating follow-up challenge',
    },
    error: {
      label: 'ATTENTION',
      text: 'Audio Pipeline Halted',
      dotColor: '#FF8277',
      strokeColor: '#FF8277',
      subtext: 'Check microphone permissions',
    },
  };

  const defaultMeta = statusMeta[state];
  const current = {
    label: customLabel ?? defaultMeta.label,
    text: customText ?? defaultMeta.text,
    dotColor: defaultMeta.dotColor,
    strokeColor: defaultMeta.strokeColor,
    subtext: customSubtext ?? defaultMeta.subtext,
  };

  // Dynamic dimension scaling
  const sizeClasses = {
    sm: 'w-36 h-36',
    md: 'w-56 h-56',
    lg: 'w-72 h-72 sm:w-80 sm:h-80',
    responsive: 'w-56 h-56 xs:w-64 xs:h-64 sm:w-72 sm:h-72 md:w-80 md:h-80',
  };

  // Recording reactive boost based on audioLevel
  const dynamicScale = state === 'recording' ? 1 + audioLevel * 0.15 : 1;

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* SVG Echo Chamber Concentric Rings */}
      <div
        className={`relative ${sizeClasses[size]} flex items-center justify-center select-none`}
        style={{ transform: `scale(${dynamicScale})`, transition: 'transform 120ms ease-out' }}
      >
        <svg
          viewBox="0 0 260 260"
          className="w-full h-full overflow-visible"
          role="img"
          aria-label={`Echo Chamber acoustic visualization in ${state} mode`}
        >
          <defs>
            {/* Subtle glow filter strictly for lime core, non-excessive */}
            <radialGradient id="echo-core-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={current.strokeColor} stopOpacity="0.9" />
              <stop offset="60%" stopColor={current.strokeColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={current.strokeColor} stopOpacity="0" />
            </radialGradient>

            <linearGradient id="echo-fade-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={current.strokeColor} stopOpacity="0.6" />
              <stop offset="100%" stopColor={current.strokeColor} stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Central Radial Atmosphere */}
          <circle
            cx="130"
            cy="130"
            r="40"
            fill="url(#echo-core-gradient)"
            className={state === 'speaking' ? 'anim-speak-1' : state === 'error' ? 'opacity-40' : 'opacity-25'}
          />

          {/* Outer Ring 5 - Extended perimeter */}
          <circle
            cx="130"
            cy="130"
            r="115"
            fill="none"
            stroke={current.strokeColor}
            strokeWidth="1"
            strokeOpacity={state === 'error' ? '0.3' : '0.12'}
            strokeDasharray={state === 'processing' ? '4 8' : undefined}
            className={`echo-ring ${
              state === 'idle'
                ? 'anim-breathe-4'
                : state === 'speaking'
                ? 'anim-speak-4'
                : state === 'recording'
                ? 'anim-record-3'
                : state === 'processing'
                ? 'anim-spin-cw'
                : 'anim-error'
            }`}
          />

          {/* Outer Ring 4 */}
          <circle
            cx="130"
            cy="130"
            r="92"
            fill="none"
            stroke={current.strokeColor}
            strokeWidth="1.25"
            strokeOpacity={state === 'error' ? '0.45' : '0.22'}
            strokeDasharray={state === 'processing' ? '8 6' : undefined}
            className={`echo-ring ${
              state === 'idle'
                ? 'anim-breathe-3'
                : state === 'speaking'
                ? 'anim-speak-3'
                : state === 'recording'
                ? 'anim-record-2'
                : state === 'processing'
                ? 'anim-spin-ccw'
                : 'anim-error'
            }`}
          />

          {/* Mid Ring 3 */}
          <circle
            cx="130"
            cy="130"
            r="68"
            fill="none"
            stroke={current.strokeColor}
            strokeWidth={state === 'recording' ? '1.75' : '1.25'}
            strokeOpacity={state === 'error' ? '0.6' : '0.4'}
            strokeDasharray={state === 'processing' ? '2 6' : undefined}
            className={`echo-ring ${
              state === 'idle'
                ? 'anim-breathe-2'
                : state === 'speaking'
                ? 'anim-speak-2'
                : state === 'recording'
                ? 'anim-record-1'
                : state === 'processing'
                ? 'anim-spin-cw'
                : 'anim-error'
            }`}
          />

          {/* Inner Ring 2 */}
          <circle
            cx="130"
            cy="130"
            r="44"
            fill="none"
            stroke={current.strokeColor}
            strokeWidth={state === 'recording' ? '2' : '1.5'}
            strokeOpacity={state === 'error' ? '0.85' : '0.65'}
            className={`echo-ring ${
              state === 'idle'
                ? 'anim-breathe-1'
                : state === 'speaking'
                ? 'anim-speak-1'
                : state === 'recording'
                ? 'anim-record-2'
                : state === 'processing'
                ? 'anim-spin-ccw'
                : 'anim-error'
            }`}
          />

          {/* Focus Ring 1 */}
          <circle
            cx="130"
            cy="130"
            r="24"
            fill="none"
            stroke={current.strokeColor}
            strokeWidth="1.75"
            strokeOpacity={state === 'error' ? '0.9' : '0.8'}
            className={`echo-ring ${state === 'error' ? 'anim-error' : 'anim-core'}`}
          />

          {/* Central Emitter Core */}
          <circle
            cx="130"
            cy="130"
            r={state === 'recording' ? '7' : '5'}
            fill={current.dotColor}
            className="echo-ring transition-all duration-300"
          />

          {/* Subtly offset decorative reticle marks for experimental editorial look */}
          <line
            x1="130"
            y1="5"
            x2="130"
            y2="15"
            stroke={current.strokeColor}
            strokeOpacity="0.4"
            strokeWidth="1"
          />
          <line
            x1="130"
            y1="245"
            x2="130"
            y2="255"
            stroke={current.strokeColor}
            strokeOpacity="0.4"
            strokeWidth="1"
          />
          <line
            x1="5"
            y1="130"
            x2="15"
            y2="130"
            stroke={current.strokeColor}
            strokeOpacity="0.4"
            strokeWidth="1"
          />
          <line
            x1="245"
            y1="130"
            x2="255"
            y2="130"
            stroke={current.strokeColor}
            strokeOpacity="0.4"
            strokeWidth="1"
          />
        </svg>

        {/* Outer subtle state coordinate ring */}
        <div className="absolute inset-0 pointer-events-none rounded-full border border-[#28302B]/40" />
      </div>

      {/* Accessible Session & State Status Tag */}
      {showStatusLabel && (
        <div className="mt-4 flex flex-col items-center gap-1">
          <div
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase border ${
              state === 'error'
                ? 'bg-[#FF8277]/10 text-[#FF8277] border-[#FF8277]/30'
                : 'bg-[#1B201D] text-[#B8FF62] border-[#28302B]'
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: current.dotColor }}
            />
            <span>{current.label}</span>
            <span className="text-[#929991]">/</span>
            <span className="text-[#E8EAE5]">{current.text}</span>
          </div>
          <span className="text-[11px] font-mono text-[#929991] tracking-tight">
            {current.subtext}
          </span>
        </div>
      )}
    </div>
  );
};
