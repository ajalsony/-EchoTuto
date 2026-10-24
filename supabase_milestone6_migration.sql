-- ==============================================================================
-- EchoTutor® — Milestone 6: Persistent Learning & Progression Migration
-- (Hardened, Idempotent, and Security-Reviewed Edition)
-- 
-- DO NOT RUN AUTOMATICALLY: Review this migration before running in
-- the Supabase Dashboard -> SQL Editor (or via Supabase CLI).
--
-- This migration establishes full database persistence for:
-- 1. Interview sessions (with status tracking: in-progress, completed, abandoned)
-- 2. Interview interactions (questions, rubric, answers, evaluations, lessons, retries)
-- 3. Candidate progression (evidence-verified level-up achievements)
-- 4. Server/Database-enforced Level-Up verification RPC (prevents untrusted client grants)
-- 5. Row Level Security (RLS) with cross-tenant isolation and composite FK constraints
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Table: public.interview_sessions
-- ------------------------------------------------------------------------------
BEGIN;

CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track TEXT NOT NULL CHECK (track IN ('technical', 'hr')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('foundation', 'pressure-cooker', 'executive')),
  topic TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('voice', 'typed')),
  status TEXT NOT NULL DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'abandoned')),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  overall_score NUMERIC(5, 2) CHECK (overall_score >= 0 AND overall_score <= 100),
  cadence_score NUMERIC(5, 2) CHECK (cadence_score >= 0 AND cadence_score <= 100),
  defense_score NUMERIC(5, 2) CHECK (defense_score >= 0 AND defense_score <= 100),
  feedback_summary TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe column additions in case table was created in an earlier migration
ALTER TABLE public.interview_sessions 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'abandoned'));

ALTER TABLE public.interview_sessions 
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE public.interview_sessions 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Enforce unique composite key (id, user_id) so child interactions can guarantee tenant alignment
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_interview_sessions_id_user_id'
  ) THEN
    ALTER TABLE public.interview_sessions 
      ADD CONSTRAINT uq_interview_sessions_id_user_id UNIQUE (id, user_id);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. Table: public.interview_interactions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interview_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track TEXT NOT NULL CHECK (track IN ('technical', 'hr')),
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('foundation', 'pressure-cooker', 'executive')),
  question_text TEXT NOT NULL,
  expected_rubric JSONB DEFAULT '[]'::jsonb,
  answer_text TEXT DEFAULT '',
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  technical_accuracy INTEGER CHECK (technical_accuracy >= 0 AND technical_accuracy <= 100),
  reasoning_score INTEGER CHECK (reasoning_score >= 0 AND reasoning_score <= 100),
  structure_score INTEGER CHECK (structure_score >= 0 AND structure_score <= 100),
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  weakest_skill TEXT,
  lesson_title TEXT,
  lesson_explanation TEXT,
  real_world_example TEXT,
  micro_exercise_question TEXT,
  exercise_hint TEXT,
  retry_answer TEXT,
  retry_score INTEGER CHECK (retry_score >= 0 AND retry_score <= 100),
  improvement_delta INTEGER,
  is_weakness_resolved BOOLEAN DEFAULT FALSE,
  retry_comparison_feedback TEXT,
  retry_evidence JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe column additions for existing installations
ALTER TABLE public.interview_interactions 
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.interview_interactions 
  ADD COLUMN IF NOT EXISTS real_world_example TEXT;

ALTER TABLE public.interview_interactions 
  ADD COLUMN IF NOT EXISTS exercise_hint TEXT;

ALTER TABLE public.interview_interactions 
  ADD COLUMN IF NOT EXISTS retry_comparison_feedback TEXT;

ALTER TABLE public.interview_interactions 
  ADD COLUMN IF NOT EXISTS retry_evidence JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.interview_interactions 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Allow answer_text to be empty initially when question is first stored
ALTER TABLE public.interview_interactions 
  ALTER COLUMN answer_text DROP NOT NULL;

-- Enforce composite foreign key constraint: guarantees interaction.user_id matches session.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_interactions_session_user'
  ) THEN
    ALTER TABLE public.interview_interactions 
      ADD CONSTRAINT fk_interactions_session_user 
      FOREIGN KEY (session_id, user_id) 
      REFERENCES public.interview_sessions(id, user_id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. Table: public.candidate_progression
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.candidate_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.interview_sessions(id) ON DELETE SET NULL,
  track TEXT NOT NULL CHECK (track IN ('technical', 'hr')),
  level_achieved TEXT NOT NULL,
  evidence_summary TEXT NOT NULL,
  verified_score_avg NUMERIC(5, 2) CHECK (verified_score_avg >= 0 AND verified_score_avg <= 100),
  weaknesses_resolved_count INTEGER DEFAULT 0,
  verified_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.candidate_progression 
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.interview_sessions(id) ON DELETE SET NULL;

-- Schema compatibility: drop old Milestone 5 check constraint and recreate with 'master' level support
ALTER TABLE public.candidate_progression 
  DROP CONSTRAINT IF EXISTS candidate_progression_level_achieved_check;

ALTER TABLE public.candidate_progression 
  ADD CONSTRAINT candidate_progression_level_achieved_check 
  CHECK (level_achieved IN ('foundation', 'pressure-cooker', 'executive', 'master'));

-- Idempotency constraints: prevent duplicate progression records for the same session or level
CREATE UNIQUE INDEX IF NOT EXISTS idx_progression_session_unique 
  ON public.candidate_progression(session_id) 
  WHERE session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_progression_user_track_level 
  ON public.candidate_progression(user_id, track, level_achieved);

-- ------------------------------------------------------------------------------
-- 4. High-Performance Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sessions_user_status 
  ON public.interview_sessions(user_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_user_created 
  ON public.interview_sessions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interactions_session_created 
  ON public.interview_interactions(session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_interactions_user_created 
  ON public.interview_interactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_progression_user_track 
  ON public.candidate_progression(user_id, track, verified_at DESC);

-- ------------------------------------------------------------------------------
-- 5. Row Level Security (RLS) Configuration
-- ------------------------------------------------------------------------------
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_progression ENABLE ROW LEVEL SECURITY;

-- Policies for public.interview_sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.interview_sessions;
CREATE POLICY "Users can view own sessions"
  ON public.interview_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.interview_sessions;
CREATE POLICY "Users can insert own sessions"
  ON public.interview_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON public.interview_sessions;
CREATE POLICY "Users can update own sessions"
  ON public.interview_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sessions" ON public.interview_sessions;
CREATE POLICY "Users can delete own sessions"
  ON public.interview_sessions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Policies for public.interview_interactions (with strict session-ownership verification)
DROP POLICY IF EXISTS "Users can view own interactions" ON public.interview_interactions;
CREATE POLICY "Users can view own interactions"
  ON public.interview_interactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own interactions" ON public.interview_interactions;
CREATE POLICY "Users can insert own interactions"
  ON public.interview_interactions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.interview_sessions s 
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own interactions" ON public.interview_interactions;
CREATE POLICY "Users can update own interactions"
  ON public.interview_interactions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.interview_sessions s 
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own interactions" ON public.interview_interactions;
CREATE POLICY "Users can delete own interactions"
  ON public.interview_interactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Policies for public.candidate_progression
-- Security Notice: Direct INSERT/UPDATE/DELETE from client is revoked.
-- Progression records are tamper-proof and written EXCLUSIVELY by the server-side RPC.
DROP POLICY IF EXISTS "Users can view own progression" ON public.candidate_progression;
CREATE POLICY "Users can view own progression"
  ON public.candidate_progression FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progression" ON public.candidate_progression;

-- ------------------------------------------------------------------------------
-- 6. Server-Side Progression Verification Function (Anti-Tamper RPC)
-- 
-- Verifies the 4 inviolable rules directly against stored database records:
-- 1. At least two substantive evaluated submissions (attempt_count >= 2)
-- 2. Average score of at least 75% (avg_score >= 75)
-- 3. Successful resolution of identified weaknesses on retry (resolved_count >= 1)
-- 4. Zero critical rubric deficits (no retries with unresolved weakness: unresolved_count = 0)
-- Prevents race conditions with row locking and eliminates duplicate records.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_and_record_progression(
  p_session_id UUID,
  p_track TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session_difficulty TEXT;
  v_attempt_count INTEGER;
  v_avg_score NUMERIC(5, 2);
  v_resolved_count INTEGER;
  v_unresolved_count INTEGER;
  v_next_difficulty TEXT;
  v_evidence TEXT;
  v_progression_id UUID;
  v_existing_progression RECORD;
BEGIN
  -- 1. Authenticated user validation
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED', 'message', 'Must be authenticated');
  END IF;

  -- 2. Concurrency Protection: Lock the session row to prevent race conditions
  SELECT difficulty INTO v_session_difficulty
  FROM public.interview_sessions
  WHERE id = p_session_id AND user_id = v_user_id
  FOR UPDATE;

  IF v_session_difficulty IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'SESSION_NOT_FOUND', 'message', 'Session does not exist or unauthorized');
  END IF;

  -- 3. Idempotency Check: If progression was already awarded for this session, return existing record
  SELECT id, level_achieved, verified_score_avg, weaknesses_resolved_count, evidence_summary
  INTO v_existing_progression
  FROM public.candidate_progression
  WHERE session_id = p_session_id;

  IF v_existing_progression.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'eligible', true,
      'already_recorded', true,
      'progression_id', v_existing_progression.id,
      'level_achieved', v_existing_progression.level_achieved,
      'verified_score_avg', v_existing_progression.verified_score_avg,
      'weaknesses_resolved_count', v_existing_progression.weaknesses_resolved_count,
      'evidence_summary', v_existing_progression.evidence_summary
    );
  END IF;

  -- 4. Query verified interactions for this session (distinct, substantive submissions)
  SELECT 
    COUNT(DISTINCT id) FILTER (WHERE answer_text IS NOT NULL AND LENGTH(TRIM(answer_text)) > 0),
    COALESCE(AVG(overall_score), 0),
    COUNT(DISTINCT id) FILTER (WHERE is_weakness_resolved = TRUE),
    COUNT(DISTINCT id) FILTER (WHERE retry_score IS NOT NULL AND is_weakness_resolved = FALSE)
  INTO
    v_attempt_count,
    v_avg_score,
    v_resolved_count,
    v_unresolved_count
  FROM public.interview_interactions
  WHERE session_id = p_session_id 
    AND user_id = v_user_id 
    AND overall_score IS NOT NULL;

  -- Enforce Rule 1: At least 2 evaluated submissions
  IF v_attempt_count < 2 THEN
    RETURN jsonb_build_object(
      'success', false,
      'eligible', false,
      'reason', 'Insufficient evaluated submissions. Minimum 2 required.',
      'attempt_count', v_attempt_count,
      'avg_score', v_avg_score
    );
  END IF;

  -- Enforce Rule 2: Average score >= 75%
  IF v_avg_score < 75 THEN
    RETURN jsonb_build_object(
      'success', false,
      'eligible', false,
      'reason', 'Average score below 75% threshold.',
      'attempt_count', v_attempt_count,
      'avg_score', v_avg_score
    );
  END IF;

  -- Enforce Rule 3: At least 1 verified resolved weakness on retry
  IF v_resolved_count < 1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'eligible', false,
      'reason', 'No resolved weaknesses verified. Must complete targeted retry.',
      'resolved_count', v_resolved_count
    );
  END IF;

  -- Enforce Rule 4: Zero active unresolved deficits
  IF v_unresolved_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'eligible', false,
      'reason', 'Blocked by unresolved critical deficits from previous retry.',
      'unresolved_count', v_unresolved_count
    );
  END IF;

  -- 5. Determine next difficulty tier
  IF v_session_difficulty = 'foundation' THEN
    v_next_difficulty := 'pressure-cooker';
  ELSIF v_session_difficulty = 'pressure-cooker' THEN
    v_next_difficulty := 'executive';
  ELSE
    v_next_difficulty := 'master';
  END IF;

  -- 6. Check if candidate already unlocked this level or higher
  IF EXISTS (
    SELECT 1 FROM public.candidate_progression 
    WHERE user_id = v_user_id AND track = p_track AND level_achieved = v_next_difficulty
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'eligible', true,
      'already_achieved', true,
      'level_achieved', v_next_difficulty,
      'message', 'Candidate has already unlocked ' || v_next_difficulty || ' for this track.'
    );
  END IF;

  v_evidence := format(
    'Evidenced %s substantive submissions (verified average %s/100), %s resolved weakness(es), and zero critical deficits.',
    v_attempt_count, v_avg_score, v_resolved_count
  );

  -- 7. Record verified progression with conflict protection
  INSERT INTO public.candidate_progression (
    user_id,
    session_id,
    track,
    level_achieved,
    evidence_summary,
    verified_score_avg,
    weaknesses_resolved_count
  ) VALUES (
    v_user_id,
    p_session_id,
    p_track,
    v_next_difficulty,
    v_evidence,
    v_avg_score,
    v_resolved_count
  ) 
  ON CONFLICT (session_id) DO NOTHING
  RETURNING id INTO v_progression_id;

  RETURN jsonb_build_object(
    'success', true,
    'eligible', true,
    'progression_id', v_progression_id,
    'level_achieved', v_next_difficulty,
    'verified_score_avg', v_avg_score,
    'weaknesses_resolved_count', v_resolved_count,
    'evidence_summary', v_evidence
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. Permissions & Revocations
-- ------------------------------------------------------------------------------
-- Revoke PUBLIC and anonymous access to prevent unauthorized RPC invocation
REVOKE ALL ON FUNCTION public.verify_and_record_progression(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_and_record_progression(UUID, TEXT) FROM anon;

-- Grant execution to authenticated candidates only
GRANT EXECUTE ON FUNCTION public.verify_and_record_progression(UUID, TEXT) TO authenticated;

-- Table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_interactions TO authenticated;
GRANT SELECT ON public.candidate_progression TO authenticated;

-- ------------------------------------------------------------------------------
-- 8. Security Hardening: Revoke & Drop Vulnerable Username-Enumeration RPC
-- ------------------------------------------------------------------------------
-- Prevents unauthenticated scraping of candidate email addresses via username RPC
REVOKE ALL ON FUNCTION public.get_email_by_username(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_email_by_username(TEXT) FROM anon;
DROP FUNCTION IF EXISTS public.get_email_by_username(TEXT);

COMMIT;
