-- ==============================================================================
-- EchoTutor® — Milestone 5: AI Tutor & Weakness-Solving Engine Schema
-- 
-- DO NOT RUN AUTOMATICALLY: Review this migration before running in 
-- the Supabase Dashboard -> SQL Editor (or via Supabase CLI).
-- ==============================================================================

-- 1. Ensure public.interview_sessions table exists
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track TEXT NOT NULL CHECK (track IN ('technical', 'hr')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('foundation', 'pressure-cooker', 'executive')),
  topic TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('voice', 'typed')),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  overall_score NUMERIC(5, 2) CHECK (overall_score >= 0 AND overall_score <= 100),
  cadence_score NUMERIC(5, 2) CHECK (cadence_score >= 0 AND cadence_score <= 100),
  defense_score NUMERIC(5, 2) CHECK (defense_score >= 0 AND defense_score <= 100),
  feedback_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create public.interview_interactions table (Question -> Answer -> Weakness -> Lesson -> Retry)
CREATE TABLE IF NOT EXISTS public.interview_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track TEXT NOT NULL CHECK (track IN ('technical', 'hr')),
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('foundation', 'pressure-cooker', 'executive')),
  question_text TEXT NOT NULL,
  expected_rubric JSONB DEFAULT '[]'::jsonb,
  answer_text TEXT NOT NULL,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  technical_accuracy INTEGER CHECK (technical_accuracy >= 0 AND technical_accuracy <= 100),
  reasoning_score INTEGER CHECK (reasoning_score >= 0 AND reasoning_score <= 100),
  structure_score INTEGER CHECK (structure_score >= 0 AND structure_score <= 100),
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  weakest_skill TEXT,
  lesson_title TEXT,
  lesson_explanation TEXT,
  micro_exercise_question TEXT,
  retry_answer TEXT,
  retry_score INTEGER CHECK (retry_score >= 0 AND retry_score <= 100),
  improvement_delta INTEGER,
  is_weakness_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create public.candidate_progression table (Evidence-based Level-Up Achievements)
CREATE TABLE IF NOT EXISTS public.candidate_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track TEXT NOT NULL CHECK (track IN ('technical', 'hr')),
  level_achieved TEXT NOT NULL CHECK (level_achieved IN ('foundation', 'pressure-cooker', 'executive')),
  evidence_summary TEXT NOT NULL,
  verified_score_avg NUMERIC(5, 2) CHECK (verified_score_avg >= 0 AND verified_score_avg <= 100),
  weaknesses_resolved_count INTEGER DEFAULT 0,
  verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interview_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_session_id ON public.interview_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_progression_user_id ON public.candidate_progression(user_id);

-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_progression ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: Candidates can access only their own data
DROP POLICY IF EXISTS "Users can view own sessions" ON public.interview_sessions;
CREATE POLICY "Users can view own sessions"
  ON public.interview_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.interview_sessions;
CREATE POLICY "Users can insert own sessions"
  ON public.interview_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own interactions" ON public.interview_interactions;
CREATE POLICY "Users can view own interactions"
  ON public.interview_interactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own interactions" ON public.interview_interactions;
CREATE POLICY "Users can insert own interactions"
  ON public.interview_interactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own progression" ON public.candidate_progression;
CREATE POLICY "Users can view own progression"
  ON public.candidate_progression FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progression" ON public.candidate_progression;
CREATE POLICY "Users can insert own progression"
  ON public.candidate_progression FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 7. Grant access permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_interactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_progression TO authenticated;
