# EchoTutor — Mobile-First AI Interview Coach

> **"Don't just prepare. Get better under pressure."**  
> *Your Voice. Your Next Level.*

EchoTutor is an original, mobile-first AI interview coaching web application designed for college students and freshers. It bridges the gap between passive interview reading and real-time verbal performance by immersing candidates in simulated technical and behavioral pressure chambers.

Repository: [https://github.com/ajalsony/-EchoTuto.git](https://github.com/ajalsony/-EchoTuto.git)

---

## 1. Design Direction: "The Echo Chamber"

EchoTutor rejects cookie-cutter AI startup templates, SaaS dashboard sidebars, and generic gradients. It follows an editorial, sound-inspired aesthetic built for focused acoustic preparation.

### Color Palette
- **Obsidian** (`#101211`): Deep void background
- **Carbon** (`#1B201D`): Surfaces, cards, and structured borders (`#28302B`)
- **Signal Lime** (`#B8FF62`): Reserved strictly for primary actions, active indicators, and emitter focus
- **Soft Chalk** (`#E8EAE5`): High-contrast primary reading typography
- **Muted Ash** (`#929991`): Secondary editorial annotations and metadata
- **Alert Coral** (`#FF8277`): Accessible hardware and audio pipeline warnings

### Editorial Typography
- **Headings**: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) — Bold, geometric, expressive
- **Body & Controls**: [Inter](https://fonts.google.com/specimen/Inter) — High-legibility UI typography
- **Technical Metadata**: [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) — Monospaced session tags (`PRACTICE / 001`, `SETUP // 002`)

### Signature Visual Element: The Echo Rings
A custom, vector-based SVG concentric acoustic visualizer (`EchoRings.tsx`) responding to 5 states:
1. **Idle**: Calm, rhythmic respiratory breathing
2. **AI Speaking**: Outward acoustic ripple propagation
3. **User Recording**: Dynamic harmonic oscillations reacting to real microphone amplitude via Web Audio API
4. **Processing**: Precise counter-rotating radar reticles
5. **Error**: Alert Coral pulsation with accessible status readout
- **Accessibility**: Strictly adheres to `prefers-reduced-motion: reduce` by disabling animations automatically.

---

## 2. Completed Milestones

### Milestone 1: The Echo Chamber Entry Experience
- **Mobile-First Layout**: Tested and verified across `360px`, `390px`, `768px`, and `1440px` viewports with 48px+ tap targets.
- **Track Selection**: Toggle between **Technical Interview** (*"Explain. Defend. Solve."*) and **HR & Behavioral** (*"Communicate with clarity."*).
- **Real Web Audio Microphone Diagnostics**:
  - Connects to `navigator.mediaDevices.getUserMedia({ audio: true })`.
  - Attaches `AudioContext` and `AnalyserNode` measuring real-time speech frequencies.
  - Dynamically modulates the Echo Rings based on true decibel volume.
  - Reversible hardware lifecycle: Cleanly calls `track.stop()` on all streams and closes `AudioContext` upon stopping or component unmount.
  - **Zero Audio Storage/Exfiltration**: Audio levels are computed locally in client memory; audio is never recorded, saved, or transmitted to any server.
- **Silent Typed Practice Fallback**:
  - First-class typed mode for students practicing in dorms, quiet libraries, or on devices without audio hardware.
- **Hardware Error Classification**:
  - Catches `NotAllowedError` (denied permission), `NotFoundError` (no mic), `NotReadableError` (mic in use), and unsupported environments with an actionable **"Switch to Typed Mode"** recovery button.
- **State Persistence**: Track and mode preferences persist in `localStorage` across reloads.

### Milestone 2: Interview Setup & Session Calibration
- **Track Carry-Forward**: Carries forward Milestone 1 track selection with instant switching.
- **3-Tier Difficulty Calibration**:
  - **Foundation**: *Build confidence with straightforward questions and supportive follow-ups.* (`CALIBRATION`)
  - **Pressure Cooker**: *Handle challenging questions, explain your reasoning, and respond to follow-up questions.* (`RECOMMENDED`)
  - **Executive / Edge Defense**: *Defend assumptions, handle ambiguity, and respond to challenging scenario-based questions.* (`STRESS TEST`)
- **Specialization Topics & Custom Role Focus**:
  - **Technical**: Python, Data Structures & Algorithms, Computer Networks, Cybersecurity, Web Development, General Technical.
  - **HR & Behavioral**: Self-introduction, Strengths & weaknesses, Teamwork & conflict, Leadership, Problem-solving, General HR.
  - **Custom Focus Field**: Free-form text input allowing targeted specialization (e.g., *"Distributed Systems & Raft Consensus"*).
- **Opt-In Microphone Readiness**: No unexpected mic prompts on setup; testing is purely on-demand.
- **Session Dossier & Tactical Advice**:
  - Summary card displaying Track, Difficulty, Topic, and Mode.
  - Tactical protocols: 3-second pause rule, Context → Action → Result structure, and explicit assumption articulation.
- **Interview Room Placeholder (`ROOM // 003`)**:
  - Transition gate confirming verified configuration in acoustic standby before connecting the AI engine in Milestone 3.

---

## 3. Product Roadmap

- [x] **Milestone 1**: Entry experience, design system, Echo Rings visualizer, real microphone diagnostics, and typed fallback.
- [x] **Milestone 2**: Interview Setup, track switching, 3-tier difficulty calibration, standard & custom topics, and room placeholder.
- [ ] **Milestone 3**: Live Voice Interview & Transcription Pipeline (OpenAI Whisper transcription & speech synthesis).
- [ ] **Milestone 4**: Transcript-based feedback, verbal clarity scores, and constructive critique.
- [ ] **Milestone 5**: Answer comparison, retries, and recurring weakness analytics.

---

## 4. Technology Stack

- **Frontend Core**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) with custom `@theme` tokens
- **Icons**: Lucide React
- **Audio Diagnostics**: Native Web Audio API (`AudioContext`, `AnalyserNode`, `MediaStream`)
- **Storage**: Browser `localStorage` (client-side only)

---

## 5. Getting Started Locally

### Prerequisites
- Node.js `v18.0.0` or later (tested on `v22.13.1`)
- npm `v9.0.0` or later (tested on `10.9.2`)

### Installation & Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ajalsony/-EchoTuto.git
   cd -EchoTuto
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local Vite development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Preview production build:**
   ```bash
   npm run preview
   ```

---

## 6. Project Architecture

```
echotutor/
├── public/
│   ├── favicon.svg               # Custom concentric echo rings branded favicon
│   └── icons.svg
├── src/
│   ├── components/
│   │   ├── EchoRings.tsx          # Reusable SVG concentric rings with 5 visual states
│   │   ├── Header.tsx             # Editorial header with dynamic session codes & back navigation
│   │   ├── Hero.tsx               # Entry hero layout with primary action trigger
│   │   ├── InterviewCard.tsx      # Interactive arena selection cards (Technical / HR)
│   │   ├── InterviewSetup.tsx     # Milestone 2 calibration: difficulty, topics, mode, dossier
│   │   ├── InterviewRoomPlaceholder.tsx # Milestone 2 room placeholder verifying configuration
│   │   └── Footer.tsx             # Editorial footer with core philosophy reminder
│   ├── hooks/
│   │   └── useMicrophoneTest.ts   # Hardware audio pipeline: getUserMedia, AudioContext, track release
│   ├── types/
│   │   └── index.ts               # Shared TypeScript definitions (Track, Difficulty, Mode, Config)
│   ├── App.tsx                    # Screen router ('entry' | 'setup' | 'room') & localStorage sync
│   ├── index.css                  # Tailwind v4 import, custom tokens, and reduced-motion rules
│   ├── main.tsx                   # React DOM root entry
│   └── vite-env.d.ts              # Vite environment declarations
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 7. Philosophy & Core Rule

> **"NO PERFECT ANSWERS REQUIRED. JUST PROGRESS."**

EchoTutor does not pretend to measure emotional aura or pseudoscience. It provides deliberate practice, measured pacing, and objective evaluation under pressure.
