import React from 'react';
import { Terminal, MessageSquareQuote, Check } from 'lucide-react';
import type { InterviewTrack } from '../types';

interface InterviewCardProps {
  id: InterviewTrack;
  title: string;
  tagline: string;
  code: string;
  description: string;
  focusAreas: string[];
  isSelected: boolean;
  onSelect: (id: InterviewTrack) => void;
}

export const InterviewCard: React.FC<InterviewCardProps> = ({
  id,
  title,
  tagline,
  code,
  description,
  focusAreas,
  isSelected,
  onSelect,
}) => {
  const Icon = id === 'technical' ? Terminal : MessageSquareQuote;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onSelect(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(id);
        }
      }}
      className={`group relative text-left p-6 sm:p-8 rounded-xl transition-all duration-200 cursor-pointer ${
        isSelected ? 'daemon-card-active' : 'daemon-card daemon-card-hover'
      } focus:outline-none focus:ring-2 focus:ring-[#00F0FF] focus:ring-offset-2 focus:ring-offset-[#0A0B0D]`}
    >
      {/* Precision Corner Crosshairs */}
      <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
      <span className="daemon-crosshair-tr" aria-hidden="true">+</span>
      <span className="daemon-crosshair-bl" aria-hidden="true">+</span>
      <span className="daemon-crosshair-br" aria-hidden="true">+</span>

      {/* Top Metadata Row: Track Code & Selection Checkmark */}
      <div className="flex items-center justify-between mb-5">
        <span className="font-mono text-xs tracking-widest text-[#9EA6B0] uppercase font-bold">
          {code}
        </span>
        <div
          className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all ${
            isSelected
              ? 'bg-[#00F0FF] border-[#00F0FF] text-[#0A0B0D] shadow-[0_0_10px_rgba(0,240,255,0.4)]'
              : 'border-white/[0.12] text-transparent group-hover:border-white/[0.3]'
          }`}
          aria-hidden="true"
        >
          <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
        </div>
      </div>

      {/* Track Icon & Anton Display Title */}
      <div className="flex items-center gap-3.5 mb-2.5">
        <div
          className={`p-2.5 rounded-lg border transition-colors ${
            isSelected
              ? 'bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF]'
              : 'bg-[#0A0B0D] border-white/[0.1] text-[#9EA6B0] group-hover:text-[#FFFFFF]'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-anton text-2xl sm:text-3xl tracking-wide uppercase text-[#FFFFFF]">
          {title}
        </h3>
      </div>

      {/* Tactical Tagline */}
      <p className="font-mono text-xs text-[#00F0FF] tracking-wide mb-3 uppercase">
        “{tagline}”
      </p>

      {/* Description */}
      <p className="text-sm text-[#9EA6B0] leading-relaxed mb-6 font-inria">
        {description}
      </p>

      {/* Focus Area Tags */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.08]">
        {focusAreas.map((area, i) => (
          <span
            key={i}
            className="text-[11px] font-mono px-2.5 py-1 rounded-md daemon-chip tracking-wide uppercase"
          >
            {area}
          </span>
        ))}
      </div>
    </div>
  );
};
