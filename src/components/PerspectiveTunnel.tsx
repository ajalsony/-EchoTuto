import React, { useState, useEffect } from 'react';
import { Cpu, MessageSquare, Mic, Sparkles } from 'lucide-react';

interface PerspectiveTunnelProps {
  children?: React.ReactNode;
}

interface TunnelCardInfo {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  // 3D coordinates for desktop
  transform3d: string;
}

const tunnelCards: TunnelCardInfo[] = [
  {
    id: 'tech-depth',
    category: 'PILLAR 01 // DEPTH',
    title: 'Technical Depth',
    description: 'Defend algorithmic tradeoffs and system architecture under pressure.',
    icon: <Cpu className="w-4 h-4 text-[#9B87F5]" />,
    transform3d: 'translate3d(-20%, -30%, -180px) rotateY(7deg) rotateX(-3deg)',
  },
  {
    id: 'behavioral-stories',
    category: 'PILLAR 02 // CLARITY',
    title: 'Behavioral Stories',
    description: 'Structure high-stakes leadership narratives using the STAR method.',
    icon: <MessageSquare className="w-4 h-4 text-[#B8A5FF]" />,
    transform3d: 'translate3d(20%, -32%, -240px) rotateY(-7deg) rotateX(-3deg)',
  },
  {
    id: 'acoustic-presence',
    category: 'PILLAR 03 // CADENCE',
    title: 'Acoustic Presence',
    description: 'Measure pacing, speech velocity, and composure with real microphone data.',
    icon: <Mic className="w-4 h-4 text-[#7AE582]" />,
    transform3d: 'translate3d(-22%, 35%, -140px) rotateY(6deg) rotateX(2deg)',
  },
  {
    id: 'critique-growth',
    category: 'PILLAR 04 // MASTERY',
    title: 'Critique & Growth',
    description: 'Isolate speech patterns and refine answers through iterative practice.',
    icon: <Sparkles className="w-4 h-4 text-[#9B87F5]" />,
    transform3d: 'translate3d(22%, 36%, -210px) rotateY(-6deg) rotateX(2deg)',
  },
];

export const PerspectiveTunnel: React.FC<PerspectiveTunnelProps> = ({ children }) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(media.matches);

      const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      media.addEventListener('change', handleMotionChange);

      return () => media.removeEventListener('change', handleMotionChange);
    }
  }, []);

  // Subtle mouse tilt for immersive spatial depth on desktop
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || window.innerWidth < 1024) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 3.5, y: -y * 3.5 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full overflow-hidden"
      style={{ perspective: reducedMotion ? 'none' : '1100px' }}
    >
      {/* 3D Spatial Stage (Desktop View: XL+) */}
      <div
        className="relative w-full flex flex-col items-center justify-center transition-transform duration-700 ease-out"
        style={{
          transformStyle: reducedMotion ? 'flat' : 'preserve-3d',
          transform: reducedMotion
            ? 'none'
            : `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
        }}
      >
        {/* Floating Peripheral Cards in 3D Space (Hidden on tablet/mobile to prevent overcrowding) */}
        {!reducedMotion && (
          <div
            aria-hidden="true"
            className="hidden lg:block absolute inset-0 pointer-events-none select-none"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Top-Left Card */}
            <div
              className="absolute top-10 left-4 xl:left-8 w-64 p-4 rounded-2xl bg-[#211C30]/80 backdrop-blur-md border border-[#37304D]/70 shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition-all duration-700"
              style={{
                transform: tunnelCards[0].transform3d,
                opacity: 0.85,
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {tunnelCards[0].icon}
                <span className="text-[10px] font-mono tracking-widest text-[#B8A5FF] font-semibold">
                  {tunnelCards[0].category}
                </span>
              </div>
              <h4 className="font-space font-bold text-sm text-[#F5F2FF]">
                {tunnelCards[0].title}
              </h4>
              <p className="text-[11px] text-[#B7AECF] mt-1 leading-snug">
                {tunnelCards[0].description}
              </p>
            </div>

            {/* Top-Right Card */}
            <div
              className="absolute top-12 right-4 xl:right-8 w-64 p-4 rounded-2xl bg-[#211C30]/80 backdrop-blur-md border border-[#37304D]/70 shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition-all duration-700"
              style={{
                transform: tunnelCards[1].transform3d,
                opacity: 0.82,
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {tunnelCards[1].icon}
                <span className="text-[10px] font-mono tracking-widest text-[#B8A5FF] font-semibold">
                  {tunnelCards[1].category}
                </span>
              </div>
              <h4 className="font-space font-bold text-sm text-[#F5F2FF]">
                {tunnelCards[1].title}
              </h4>
              <p className="text-[11px] text-[#B7AECF] mt-1 leading-snug">
                {tunnelCards[1].description}
              </p>
            </div>

            {/* Bottom-Left Card */}
            <div
              className="absolute bottom-12 left-6 xl:left-10 w-64 p-4 rounded-2xl bg-[#211C30]/80 backdrop-blur-md border border-[#37304D]/70 shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition-all duration-700"
              style={{
                transform: tunnelCards[2].transform3d,
                opacity: 0.88,
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {tunnelCards[2].icon}
                <span className="text-[10px] font-mono tracking-widest text-[#7AE582] font-semibold">
                  {tunnelCards[2].category}
                </span>
              </div>
              <h4 className="font-space font-bold text-sm text-[#F5F2FF]">
                {tunnelCards[2].title}
              </h4>
              <p className="text-[11px] text-[#B7AECF] mt-1 leading-snug">
                {tunnelCards[2].description}
              </p>
            </div>

            {/* Bottom-Right Card */}
            <div
              className="absolute bottom-10 right-6 xl:right-10 w-64 p-4 rounded-2xl bg-[#211C30]/80 backdrop-blur-md border border-[#37304D]/70 shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition-all duration-700"
              style={{
                transform: tunnelCards[3].transform3d,
                opacity: 0.85,
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {tunnelCards[3].icon}
                <span className="text-[10px] font-mono tracking-widest text-[#B8A5FF] font-semibold">
                  {tunnelCards[3].category}
                </span>
              </div>
              <h4 className="font-space font-bold text-sm text-[#F5F2FF]">
                {tunnelCards[3].title}
              </h4>
              <p className="text-[11px] text-[#B7AECF] mt-1 leading-snug">
                {tunnelCards[3].description}
              </p>
            </div>
          </div>
        )}

        {/* Central High-Priority Hero Content (Always immediately accessible, readable & centered) */}
        <div className="relative z-10 w-full flex flex-col items-center">
          {children}
        </div>
      </div>

      {/* Mobile & Tablet Compact Card Strip (Shows below hero on screens < 1024px without overcrowding) */}
      <div className="block lg:hidden w-full mt-6 px-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
          {tunnelCards.map((card) => (
            <div
              key={card.id}
              className="p-3.5 rounded-xl bg-[#211C30]/90 border border-[#37304D] flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-[#100D1B] border border-[#37304D]/60 shrink-0 mt-0.5">
                {card.icon}
              </div>
              <div>
                <span className="text-[9px] font-mono tracking-wider text-[#B8A5FF] font-semibold uppercase">
                  {card.category}
                </span>
                <h4 className="font-space font-semibold text-xs text-[#F5F2FF]">
                  {card.title}
                </h4>
                <p className="text-[11px] text-[#B7AECF] mt-0.5 leading-tight">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
