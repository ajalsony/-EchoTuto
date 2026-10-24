import React from 'react';
import {
  ArrowRight,
  Zap,
  CheckCircle2,
  Terminal,
  Activity,
  ShieldCheck,
  RotateCcw,
  BookOpen,
  Layers,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { StitchShaderBackground } from '../ui/StitchShaderBackground';

interface PublicLandingPageProps {
  onStartTraining: () => void;
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
  onNavigateDashboard: () => void;
  isAuthenticated: boolean;
  userEmail?: string;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({
  onStartTraining,
  onNavigateLogin,
  onNavigateRegister,
  onNavigateDashboard,
  isAuthenticated,
  userEmail,
}) => {
  const scrollToLoop = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('learning-loop');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToCapabilities = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('capabilities');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0A0B0D] text-[#F8FAFC] flex flex-col font-inter selection:bg-[#00F0FF] selection:text-[#0A0B0D]">
      {/* --------------------------------------------------------------------- */}
      {/* 1. TOP RESPONSIVE NAVIGATION BAR                                      */}
      {/* --------------------------------------------------------------------- */}
      <header className="sticky top-0 left-0 right-0 z-50 bg-[#0D0E10]/85 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-4">
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#14181B] border border-[#00F0FF]/40 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.25)]">
              <span className="w-3.5 h-3.5 border-2 border-[#00F0FF] rotate-45 transform"></span>
            </div>
            <span className="font-display-xl text-xl sm:text-2xl font-extrabold tracking-tight text-[#F8FAFC]">
              ECHOTUTOR<span className="text-[#00F0FF]">.</span>
            </span>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wider uppercase text-[#9EA6B0]">
            <a
              href="#overview"
              className="text-[#00F0FF] font-bold transition-colors"
            >
              Overview
            </a>
            <a
              href="#learning-loop"
              onClick={scrollToLoop}
              className="hover:text-[#F8FAFC] transition-colors"
            >
              Learning Loop
            </a>
            <a
              href="#capabilities"
              onClick={scrollToCapabilities}
              className="hover:text-[#F8FAFC] transition-colors"
            >
              Curriculum
            </a>
            <a
              href="#progression"
              className="hover:text-[#F8FAFC] transition-colors"
            >
              Crucible
            </a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onNavigateDashboard}
                className="stitch-btn-secondary py-2 px-3.5 text-xs text-[#00F0FF] border-[#00F0FF]/40"
              >
                <span>Dashboard</span>
                <span className="text-[10px] text-[#9EA6B0]">({userEmail?.split('@')[0]})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="px-3.5 py-1.5 rounded bg-[#14181B] hover:bg-[#1B2126] border border-white/[0.1] text-xs font-mono text-[#F8FAFC] hover:text-[#00F0FF] hover:border-[#00F0FF]/40 transition-all uppercase"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={onNavigateRegister}
                  className="stitch-btn-primary py-1.5 px-4 text-xs"
                >
                  Join
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------------------- */}
      {/* 2. HERO SECTION WITH FLUID SHADER BACKDROP & TELEMETRY HUD            */}
      {/* --------------------------------------------------------------------- */}
      <section id="overview" className="relative w-full overflow-hidden pb-16 pt-8 sm:pt-14 lg:pt-20">
        {/* Dynamic WebGL Shader Background */}
        <StitchShaderBackground opacity={0.45} />

        {/* Optical Obsidian Vignette / Gradient Masking */}
        <div className="absolute inset-0 w-full h-[680px] pointer-events-none bg-gradient-to-b from-[#0A0B0D]/10 via-[#0A0B0D]/75 to-[#0A0B0D]" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-[#00F0FF]/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col items-center text-center">
          {/* Telemetry Operational Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-[#14181B]/90 backdrop-blur-md border border-white/[0.08] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse shadow-[0_0_10px_#00F0FF]"></span>
            <span className="font-label-code text-[11px] uppercase tracking-widest text-[#7DF4FF]">
              OPERATIONAL AI INTERVIEW COACHING
            </span>
            <span className="font-label-code text-[11px] text-[#9EA6B0]/60">// PERSISTENT LEARNING ENGINE</span>
          </div>

          {/* Main Headline */}
          <h1 className="mt-6 font-display-xl text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[#F8FAFC] max-w-4xl uppercase leading-[1.08]">
            DON'T JUST PREPARE.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DBFCFF] via-[#7DF4FF] to-[#00F0FF]">
              GET BETTER UNDER PRESSURE.
            </span>
          </h1>

          {/* Supporting Statement */}
          <p className="mt-6 max-w-2xl font-body-lg text-base sm:text-lg text-[#9EA6B0] font-normal leading-relaxed">
            Find your weaknesses. Learn the concepts. Retry difficult questions. Prove you've improved under calibrated production-grade interview stress.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={onStartTraining}
              className="stitch-btn-primary min-h-[48px] px-8 text-sm sm:text-base flex items-center gap-2.5"
            >
              <span>Start Your Training</span>
              <Zap className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={scrollToLoop}
              className="stitch-btn-secondary min-h-[48px] px-6 text-xs sm:text-sm flex items-center gap-2"
            >
              <span>Explore the Learning Loop</span>
              <ArrowRight className="w-4 h-4 text-[#00F0FF]" />
            </button>
          </div>

          {/* Architecture & Engineering Standards Strip */}
          <div className="mt-12 w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="stitch-card p-3.5 text-left">
              <div className="font-label-caps text-[#9EA6B0]">COACHING ENGINE</div>
              <div className="font-mono-metric text-lg sm:text-xl text-[#00F0FF] mt-1">4-STAGE</div>
              <div className="text-[10px] font-mono text-[#9EA6B0] mt-0.5">Assess → Verify</div>
            </div>
            <div className="stitch-card p-3.5 text-left">
              <div className="font-label-caps text-[#9EA6B0]">CRUCIBLE TIERS</div>
              <div className="font-mono-metric text-lg sm:text-xl text-[#00FF85] mt-1">L1 → L3</div>
              <div className="text-[10px] font-mono text-[#9EA6B0] mt-0.5">Foundation → Executive</div>
            </div>
            <div className="stitch-card p-3.5 text-left">
              <div className="font-label-caps text-[#9EA6B0]">BENCHMARK GATE</div>
              <div className="font-mono-metric text-lg sm:text-xl text-[#F8FAFC] mt-1">≥75% AVG</div>
              <div className="text-[10px] font-mono text-[#9EA6B0] mt-0.5">Zero critical deficits</div>
            </div>
            <div className="stitch-card p-3.5 text-left">
              <div className="font-label-caps text-[#9EA6B0]">PERSISTENCE</div>
              <div className="font-mono-metric text-lg sm:text-xl text-[#7DF4FF] mt-1">PG // RLS</div>
              <div className="text-[10px] font-mono text-[#9EA6B0] mt-0.5">Tenant-isolated storage</div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 3. PRODUCT DEMONSTRATION WORKSPACE PREVIEW                            */}
      {/* --------------------------------------------------------------------- */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
        <div className="relative stitch-card-elevated p-4 sm:p-6 rounded-xl border border-white/[0.1] shadow-2xl overflow-hidden">
          {/* Prominent Demonstration Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
              <span className="font-label-code text-[11px] text-[#00F0FF] uppercase font-bold">
                ILLUSTRATIVE WORKSPACE PREVIEW
              </span>
              <span className="text-white/20 font-mono text-xs">•</span>
              <span className="text-[10px] font-mono text-[#9EA6B0]">
                DEMO SIMULATION // PRODUCTION STUDIO RUNTIME
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-[#9EA6B0]">
              <span>TRACK: <strong className="text-[#F8FAFC]">DISTRIBUTED SYSTEMS</strong></span>
              <span className="stitch-badge stitch-badge-red text-[10px]">PRESSURE COOKER</span>
            </div>
          </div>

          {/* 2-Column Split Mockup */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left: Illustrative Question Card */}
            <div className="lg:col-span-5 stitch-card p-4 sm:p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#9EA6B0] mb-2">
                  <span className="text-[#00F0FF] font-bold">PROMPT #DS-0418</span>
                  <span>SUB-10MS SLA</span>
                </div>
                <h2 className="font-headline-sm text-sm sm:text-base text-[#F8FAFC] font-semibold leading-snug">
                  How would you design an idempotency key mechanism for a high-throughput payment processing engine to prevent duplicate charges during network timeouts?
                </h2>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="stitch-badge stitch-badge-muted text-[10px]">Distributed Locking</span>
                  <span className="stitch-badge stitch-badge-muted text-[10px]">Redis NX/PX</span>
                  <span className="stitch-badge stitch-badge-muted text-[10px]">Fencing Tokens</span>
                </div>
              </div>

              {/* Rubric Criteria Checklist */}
              <div className="pt-3 border-t border-white/[0.06] text-xs font-mono space-y-1.5 text-[#9EA6B0]">
                <div className="flex items-center gap-2 text-[#00FF85]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>UUIDv4 idempotency key via HTTP header</span>
                </div>
                <div className="flex items-center gap-2 text-[#00FF85]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Monotonic fencing token on ledger commits</span>
                </div>
                <div className="flex items-center gap-2 text-[#FFB800]">
                  <Activity className="w-3.5 h-3.5 shrink-0" />
                  <span>Clock drift vulnerability edge case</span>
                </div>
              </div>
            </div>

            {/* Right: Illustrative Typed IDE Terminal */}
            <div className="lg:col-span-7 bg-[#060708] rounded-lg border border-white/[0.08] p-4 flex flex-col justify-between font-label-code text-xs">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-3 text-[11px] text-[#9EA6B0]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span className="text-[#F8FAFC]">architecture_spec.md</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-[#00FF85]">● Auto-Saved</span>
                  <span>UTF-8</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[#9EA6B0] font-mono leading-relaxed select-none">
                <p className="text-[#00F0FF] font-bold"># Core Idempotency Guarantee Specification</p>
                <p>1. Client generates UUIDv4 `Idempotency-Key` passed via HTTP header.</p>
                <p>2. API Gateway validates format and routes to payment worker.</p>
                <p className="text-[#00FF85]">3. `SET idempotency:lock:&#123;key&#125; token NX PX 15000`</p>
                <p className="pl-3 text-white/50">// If lock acquisition returns NIL -&gt; 409 Conflict / Poll status.</p>
                <p>4. Check persistent state store for cached settlement payload.</p>
                <p>5. Outgoing Payment Gateway invocation with dedup payload token.</p>
                <p>6. Monotonic fencing token verification before committing ledger.</p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                <span className="text-[#9EA6B0]">284 WORDS // 1,842 CHARS</span>
                <span className="text-[#00F0FF] font-bold">[ READY TO EVALUATE ]</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 4. FOUR-STAGE LEARNING LOOP (ASSESS -> DIAGNOSE -> TEACH -> VERIFY)   */}
      {/* --------------------------------------------------------------------- */}
      <section id="learning-loop" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 sm:py-24">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="stitch-badge stitch-badge-cyan text-xs mb-3">METHODOLOGY</div>
          <h2 className="font-display-xl text-2xl sm:text-4xl text-[#F8FAFC] uppercase tracking-tight">
            The 4-Step Mastery Cycle
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#9EA6B0] max-w-2xl">
            Generic interview tools test you once and walk away. EchoTutor diagnoses why you stumbled, teaches the missing principle, and verifies your improvement under pressure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1: Assess */}
          <div className="stitch-card p-6 flex flex-col justify-between gap-6 relative overflow-hidden group hover:border-[#00F0FF]/40">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-2xl font-bold text-[#00F0FF]">01</span>
                <span className="stitch-badge stitch-badge-cyan text-[10px]">PHASE 1</span>
              </div>
              <h3 className="font-headline-md text-lg text-[#F8FAFC] font-bold">Assess</h3>
              <p className="text-xs sm:text-sm text-[#9EA6B0] mt-2 leading-relaxed">
                Realistic domain prompts spanning Distributed Systems, Concurrency, and STAR Leadership. You deliver answers under runtime constraints.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.06] text-xs font-mono text-[#00F0FF] flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>Full Contextual Prompting</span>
            </div>
          </div>

          {/* Step 2: Diagnose */}
          <div className="stitch-card p-6 flex flex-col justify-between gap-6 relative overflow-hidden group hover:border-[#00F0FF]/40">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-2xl font-bold text-[#7DF4FF]">02</span>
                <span className="stitch-badge stitch-badge-cyan text-[10px]">PHASE 2</span>
              </div>
              <h3 className="font-headline-md text-lg text-[#F8FAFC] font-bold">Diagnose</h3>
              <p className="text-xs sm:text-sm text-[#9EA6B0] mt-2 leading-relaxed">
                Multidimensional rubric evaluations. The tutor pinpoints your exact weakest skill—such as trade-off depth, clock drift, or conflict resolution.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.06] text-xs font-mono text-[#7DF4FF] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Root-Cause Detection</span>
            </div>
          </div>

          {/* Step 3: Teach */}
          <div className="stitch-card p-6 flex flex-col justify-between gap-6 relative overflow-hidden group hover:border-[#00F0FF]/40">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-2xl font-bold text-[#00FF85]">03</span>
                <span className="stitch-badge stitch-badge-green text-[10px]">PHASE 3</span>
              </div>
              <h3 className="font-headline-md text-lg text-[#F8FAFC] font-bold">Teach</h3>
              <p className="text-xs sm:text-sm text-[#9EA6B0] mt-2 leading-relaxed">
                Direct conceptual lessons explaining the exact framework you missed, accompanied by real-world engineering examples and targeted exercise hints.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.06] text-xs font-mono text-[#00FF85] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Targeted Micro-Lessons</span>
            </div>
          </div>

          {/* Step 4: Verify */}
          <div className="stitch-card p-6 flex flex-col justify-between gap-6 relative overflow-hidden group hover:border-[#00F0FF]/40">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-2xl font-bold text-[#00F0FF]">04</span>
                <span className="stitch-badge stitch-badge-cyan text-[10px]">PHASE 4</span>
              </div>
              <h3 className="font-headline-md text-lg text-[#F8FAFC] font-bold">Verify</h3>
              <p className="text-xs sm:text-sm text-[#9EA6B0] mt-2 leading-relaxed">
                Retry the challenge armed with the new framework. The system scores your improvement delta (+10 to +30 pts) and verifies weakness resolution.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.06] text-xs font-mono text-[#00F0FF] flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Measured Score Delta</span>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 5. CORE CAPABILITIES MATRIX                                           */}
      {/* --------------------------------------------------------------------- */}
      <section id="capabilities" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 border-t border-white/[0.06]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="stitch-badge stitch-badge-muted text-xs mb-2">CURRICULUM SPECIALIZATIONS</div>
            <h2 className="font-display-xl text-2xl sm:text-3xl text-[#F8FAFC] uppercase">
              Engineered for Rigorous Scrutiny
            </h2>
          </div>
          <span className="text-xs font-mono text-[#9EA6B0]">
            CALIBRATED BENCHMARKS // ZERO FABRICATED SCORES
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stitch-card p-6 space-y-3">
            <div className="w-10 h-10 rounded bg-[#1B2126] border border-white/[0.1] flex items-center justify-center text-[#00F0FF]">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-headline-sm text-base text-[#F8FAFC] font-bold">Systems & Concurrency</h3>
            <p className="text-xs sm:text-sm text-[#9EA6B0] leading-relaxed">
              Defend cache coherence, quorum consensus, network partition fallbacks, and multi-threaded race condition prevention.
            </p>
          </div>

          <div className="stitch-card p-6 space-y-3">
            <div className="w-10 h-10 rounded bg-[#1B2126] border border-white/[0.1] flex items-center justify-center text-[#00FF85]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-headline-sm text-base text-[#F8FAFC] font-bold">Behavioral STAR Framework</h3>
            <p className="text-xs sm:text-sm text-[#9EA6B0] leading-relaxed">
              Articulate high-stakes conflict resolution, ownership under failure, and quantifiable business outcomes without rambling.
            </p>
          </div>

          <div className="stitch-card p-6 space-y-3">
            <div className="w-10 h-10 rounded bg-[#1B2126] border border-white/[0.1] flex items-center justify-center text-[#7DF4FF]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-headline-sm text-base text-[#F8FAFC] font-bold">Anti-Tamper Progression</h3>
            <p className="text-xs sm:text-sm text-[#9EA6B0] leading-relaxed">
              Advancement requires at least 2 evaluated submissions, 75%+ average score, verified weakness resolution, and zero active deficits.
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 6. CRUCIBLE PROGRESSION TIERS OVERVIEW                                */}
      {/* --------------------------------------------------------------------- */}
      <section id="progression" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 border-t border-white/[0.06]">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="stitch-badge stitch-badge-cyan text-xs mb-2">PROGRESSION CRUCIBLE</div>
          <h2 className="font-display-xl text-2xl sm:text-3xl text-[#F8FAFC] uppercase">
            Earn Every Tier with Verified Evidence
          </h2>
          <p className="text-xs sm:text-sm text-[#9EA6B0] mt-2">
            No client-side unlocks. Every Level-Up achievement is computed directly from stored evaluation and retry records by database procedures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stitch-card p-6 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-[#00FF85] font-bold">LEVEL 01</span>
                <span className="stitch-badge stitch-badge-green text-[10px]">INITIAL TIER</span>
              </div>
              <h3 className="font-headline-sm text-lg text-[#F8FAFC] font-bold">Foundation Crucible</h3>
              <p className="text-xs text-[#9EA6B0] mt-1 leading-relaxed">
                Basic system invariants, clean algorithmic structures, and foundational behavioral ownership.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] text-xs font-mono text-[#9EA6B0]">
              Unlock requirement: Account creation
            </div>
          </div>

          <div className="stitch-card-elevated p-6 flex flex-col justify-between gap-4 border-[#00F0FF]/40 shadow-[0_0_24px_rgba(0,240,255,0.1)]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-[#00F0FF] font-bold">LEVEL 02</span>
                <span className="stitch-badge stitch-badge-cyan text-[10px]">INTERMEDIATE</span>
              </div>
              <h3 className="font-headline-sm text-lg text-[#F8FAFC] font-bold flex items-center gap-1.5">
                Pressure Cooker
                <Zap className="w-4 h-4 text-[#00F0FF]" />
              </h3>
              <p className="text-xs text-[#9EA6B0] mt-1 leading-relaxed">
                Fault injection, degraded dependency fallbacks, and multi-tier edge defense challenges.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] text-xs font-mono text-[#00F0FF]">
              Requirement: ≥2 submissions, ≥75% avg, 1 retry win
            </div>
          </div>

          <div className="stitch-card p-6 flex flex-col justify-between gap-4 opacity-80">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-caps text-[#9EA6B0] font-bold">LEVEL 03</span>
                <span className="stitch-badge stitch-badge-muted text-[10px]">MASTERY</span>
              </div>
              <h3 className="font-headline-sm text-lg text-[#F8FAFC] font-bold">Executive Defense</h3>
              <p className="text-xs text-[#9EA6B0] mt-1 leading-relaxed">
                Senior trade-off cross-examination, SLA budget defense, and organizational alignment under pressure.
              </p>
            </div>
            <div className="pt-3 border-t border-white/[0.06] text-xs font-mono text-[#9EA6B0]">
              Requirement: Master Level 2 edge scenarios
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 7. BOTTOM ACTION STRIP                                                */}
      {/* --------------------------------------------------------------------- */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
        <div className="stitch-card-elevated p-8 sm:p-12 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00F0FF]/10 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="font-display-xl text-2xl sm:text-4xl text-[#F8FAFC] uppercase tracking-tight">
            Ready to Test Your Defenses?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#9EA6B0] max-w-xl mx-auto">
            Experience calibrated, persistent interview preparation engineered for technical clarity and behavioral precision.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={onStartTraining}
              className="stitch-btn-primary min-h-[48px] px-8 text-sm sm:text-base flex items-center gap-2"
            >
              <span>Start Your Training</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {!isAuthenticated && (
              <button
                type="button"
                onClick={onNavigateLogin}
                className="stitch-btn-secondary min-h-[48px] px-6 text-xs sm:text-sm"
              >
                Sign In to Portal
              </button>
            )}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* 8. FOOTER                                                             */}
      {/* --------------------------------------------------------------------- */}
      <footer className="w-full bg-[#060708] border-t border-white/[0.08] py-10 px-4 sm:px-6 lg:px-12 text-xs font-mono text-[#9EA6B0]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-[#14181B] border border-[#00F0FF]/30 flex items-center justify-center">
              <span className="w-2.5 h-2.5 border border-[#00F0FF] rotate-45 transform" />
            </div>
            <span className="font-display-xl text-sm font-bold text-[#F8FAFC]">ECHOTUTOR®</span>
            <span className="text-[#9EA6B0]/50">// Level-Up Persistent Coaching</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#overview" className="hover:text-[#F8FAFC] transition-colors">Overview</a>
            <a href="#learning-loop" onClick={scrollToLoop} className="hover:text-[#F8FAFC] transition-colors">Learning Loop</a>
            <a href="#capabilities" onClick={scrollToCapabilities} className="hover:text-[#F8FAFC] transition-colors">Capabilities</a>
            <a href="#progression" className="hover:text-[#F8FAFC] transition-colors">Progression</a>
            {isAuthenticated ? (
              <button type="button" onClick={onNavigateDashboard} className="hover:text-[#00F0FF] transition-colors">
                Dashboard
              </button>
            ) : (
              <button type="button" onClick={onNavigateLogin} className="hover:text-[#00F0FF] transition-colors">
                Sign In
              </button>
            )}
          </div>

          <div className="text-[11px] text-[#9EA6B0]/60">
            © {new Date().getFullYear()} EchoTutor. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
