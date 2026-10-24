# EchoTutor® — Industrial AI Interview Studio

> **"Don't just prepare. Get better under pressure."**  
> *Your Voice. Your Next Level.*

EchoTutor is an industrial-grade, voice-first AI interview coaching web application designed to train software engineers and professionals for technical and behavioral interviews. Built with the **Stitch Obsidian & Cyan** design system, it bridges the gap between passive reading and real-time verbal performance through rigorous AI evaluation, targeted weakness remediation, and tamper-resistant progression tracking.

Repository: [https://github.com/ajalsony/-EchoTuto.git](https://github.com/ajalsony/-EchoTuto.git)  
Active Branch: `feature/stitch-interview-studio`

---

## 1. Key Capabilities & Workflow

```
[ Assess ] ────────► [ Diagnose ] ────────► [ Teach ] ────────► [ Verify ]
Question Prompt       AI Rubric Engine      Fix My Weakness      Side-by-Side Retry
Speech/IDE Answer     Score Gauge (0-100)   Micro-Exercise       Progression Gate
```

### A. Voice-First Interview Studio
- **Dual-Input Workspace**:
  - **Voice Mode**: Real-time browser speech recognition (Web Speech API) with live audio meters, continuous transcription, manual editing, and zero accidental submissions.
  - **Silent Typed Mode**: High-fidelity terminal IDE (`Architecture_Defense.md`) with line counter, auto-save status, and live telemetry for library or quiet environments.
- **Natural AI Speech Synthesis**: Browser-native text-to-speech engine with natural pacing, speaker visualizer pulse, voice selection, and Speak / Replay / Stop controls.
- **Compact Header Console**: Fixed `h-16` bar with live session stopwatch, difficulty badge, acoustic sensor calibration, and safe exit actions that preserve in-progress state.

### B. Accurate AI Evaluation Engine
- **Multi-Dimensional Scoring**: Evaluates submissions across 5 weighted dimensions:
  1. *Factual Correctness* (30%)
  2. *Concept Coverage* (25%)
  3. *Reasoning Depth & Trade-offs* (25%)
  4. *Practical Defense* (10%)
  5. *Structure & Communication Clarity* (10%)
- **Zero-Hallucination Policy**: Evaluated strictly via server-side AI (Gemini / OpenAI) with deterministic validation. No fake scores or invented feedback.
- **Adversarial & Injection Defense**: Built-in prompt injection filters penalize bypass attempts to 0% and enforce evaluation integrity.
- **Diagnostic Score HUD**: Radial SVG circular score gauge (`overallScore / 100`), Senior Bar Verdict comparison, and evidence-based strength and weakness audit trails.

### C. Fix My Weakness & Retry Comparison
- **Targeted Remediation**: When a candidate displays a deficit, the AI generates a customized lesson:
  - *Missing Concept Explanation*: Underlying mechanics and theoretical rationale.
  - *Standard of Excellence*: Senior-level production code or architectural pattern.
  - *Targeted Practice Exercise*: Focused micro-challenge testing the exact deficit.
- **Side-by-Side Retry Delta**: Compares original and revised answers side-by-side with score delta tracking (`+X`).
- **Strict Verification Gate**: A weakness is marked resolved (`isWeaknessResolved: true`) only when the candidate demonstrates verified evidence and scores $\ge 75\%$.

### D. Difficulty Limits & Question Calibration
- **Exact Question Limits**:
  - **Foundation (Easy)**: Exactly 5 questions
  - **Pressure-Cooker (Medium)**: Exactly 8 questions
  - **Executive (Hard)**: Exactly 10 questions
- **Remediation Retries**: Remediation retries do **not** increment question counts.
- **Concise AI Prompts**: AI generates single, focused questions matching strict word target guidelines (8–20 words for Easy, 12–25 for Medium, 15–30 for Hard).

### E. Candidate Dashboard & Level-Up Progression
- **Interactive Skill Radar**: SVG radar chart visualizing dimension mastery.
- **Session Telemetry**: Track completion rates, average rigor, and verified resolved weaknesses.
- **Tamper-Resistant Level-Up**: Candidates advance tiers only after satisfying 4 verified criteria:
  1. $\ge 2$ substantive evaluated attempts
  2. $\ge 75\%$ verified average score
  3. $\ge 1$ successfully resolved weakness
  4. Zero active unresolved deficits

---

## 2. Design System: Stitch Obsidian & Cyan

EchoTutor follows the **Stitch Industrial Obsidian** aesthetic inspired by high-reliability terminal telemetries and aerospace consoles:

| Token | Hex Value | Application |
| :--- | :--- | :--- |
| **Obsidian** | `#0A0B0D` | Deep void app background |
| **Surface** | `#14181B` | Primary cards, panels, and terminal backgrounds |
| **Elevated** | `#1B2126` | Hover states, active buttons, and toolbars |
| **Primary Accent** | `#00F0FF` | Cyan highlights, telemetry meters, and key CTA actions |
| **Success** | `#00FF85` | Verified pass states, delta gains, and resolved tags |
| **Warning** | `#FFB800` | Calibration notices, in-progress states, and alerts |
| **Error / Destructive** | `#FF3B30` | Hardware faults, deficits, and exit triggers |

- **Typography**:
  - *Headlines & Badges*: **Syne** (`font-syne`)
  - *Body & UI Controls*: **Inter** (`font-inter`)
  - *Technical Telemetry & Code*: **JetBrains Mono** (`font-mono`)
- **Visual Features**: Ambient WebGL shader background (`StitchShaderBackground.tsx`), subtle cyan glow borders, and reduced-motion compliance.

---

## 3. Technology Stack

- **Frontend Core**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) with custom theme tokens
- **Icons**: Lucide React
- **Audio & Speech**:
  - Web Audio API (`AudioContext`, `AnalyserNode`) for microphone calibration
  - Web Speech API (`SpeechRecognition`, `speechSynthesis`)
- **Backend / AI Proxy**: Express.js server running Gemini (`gemini-3.5-flash-lite`) and OpenAI (`gpt-4o-mini`) adapters with deterministic rubric validation
- **Database & Auth**: Supabase PostgreSQL with Row-Level Security (RLS) and server-side RPC validation
- **Build & Quality**: TypeScript (`tsc --noEmit`), Vite Rollup bundle, Node test runner

---

## 4. Project Structure

```
Echotutor/
├── scripts/                              # Automated verification test suites
│   ├── test_milestone5.mjs               # AI status, providers, and qualification logic
│   ├── test_milestone6.mjs               # Persistence, restoration, and RLS security
│   ├── test_milestone8.mjs               # Difficulty lengths (5/8/10) and boundary clamping
│   ├── test_evaluation_accuracy.mjs      # 13 deterministic evaluation cases + prompt injection
│   ├── test_voice_speech.mjs             # Mic test, speech synthesis, and recognition
│   ├── test_live_engine.mjs              # End-to-end live AI API endpoint suite
│   └── test_unresolved_retry.mjs         # Live negative retry verification test
├── server/                               # Backend AI server proxy
│   ├── aiService.js                      # Multi-provider AI interface (Gemini / OpenAI)
│   ├── aiRouter.js                       # Express REST router for AI requests
│   ├── evaluationRubric.js               # Domain rubrics, keywords, and weight profiles
│   └── evaluationValidator.js            # Deterministic heuristic score validator
├── src/
│   ├── components/
│   │   ├── auth/                         # Authentication screens (Login, Register, Reset)
│   │   ├── dashboard/                    # Candidate dashboard, sidebar, radar chart, modals
│   │   ├── interview/                    # Interview Studio
│   │   │   ├── InterviewStudio.tsx       # Core Stitch Studio orchestrator
│   │   │   ├── QuestionVoiceSpeaker.tsx  # Browser speech synthesis component
│   │   │   └── VoiceSpeechConsole.tsx    # Live microphone speech-to-text console
│   │   ├── landing/                      # Public Stitch landing page
│   │   ├── ui/                           # WebGL shader backgrounds and ambient lights
│   │   ├── Header.tsx                    # Shared daemon header
│   │   └── InterviewSetup.tsx            # Topic, difficulty, and mode calibration
│   ├── context/
│   │   └── AuthContext.tsx               # Supabase authentication provider
│   ├── hooks/
│   │   ├── useMicrophoneTest.ts          # Web Audio API mic test hook
│   │   ├── useSpeechRecognition.ts       # Speech-to-text recognition hook
│   │   └── useSpeechSynthesis.ts         # Text-to-speech synthesis hook
│   ├── lib/
│   │   ├── aiClient.ts                   # Frontend API client for AI server
│   │   ├── interviewPersistence.ts       # Supabase data layer with offline memory fallback
│   │   └── supabase.ts                   # Supabase client initialization
│   ├── types/
│   │   └── index.ts                      # Shared TypeScript definitions
│   ├── App.tsx                           # Main application router
│   ├── index.css                         # Stitch design tokens & utility classes
│   └── main.tsx                          # React entry root
├── supabase_milestone6_migration.sql     # Database schema & progression RPC function
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 5. Getting Started Locally

### Prerequisites
- Node.js `v18.0.0` or later (tested on `v22.13.1`)
- npm `v9.0.0` or later

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ajalsony/-EchoTuto.git
   cd -EchoTuto
   git checkout feature/stitch-interview-studio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (`.env.local`):**
   Create a `.env.local` file in the project root:
   ```env
   # Server-side AI Provider (Do NOT prefix with VITE_)
   GEMINI_API_KEY=your_gemini_api_key_here
   # Or OpenAI:
   # OPENAI_API_KEY=your_openai_api_key_here

   # Client-side Supabase Configuration (Optional for persistence)
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser. (The Vite dev proxy automatically routes `/api/ai/*` requests to the internal AI server).

---

## 6. Running Verification Test Suites

EchoTutor includes complete automated regression and unit test suites:

```bash
# 1. Typecheck & production build
npm run build

# 2. AI provider detection, router, and Level-Up logic (21 tests)
node scripts/test_milestone5.mjs

# 3. Persistence, page reload restoration, and RLS security (54 tests)
node scripts/test_milestone6.mjs

# 4. Evaluation accuracy, prompt injection defense, and retry scoring (37 tests)
node scripts/test_evaluation_accuracy.mjs

# 5. Microphone calibration and speech recognition/synthesis (19 tests)
node scripts/test_voice_speech.mjs

# 6. Difficulty lengths (5/8/10), progress telemetry, and boundary clamping (95 tests)
node scripts/test_milestone8.mjs
```

---

## 7. Security & Architecture Principles

- **Zero Client-Side AI Keys**: API keys are strictly confined to the Node.js server environment; never exposed in client bundles or `VITE_` variables.
- **Row-Level Security (RLS)**: Candidate sessions, rubrics, and answers are isolated by `auth.uid()`. Cross-user inspection or mutation attempts fail at the database engine level.
- **Server-Side Progression Gating**: Direct client writes to `candidate_progression` are blocked by RLS. Promotions require calling the cryptographic `verify_candidate_progression()` stored procedure.
- **Microphone Privacy**: Audio levels and microphone streams are evaluated entirely inside client memory via Web Audio `AnalyserNode`. Raw audio is **never** recorded or transmitted to any server.

---

## 8. License

Designed and developed for **EchoTutor®**. All rights reserved.
