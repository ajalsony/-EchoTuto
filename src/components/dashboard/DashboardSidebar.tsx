import React from 'react';
import {
  LayoutDashboard,
  Terminal,
  History,
  Target,
  GraduationCap,
  LogOut,
  X,
  ExternalLink,
} from 'lucide-react';
import type { InterviewTrack } from '../../types';

interface DashboardSidebarProps {
  currentTrack: InterviewTrack;
  progressionTier: string;
  userName: string;
  userUsername: string;
  userRole: string;
  activeSection: 'overview' | 'ledger' | 'diagnostic' | 'dossier';
  onSelectSection: (section: 'overview' | 'ledger' | 'diagnostic' | 'dossier') => void;
  onOpenStudio: () => void;
  onOpenDossier: () => void;
  onNavigateLanding?: () => void;
  onLogout: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  currentTrack,
  progressionTier,
  userName,
  userUsername,
  userRole,
  activeSection,
  onSelectSection,
  onOpenStudio,
  onOpenDossier,
  onNavigateLanding,
  onLogout,
  isMobileOpen,
  onCloseMobile,
}) => {
  const formatLevel = (tier: string) => {
    const norm = (tier || '').toLowerCase();
    if (norm === 'executive' || norm === 'hard') return 'LVL 3: EXECUTIVE DEFENSE';
    if (norm === 'pressure-cooker' || norm === 'medium') return 'LVL 2: PRESSURE COOKER';
    return 'LVL 1: FOUNDATION CRUCIBLE';
  };

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      action: () => {
        onSelectSection('overview');
        onCloseMobile();
      },
    },
    {
      id: 'studio',
      label: 'Interview Studio',
      icon: Terminal,
      action: () => {
        onOpenStudio();
        onCloseMobile();
      },
      highlight: true,
    },
    {
      id: 'diagnostic',
      label: 'Skill Diagnostic',
      icon: Target,
      action: () => {
        onSelectSection('diagnostic');
        onCloseMobile();
      },
    },
    {
      id: 'ledger',
      label: 'Execution Ledger',
      icon: History,
      action: () => {
        onSelectSection('ledger');
        onCloseMobile();
      },
    },
    {
      id: 'dossier',
      label: 'Candidate Dossier',
      icon: GraduationCap,
      action: () => {
        onOpenDossier();
        onCloseMobile();
      },
    },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-5 sm:p-6 bg-[#0D0E10] text-[#F8FAFC]">
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2">
          <button
            type="button"
            onClick={onNavigateLanding}
            className="flex items-center gap-3 text-left focus:outline-none focus:ring-1 focus:ring-[#00F0FF] rounded-md p-1 -m-1 transition-transform active:scale-[0.98]"
            title="EchoTutor Home"
          >
            <div className="w-8 h-8 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)]">
              <span className="font-mono text-sm font-bold">⨂</span>
            </div>
            <span className="font-syne text-lg tracking-tight font-extrabold text-white">
              ECHOTUTOR
            </span>
          </button>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-[#9EA6B0] hover:text-white hover:bg-white/[0.08]"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progression Tier Card */}
        <div className="px-3.5 py-2.5 rounded-lg bg-[#14181B] border border-white/[0.08] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#9EA6B0]">
              {currentTrack === 'technical' ? 'SYS CRUCIBLE TIER' : 'STAR LEAD TIER'}
            </span>
            <span className="font-mono text-[11px] text-[#00F0FF] font-bold tracking-wide">
              {formatLevel(progressionTier)}
            </span>
          </div>
          <span className="h-2 w-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF] animate-pulse" />
        </div>

        {/* Navigation Menu */}
        <nav aria-label="Dashboard navigation" className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition-all text-left ${
                  isActive
                    ? 'bg-[#1F2022] text-[#00F0FF] border-l-2 border-[#00F0FF] font-bold shadow-sm'
                    : item.highlight
                    ? 'text-white hover:bg-[#14181B] hover:text-[#00F0FF]'
                    : 'text-[#9EA6B0] hover:bg-[#14181B] hover:text-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#00F0FF]' : 'text-[#9EA6B0]'}`} />
                  <span className="font-inter text-sm">{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00F0FF]/15 text-[#00F0FF] font-bold">
                    STUDIO
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Public Landing Shortcut */}
        {onNavigateLanding && (
          <button
            type="button"
            onClick={() => {
              onNavigateLanding();
              onCloseMobile();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono text-[#9EA6B0] hover:text-white hover:bg-[#14181B] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Public Landing Page</span>
          </button>
        )}
      </div>

      {/* Bottom Profile & Status Footer */}
      <div className="flex flex-col gap-4 pt-4 border-t border-white/[0.08]">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#00FF85] shadow-[0_0_6px_#00FF85]" />
            <span className="font-mono text-[10px] text-[#9EA6B0] uppercase tracking-wider font-semibold">
              SYNAPSE ONLINE
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#00F0FF] font-bold">99.9%</span>
        </div>

        {/* Candidate Profile Widget */}
        <div className="p-2.5 rounded-lg bg-[#14181B] border border-white/[0.08] flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onOpenDossier}
            className="flex items-center gap-2.5 text-left flex-1 min-w-0 group"
            title="Inspect Candidate Dossier"
          >
            <div className="w-8 h-8 rounded-full bg-[#0A0B0D] border border-[#00F0FF]/40 text-[#00F0FF] flex items-center justify-center font-mono font-bold text-xs shrink-0 group-hover:border-[#00F0FF] transition-colors">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-inter text-xs font-semibold text-white truncate group-hover:text-[#00F0FF] transition-colors">
                {userName}
              </span>
              <span className="font-mono text-[10px] text-[#00F0FF] truncate">
                {userUsername ? `@${userUsername}` : userRole}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 rounded-md text-[#9EA6B0] hover:text-[#FF4D6D] hover:bg-[#FF4D6D]/10 transition-colors shrink-0"
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Fixed Sidebar (w-64) */}
      <aside
        aria-label="Sidebar navigation"
        className="hidden lg:flex fixed left-0 top-0 h-full w-64 border-r border-white/[0.08] z-40 flex-col"
      >
        {sidebarContent}
      </aside>

      {/* 2. Mobile Drawer Navigation */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-fadeIn">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#0A0B0D]/80 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          {/* Slide Drawer */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
