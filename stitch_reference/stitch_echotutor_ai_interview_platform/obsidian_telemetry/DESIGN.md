---
name: Obsidian Telemetry
colors:
  surface: '#121315'
  surface-dim: '#121315'
  surface-bright: '#38393b'
  surface-container-lowest: '#0d0e10'
  surface-container-low: '#1b1c1e'
  surface-container: '#1f2022'
  surface-container-high: '#292a2c'
  surface-container-highest: '#343537'
  on-surface: '#e3e2e5'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e3e2e5'
  inverse-on-surface: '#303033'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#c1c7ce'
  on-secondary: '#2b3136'
  secondary-container: '#41474d'
  on-secondary-container: '#b0b6bc'
  tertiary: '#daffdd'
  on-tertiary: '#003919'
  tertiary-container: '#00f982'
  on-tertiary-container: '#006d35'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#dde3ea'
  secondary-fixed-dim: '#c1c7ce'
  on-secondary-fixed: '#161c21'
  on-secondary-fixed-variant: '#41474d'
  tertiary-fixed: '#61ff97'
  tertiary-fixed-dim: '#00e476'
  on-tertiary-fixed: '#00210c'
  on-tertiary-fixed-variant: '#005227'
  background: '#121315'
  on-background: '#e3e2e5'
  surface-variant: '#343537'
typography:
  display-xl:
    fontFamily: Syne
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-xl-mobile:
    fontFamily: Syne
    fontSize: 38px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Syne
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Syne
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Syne
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  mono-metric:
    fontFamily: JetBrains Mono
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: 0.02em
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system targets software engineers, engineering managers, and technical leads preparing for elite technical and behavioral interviews. The aesthetic is calibrated to evoke the rigor, focus, and precision of mission-critical developer tools and runtime observability dashboards.

The visual direction merges **Dark Industrial Minimalism** with **Precision Instrument Aesthetics**:
- **Atmosphere:** Deep obsidian voids punctuated by surgical electric cyan telemetry indicators, high-contrast typography, and restrained optical luminescence.
- **Tone:** Authoritative, high-performance, clinical, and empowering. It rejects playful consumer tropes in favor of an environment reminiscent of an advanced IDE, terminal, or systems diagnostic suite.
- **Tactile Quality:** Layered glassmorphism with dark-field refraction, 1px low-alpha structural borders, micro-glow edge highlights, and strict tabular data ergonomics.

## Colors

The color palette operates on a high-contrast dark field engineered to minimize eye strain during long-form mock interview sessions while directing intense focus through electric luminescence:

- **Base Field (`#0A0B0D`):** Absolute obsidian background, serving as the foundational bedrock for all views.
- **Surface Elevation 1 (`#14181B`):** Base structural container layer, providing subtle separation from the canvas.
- **Surface Elevation 2 (`#1B2126`):** Foreground cards, interactive surfaces, panel headers, and elevated drawers.
- **Primary Accent (`#00F0FF`):** Electric cyan used strictly for key state highlights, active telemetry indicators, recording states, cursor accents, and primary action calls.
- **Tertiary Accent (`#00FF85`):** Hyper-green reserved for passing scores, verified feedback benchmarks, and real-time audio/latency stability.
- **System Warning (`#FFB800`) & Error (`#FF3B30`):** Precise alerts for pacing issues, filler word spikes, and critical behavioral omissions.
- **Text & Foreground:**
  - Primary: `#F8FAFC` (High-contrast pure technical clarity)
  - Secondary: `#9EA6B0` (Muted slate for labels, metadata, and non-active elements)
  - Ghost: `rgba(248, 250, 252, 0.4)` (Structural rules and inactive states)
- **Borders & Micro-Accents:**
  - Standard Border: `rgba(255, 255, 255, 0.08)`
  - Active/Focus Border: `rgba(0, 240, 255, 0.35)`
  - Luminescent Glow: `0 0 16px rgba(0, 240, 255, 0.15)`

## Typography

The type hierarchy creates deliberate tension between architectural impact, ergonomic readability, and developer instrumentation:

- **Display & Section Headers (`Syne`):** Used with heavy weights (`700` and `800`) to deliver high-impact, geometric structural presence for page milestones, section titles, and interview session states.
- **Interface & Prose (`Inter`):** Renders mock interview transcripts, contextual coaching notes, and narrative guidance with neutral, high-legibility typographic clarity.
- **Telemetry & Technical Indicators (`JetBrains Mono`):** Applied to runtime stats (words per minute, speech cadence, silence duration, answer complexity rating, timestamps, and syntax badges). All caps variants use positive tracking (`0.05em` to `0.08em`) to mimic raw hardware readout displays.

## Layout & Spacing

The layout is built upon an 8pt architectural rhythm, maintaining rigid alignment inspired by terminal splits and operational monitoring desks.

- **Desktop (1200px+):** 12-column dynamic grid with `1.5rem` gutters and `3rem` canvas margins. Dashboard split layouts prioritize a primary session stage (video/code terminal, 8 columns) and a continuous real-time telemetry sidebar (4 columns).
- **Tablet (768px – 1199px):** 8-column grid with `1rem` gutters and `2rem` margins. Side panels dock to secondary tabbed sheets or split vertically beneath the active practice monitor.
- **Mobile (<768px):** 4-column layout with `1rem` gutters and `1rem` screen margins. Metric widgets switch to a horizontal horizontal-scroll or compact metric banner format.
- **Rhythm Rules:** Internal component padding stays tightly scoped (`0.5rem` to `1rem`) to maintain high data density. Structural section spacing uses `space-xl` (`2.5rem`) to create clean, intentional breathing room between panels.

## Elevation & Depth

This design system avoids traditional drop shadows, relying instead on **optical luminance, backdrop translucency, and multi-tier surface bounding**:

- **Ground Level (`#0A0B0D`):** Background layer containing ambient grid or subtle radial cyan gradients (`rgba(0, 240, 255, 0.03)`).
- **Level 1 Panels (`#14181B`):** Enclosed in 1px borders colored `rgba(255, 255, 255, 0.08)`. No cast shadow.
- **Level 2 Modules & Overlays (`#1B2126` with Glassmorphism):** Background `rgba(27, 33, 38, 0.75)` with a backdrop blur of `12px` to `16px`. Outlined with `rgba(255, 255, 255, 0.12)`.
- **Level 3 Active / Focus (Cyan Edge Glow):** Card surfaces gain a 1px border of `rgba(0, 240, 255, 0.4)` and a tight outer glow: `box-shadow: 0 0 20px -3px rgba(0, 240, 255, 0.15)`.
- **Divider Lines:** Technical hairline strokes using `rgba(255, 255, 255, 0.06)`, occasionally terminated with 3px crosshair markers or corner notches.

## Shapes

The shape system prioritizes technical precision:
- **Baseline (`0.25rem` / `rounded-sm`):** Standard for chips, code blocks, input elements, buttons, and telemetry badges. Delivers an industrial, chiseled silhouette.
- **Panels & Shell Containers (`0.5rem` / `rounded-lg`):** Max curvature for major interface windows, camera viewports, and dashboard grid cells.
- **Pill Exception:** Full radius is reserved exclusively for system status indicators (e.g., active recording dots, live connection indicators) and small standalone telemetry badges.

## Components

### Buttons
- **Primary:** Electric cyan background (`#00F0FF`), pure obsidian text (`#0A0B0D`), weight `700`, uppercase tracking. On hover: subtle scale, outer glow `0 0 16px rgba(0, 240, 255, 0.4)`.
- **Secondary (Default):** Surface `#14181B`, border `1px solid rgba(255, 255, 255, 0.1)`, text `#F8FAFC`. On hover: border `rgba(0, 240, 255, 0.5)`, text `#00F0FF`.
- **Ghost/Destructive:** Transparent background, muted text `#9EA6B0`, shifting to `#FF3B30` with `rgba(255, 59, 48, 0.15)` on hover for session termination.

### Telemetry Badges & Chips
- Compact height (`24px`), font `JetBrains Mono` at `11px`, border `1px solid rgba(255, 255, 255, 0.1)`.
- Background `rgba(20, 24, 27, 0.8)`. Prefix contains a pulsing 6px colored dot (e.g., cyan for active listening, green for optimal pacing, amber for filler word warning).

### Input Fields & Monospace Editors
- Fill: `#14181B`. Hairline border `rgba(255, 255, 255, 0.1)`.
- Caret: Electric cyan (`#00F0FF`).
- Focus state: Border transitions to `rgba(0, 240, 255, 0.5)` with micro-glow `0 0 8px rgba(0, 240, 255, 0.2)`. Placeholder text in muted slate (`#9EA6B0`).

### Checkboxes & Radios
- Size: `16px x 16px`. Geometric 2px border radius.
- Inactive: Background `#14181B`, border `rgba(255, 255, 255, 0.2)`.
- Checked: Electric cyan fill with black glyph mark and an accent perimeter stroke.

### AI Feedback & Diagnostic Cards
- Background: Surface elevation 1 (`#14181B`) with 1px border `rgba(255, 255, 255, 0.08)`.
- Header: Houses metric labels in `JetBrains Mono`, uppercase, tracking `0.08em`, slate text color.
- Score Counters: Displayed in large `mono-metric` font size, accompanied by a dynamic progress track that glows according to benchmark thresholds.

### Waveform & Real-Time Audio Telemetry HUD
- Embedded container displaying dynamic voice frequency bands.
- Inactive channels render in `rgba(255, 255, 255, 0.1)`. Active vocal articulation illuminates dynamically in `#00F0FF` with real-time decibel readouts.