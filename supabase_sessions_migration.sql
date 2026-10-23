-- ==============================================================================
-- EchoTutor® — Interview Sessions & Performance Telemetry Migration
-- Milestone 4: Candidate Session History Schema
-- 
-- Review this migration before running in Supabase Dashboard -> SQL Editor.
-- ==============================================================================

-- 1. Create public.interview_sessions table
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

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id 
  ON public.interview_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_created_at 
  ON public.interview_sessions (user_id, created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (User-Level Access Only)
-- Candidates can view only their own interview sessions
DROP POLICY IF EXISTS "Users can view own interview sessions" ON public.interview_sessions;
CREATE POLICY "Users can view own interview sessions"
  ON public.interview_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Candidates can insert their own interview sessions
DROP POLICY IF EXISTS "Users can insert own interview sessions" ON public.interview_sessions;
CREATE POLICY "Users can insert own interview sessions"
  ON public.interview_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Candidates can update only their own interview sessions
DROP POLICY IF EXISTS "Users can update own interview sessions" ON public.interview_sessions;
CREATE POLICY "Users can update own interview sessions"
  ON public.interview_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Candidates can delete their own interview sessions
DROP POLICY IF EXISTS "Users can delete own interview sessions" ON public.interview_sessions;
CREATE POLICY "Users can delete own interview sessions"
  ON public.interview_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Grant access permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_sessions TO authenticated;
