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
  const statusMeta: Record<
    EchoRingsState,
    { label: string; text: string; dotColor: string; strokeColor: string; subtext: string }
  > = {
    idle: {
      label: 'STANDBY',
      text: 'Acoustic Studio Calibrated',
      dotColor: '#B8FF62',
      strokeColor: '#B8FF62',
      subtext: 'Awaiting candidate vocal transmission',
    },
    speaking: {
      label: 'AI TRANSMITTING',
      text: 'Interviewer Voice Active',
      dotColor: '#B8FF62',
      strokeColor: '#B8FF62',
      subtext: 'Synthesizing adaptive inquiry',
    },
    recording: {
      label: 'VOCAL CAPTURE',
      text: 'Live Acoustic Stream',
      dotColor: '#B8FF62',
      strokeColor: '#B8FF62',
      subtext: 'Analyzing verbal clarity and structural cadence',
    },
    processing: {
      label: 'SYNTHESIZING',
      text: 'Evaluating Response Vector',
      dotColor: '#B8FF62',
      strokeColor: '#B8FF62',
      subtext: 'Calibrating follow-up question depth',
    },
    error: {
      label: 'PIPELINE ERROR',
      text: 'Acoustic Link Interrupted',
      dotColor: '#FF8277',
      strokeColor: '#FF8277',
      subtext: 'Check microphone permissions or switch to Typed Mode',
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

  // Dimensions
  const sizeClasses = {
    sm: 'w-32 h-32 sm:w-36 sm:h-36',
    md: 'w-52 h-52 sm:w-56 sm:h-56',
    lg: 'w-72 h-72 sm:w-80 sm:h-80',
    responsive: 'w-56 h-56 xs:w-64 xs:h-64 sm:w-72 sm:h-72 md:w-80 md:h-80',
  };

  const dynamicScale = state === 'recording' ? 1 + audioLevel * 0.16 : 1;

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Visualizer Frame with Liquid-Chrome Glow & Concentric Vector Geometry */}
      <div
        className={`relative ${sizeClasses[size]} flex items-center justify-center select-none`}
        style={{ transform: `scale(${dynamicScale})`, transition: 'transform 100ms ease-out' }}
      >
        <svg
          viewBox="0 0 280 280"
          className="w-full h-full overflow-visible"
          role="img"
          aria-label={`Echo Chamber acoustic studio visualizer in ${state} mode`}
        >
          <defs>
            {/* Liquid-Chrome Metallic Gradient */}
            <linearGradient id="chrome-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="25%" stopColor="#8F9AA8" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="75%" stopColor="#4A5462" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#DDE6EF" stopOpacity="0.7" />
            </linearGradient>

            {/* Core Acoustic Glow */}
            <radialGradient id="studio-core-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={current.strokeColor} stopOpacity="0.85" />
              <stop offset="40%" stopColor={current.strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={current.strokeColor} stopOpacity="0" />
            </radialGradient>

            {/* Chrome Concentric Ring Filter */}
            <linearGradient id="ring-silver-edge" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <stop offset="50%" stopColor={current.strokeColor} stopOpacity="0.7" />
              <stop offset="100%" stopColor="#252D28" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Central Radial Atmosphere */}
          <circle
            cx="140"
            cy="140"
            r="48"
            fill="url(#studio-core-glow)"
            className={state === 'speaking' ? 'anim-speak-1' : state === 'error' ? 'opacity-40' : 'opacity-25'}
          />

          {/* Precision Studio Azimuth Tick Reticle (Outer rim) */}
          <circle
            cx="140"
            cy="140"
            r="134"
            fill="none"
            stroke="url(#chrome-sheen)"
            strokeWidth="0.75"
            strokeOpacity="0.2"
            strokeDasharray="1 6"
          />

          {/* Ring 5: Outermost acoustic expansion ring */}
          <circle
            cx="140"
            cy="140"
            r="124"
            fill="none"
            stroke={state === 'error' ? current.strokeColor : 'url(#ring-silver-edge)'}
            strokeWidth="1"
            strokeOpacity={state === 'error' ? '0.4' : '0.18'}
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

          {/* Ring 4: Harmonic perimeter */}
          <circle
            cx="140"
            cy="140"
            r="100"
            fill="none"
            stroke={current.strokeColor}
            strokeWidth="1.25"
            strokeOpacity={state === 'error' ? '0.5' : '0.28'}
            strokeDasharray={state === 'processing' ? '6 6' : undefined}
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

          {/* Ring 3: Mid fluid waveguide */}
          <circle
            cx="140"
            cy="140"
            r="76"
            fill="none"
            stroke={state === 'error' ? current.strokeColor : 'url(#chrome-sheen)'}
            strokeWidth={state === 'recording' ? '2' : '1.25'}
            strokeOpacity={state === 'error' ? '0.7' : '0.5'}
            strokeDasharray={state === 'processing' ? '3 6' : undefined}
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

          {/* Ring 2: Acoustic focus boundary */}
          <circle
            cx="140"
            cy="140"
            r="50"
            fill="none"
            stroke={current.strokeColor}
            strokeWidth={state === 'recording' ? '2.2' : '1.5'}
            strokeOpacity={state === 'error' ? '0.85' : '0.7'}
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

          {/* Ring 1: Metallic inner lens collar */}
          <circle
            cx="140"
            cy="140"
            r="28"
            fill="none"
            stroke="url(#chrome-sheen)"
            strokeWidth="1.75"
            strokeOpacity="0.85"
            className={`echo-ring ${state === 'error' ? 'anim-error' : 'anim-core'}`}
          />

          {/* Central Emitter Core */}
          <circle
            cx="140"
            cy="140"
            r={state === 'recording' ? '8' : '6'}
            fill={current.dotColor}
            className="echo-ring transition-all duration-200"
          />

          {/* Precision Studio Reticle Crosshairs */}
          <line
            x1="140"
            y1="4"
            x2="140"
            y2="16"
            stroke="url(#chrome-sheen)"
            strokeOpacity="0.5"
            strokeWidth="1"
          />
          <line
            x1="140"
            y1="264"
            x2="140"
            y2="276"
            stroke="url(#chrome-sheen)"
            strokeOpacity="0.5"
            strokeWidth="1"
          />
          <line
            x1="4"
            y1="140"
            x2="16"
            y2="140"
            stroke="url(#chrome-sheen)"
            strokeOpacity="0.5"
            strokeWidth="1"
          />
          <line
            x1="264"
            y1="140"
            x2="276"
            y2="140"
            stroke="url(#chrome-sheen)"
            strokeOpacity="0.5"
            strokeWidth="1"
          />
        </svg>

        {/* Ambient Silver Ring Border */}
        <div className="absolute inset-0 pointer-events-none rounded-full border border-white/5" />
      </div>

      {/* Accessible Studio Status Telemetry Tag */}
      {showStatusLabel && (
        <div className="mt-4 flex flex-col items-center gap-1.5">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase transition-colors ${
              state === 'error'
                ? 'bg-[#FF8277]/10 text-[#FF8277] border border-[#FF8277]/30 shadow-[0_0_12px_rgba(255,130,119,0.15)]'
                : 'chrome-badge text-[#E8EAE5]'
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]"
              style={{ backgroundColor: current.dotColor, color: current.dotColor }}
            />
            <span className="font-semibold text-[#B8FF62]">{current.label}</span>
            <span className="text-[#8A9389]">/</span>
            <span>{current.text}</span>
          </div>
          <span className="text-[11px] font-mono text-[#8A9389] tracking-tight">
            {current.subtext}
          </span>
        </div>
      )}
    </div>
  );
};
