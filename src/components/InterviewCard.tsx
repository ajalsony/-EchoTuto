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
      className={`group relative text-left p-6 sm:p-7 rounded-2xl transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'chrome-panel-active'
          : 'chrome-panel chrome-panel-hover'
      } focus:outline-none focus:ring-2 focus:ring-[#B8FF62] focus:ring-offset-2 focus:ring-offset-[#0B0D0C]`}
    >
      {/* Top Metadata Row: Code & Selection Indicator */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-xs tracking-widest text-[#8A9389] uppercase">
          {code}
        </span>
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
            isSelected
              ? 'bg-[#B8FF62] border-[#B8FF62] text-[#0B0D0C] shadow-[0_0_10px_rgba(184,255,98,0.4)]'
              : 'border-white/10 text-transparent group-hover:border-white/20'
          }`}
          aria-hidden="true"
        >
          <Check className={`w-3.5 h-3.5 stroke-[2.5] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
        </div>
      </div>

      {/* Track Icon & Title */}
      <div className="flex items-center gap-3.5 mb-2.5">
        <div
          className={`p-2.5 rounded-xl border transition-colors ${
            isSelected
              ? 'bg-[#B8FF62]/10 border-[#B8FF62]/40 text-[#B8FF62]'
              : 'bg-[#0B0D0C] border-white/10 text-[#8A9389] group-hover:text-[#E8EAE5]'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-space font-bold text-xl sm:text-2xl text-[#E8EAE5]">
          {title}
        </h3>
      </div>

      {/* Editorial Tagline */}
      <p className="font-mono text-xs text-[#B8FF62] tracking-wide mb-3">
        “{tagline}”
      </p>

      {/* Description */}
      <p className="text-sm text-[#8A9389] leading-relaxed mb-5">
        {description}
      </p>

      {/* Focus Area Tags */}
      <div className="flex flex-wrap gap-1.5 pt-3.5 border-t border-white/[0.06]">
        {focusAreas.map((area, i) => (
          <span
            key={i}
            className="text-[11px] font-mono px-2.5 py-1 rounded-md chrome-badge text-[#8A9389]"
          >
            {area}
          </span>
        ))}
      </div>
    </div>
  );
};
