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
      className={`group relative text-left p-6 sm:p-7 rounded-xl transition-all duration-200 cursor-pointer border ${
        isSelected
          ? 'bg-[#1B201D] border-[#B8FF62] shadow-[0_0_0_1px_#B8FF62]'
          : 'bg-[#1B201D]/70 hover:bg-[#1B201D] border-[#28302B] hover:border-[#3A473F]'
      } focus:outline-none focus:ring-2 focus:ring-[#B8FF62] focus:ring-offset-2 focus:ring-offset-[#101211]`}
    >
      {/* Top Metadata Row: Code & Selection Indicator */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-xs tracking-widest text-[#929991] uppercase">
          {code}
        </span>
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
            isSelected
              ? 'bg-[#B8FF62] border-[#B8FF62] text-[#101211]'
              : 'border-[#28302B] text-transparent group-hover:border-[#3A473F]'
          }`}
          aria-hidden="true"
        >
          <Check className={`w-3.5 h-3.5 stroke-[2.5] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
        </div>
      </div>

      {/* Track Icon & Title */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`p-2 rounded-lg border transition-colors ${
            isSelected
              ? 'bg-[#B8FF62]/10 border-[#B8FF62]/40 text-[#B8FF62]'
              : 'bg-[#101211] border-[#28302B] text-[#929991] group-hover:text-[#E8EAE5]'
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
      <p className="text-sm text-[#929991] leading-relaxed mb-5">
        {description}
      </p>

      {/* Focus Area Tags */}
      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#28302B]/60">
        {focusAreas.map((area, i) => (
          <span
            key={i}
            className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#101211] border border-[#28302B] text-[#929991]"
          >
            {area}
          </span>
        ))}
      </div>
    </div>
  );
};
