import React from 'react';
import type { EchoRingsState } from '../types';

interface EchoRingsProps {
  state?: EchoRingsState;
  audioLevel?: number; // 0 to 1 for dynamic reactive scaling from Web Audio API
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
      text: 'Acoustic Core Ready',
      dotColor: '#00F0FF',
      strokeColor: '#00F0FF',
      subtext: 'Awaiting practice session launch',
    },
    speaking: {
      label: 'AI PROMPTER',
      text: 'Interviewer Voice Ready',
      dotColor: '#00F0FF',
      strokeColor: '#00F0FF',
      subtext: 'Delivering tailored interview inquiry',
    },
    recording: {
      label: 'LIVE MICROPHONE',
      text: 'Audio Input Active',
      dotColor: '#00F0FF',
      strokeColor: '#00F0FF',
      subtext: 'Measuring verbal clarity and flow cadence',
    },
    processing: {
      label: 'SYNTHESIS',
      text: 'Calibrating Response',
      dotColor: '#00F0FF',
      strokeColor: '#00F0FF',
      subtext: 'Processing conversational metrics',
    },
    error: {
      label: 'HARDWARE NOTICE',
      text: 'Audio Capture Blocked',
      dotColor: '#FF4D6D',
      strokeColor: '#FF4D6D',
      subtext: 'Enable microphone permissions or switch to Typed Mode',
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

  const sizeClasses = {
    sm: 'w-28 h-28 sm:w-32 sm:h-32',
    md: 'w-48 h-48 sm:w-52 sm:h-52',
    lg: 'w-64 h-64 sm:w-72 sm:h-72',
    responsive: 'w-48 h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 md:w-72 md:h-72',
  };

  // Purely reactive to real audioLevel when recording/testing
  const dynamicScale = state === 'recording' ? 1 + audioLevel * 0.22 : 1;

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Concentric Vector Geometry */}
      <div
        className={`relative ${sizeClasses[size]} flex items-center justify-center select-none`}
        style={{ transform: `scale(${dynamicScale})`, transition: 'transform 80ms ease-out' }}
      >
        <svg
          viewBox="0 0 260 260"
          className="w-full h-full overflow-visible"
          role="img"
          aria-label={`EchoTutor acoustic visualizer in ${state} mode`}
        >
          <defs>
            {/* Core Radial Atmosphere */}
            <radialGradient id="daemon-core-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={current.strokeColor} stopOpacity="0.8" />
              <stop offset="50%" stopColor={current.strokeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={current.strokeColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Central Atmosphere Glow */}
          <circle
            cx="130"
            cy="130"
            r="44"
            fill="url(#daemon-core-glow)"
            className={
              state === 'recording'
                ? 'opacity-60'
                : state === 'speaking'
                ? 'anim-speak-1 opacity-40'
                : state === 'error'
                ? 'opacity-30'
                : 'opacity-20'
            }
          />

          {/* Ring 5: Outermost perimeter */}
          <circle
            cx="130"
            cy="130"
            r="116"
            fill="none"
            stroke={current.strokeColor}
            strokeWidth="1"
            strokeOpacity={state === 'error' ? '0.4' : state === 'recording' ? '0.45' : '0.15'}
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

          {/* Ring 4: Ambient harmonic */}
          <circle
            cx="130"
            cy="130"
            r="94"
            fill="none"
            stroke={current.strokeColor}
            strokeWidth="1.25"
            strokeOpacity={state === 'error' ? '0.5' : state === 'recording' ? '0.6' : '0.25'}
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

          {/* Ring 3: Mid acoustic pulse */}
          <circle
            cx="130"
            cy="130"
            r="70"
            fill="none"
            stroke={current.strokeColor}
            strokeWidth={state === 'recording' ? '2.0' : '1.25'}
            strokeOpacity={state === 'error' ? '0.7' : state === 'recording' ? '0.8' : '0.45'}
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

          {/* Ring 2: Core acoustic boundary */}
          <circle
            cx="130"
            cy="130"
            r="46"
            fill="none"
            stroke={current.strokeColor}
            strokeWidth={state === 'recording' ? '2.5' : '1.5'}
            strokeOpacity={state === 'error' ? '0.9' : '0.75'}
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

          {/* Ring 1: Inner collar */}
          <circle
            cx="130"
            cy="130"
            r="26"
            fill="none"
            stroke={current.strokeColor}
            strokeWidth="1.75"
            strokeOpacity="0.9"
            className={`echo-ring ${state === 'error' ? 'anim-error' : 'anim-core'}`}
          />

          {/* Central Emitter Core */}
          <circle
            cx="130"
            cy="130"
            r={state === 'recording' ? '7.5' : '5'}
            fill={current.dotColor}
            className="echo-ring transition-all duration-150"
          />

          {/* Orientation Ticks & Crosshair Markers */}
          <line x1="130" y1="6" x2="130" y2="14" stroke={current.strokeColor} strokeOpacity="0.4" strokeWidth="1" />
          <line x1="130" y1="246" x2="130" y2="254" stroke={current.strokeColor} strokeOpacity="0.4" strokeWidth="1" />
          <line x1="6" y1="130" x2="14" y2="130" stroke={current.strokeColor} strokeOpacity="0.4" strokeWidth="1" />
          <line x1="246" y1="130" x2="254" y2="130" stroke={current.strokeColor} strokeOpacity="0.4" strokeWidth="1" />

          {/* Precision Diagonal Crosshairs */}
          <circle cx="130" cy="130" r="126" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" fill="none" />
        </svg>

        {/* Ambient Outer Border */}
        <div className="absolute inset-0 pointer-events-none rounded-full border border-white/[0.04]" />
      </div>

      {/* Accessible Status Badge */}
      {showStatusLabel && (
        <div className="mt-5 flex flex-col items-center gap-1.5">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[11px] font-mono tracking-wider uppercase transition-colors ${
              state === 'error'
                ? 'bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/40 shadow-[0_0_12px_rgba(255,77,109,0.2)]'
                : state === 'recording'
                ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_14px_rgba(0,240,255,0.25)]'
                : 'daemon-badge'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${state === 'recording' ? 'animate-ping' : ''}`}
              style={{ backgroundColor: current.dotColor }}
            />
            <span className="font-bold tracking-widest">{current.label}</span>
            <span className="text-white/20">/</span>
            <span className="text-[#FFFFFF]">{current.text}</span>
          </div>
          <span className="text-[11px] font-mono text-[#9EA6B0] tracking-tight">
            {current.subtext}
          </span>
        </div>
      )}
    </div>
  );
};
