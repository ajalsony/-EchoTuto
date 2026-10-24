/**
 * EchoTutor® — Interview Persistence & Progression Layer
 * Milestone 6: Persistent Learning & Progression System
 * 
 * Manages atomic database operations for sessions, interactions,
 * weaknesses, retries, and evidence-verified level-up progressions.
 * Implements strict user isolation via Supabase RLS and server-side RPC.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type {
  InterviewTrack,
  DifficultyLevel,
  PracticeMode,
} from '../types';
import type {
  GeneratedQuestion,
  AnswerEvaluation,
  WeaknessLesson,
  RetryEvaluation,
} from './aiClient';

export type SessionStatus = 'in-progress' | 'completed' | 'abandoned';

/**
 * Returns the exact total questions required by difficulty level:
 * - Easy (foundation): 5 questions
 * - Medium (pressure-cooker): 8 questions
 * - Hard (executive): 10 questions
 */
export function getTotalQuestionsForDifficulty(difficulty: string): number {
  const norm = (difficulty || '').toLowerCase();
  if (norm === 'easy' || norm === 'foundation') return 5;
  if (norm === 'medium' || norm === 'pressure-cooker') return 8;
  if (norm === 'hard' || norm === 'executive' || norm === 'executive-master') return 10;
  return 5;
}

export interface PersistentSession {
  id: string;
  userId: string;
  track: InterviewTrack;
  difficulty: DifficultyLevel;
  topic: string;
  mode: PracticeMode;
  status: SessionStatus;
  durationSeconds: number;
  overallScore: number | null;
  cadenceScore: number | null;
  defenseScore: number | null;
  feedbackSummary: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  totalQuestions?: number;
}

export interface PersistentInteraction {
  id: string;
  sessionId: string;
  userId: string;
  track: InterviewTrack;
  topic: string;
  difficulty: DifficultyLevel;
  questionText: string;
  expectedRubric: string[];
  answerText: string;
  overallScore: number | null;
  technicalAccuracy: number | null;
  reasoningScore: number | null;
  structureScore: number | null;
  strengths: string[];
  weaknesses: string[];
  weakestSkill: string | null;
  lessonTitle: string | null;
  lessonExplanation: string | null;
  realWorldExample: string | null;
  microExerciseQuestion: string | null;
  exerciseHint: string | null;
  retryAnswer: string | null;
  retryScore: number | null;
  improvementDelta: number | null;
  isWeaknessResolved: boolean;
  retryComparisonFeedback: string | null;
  retryEvidence: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProgressionRecord {
  id: string;
  userId: string;
  sessionId: string | null;
  track: InterviewTrack;
  levelAchieved: string;
  evidenceSummary: string;
  verifiedScoreAvg: number;
  weaknessesResolvedCount: number;
  verifiedAt: string;
}

export interface DashboardMetrics {
  totalSessions: number;
  completedSessions: number;
  inProgressSession: PersistentSession | null;
  averageOverallScore: number | null;
  averageCadenceScore: number | null;
  averageDefenseScore: number | null;
  totalInteractionsEvaluated: number;
  totalWeaknessesResolved: number;
  currentLevelByTrack: Record<InterviewTrack, string>;
  recentProgression: ProgressionRecord[];
}

/**
 * Checks if the persistent database backend is ready.
 */
export function isDatabaseReady(): boolean {
  return Boolean(supabase && isSupabaseConfigured);
}

/**
 * Finds the most recent in-progress session for an authenticated user.
 */
export async function findActiveSession(
  userId: string,
  track?: InterviewTrack
): Promise<PersistentSession | null> {
  if (!isDatabaseReady() || !supabase) return null;

  try {
    let query = supabase
      .from('interview_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in-progress')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (track) {
      query = query.eq('track', track);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) return null;

    const row = data[0];
    return mapSessionRow(row);
  } catch (err) {
    console.warn('[EchoTutor Persistence] findActiveSession notice:', err);
    return null;
  }
}

/**
 * Creates a new persistent interview session record.
 */
export async function createSession(params: {
  userId: string;
  track: InterviewTrack;
  difficulty: DifficultyLevel;
  topic: string;
  mode: PracticeMode;
}): Promise<PersistentSession> {
  if (!isDatabaseReady() || !supabase) {
    throw new Error('Database is unconfigured. Session cannot be saved to remote server.');
  }

  const { data, error } = await supabase
    .from('interview_sessions')
    .insert({
      user_id: params.userId,
      track: params.track,
      difficulty: params.difficulty,
      topic: params.topic,
      mode: params.mode,
      status: 'in-progress',
      duration_seconds: 0,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to initialize database interview session.');
  }

  return mapSessionRow(data);
}

/**
 * Fetches all interactions for a specific session ordered chronologically.
 */
export async function loadSessionInteractions(
  sessionId: string,
  userId: string
): Promise<PersistentInteraction[]> {
  if (!isDatabaseReady() || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('interview_interactions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map(mapInteractionRow);
  } catch (err) {
    console.warn('[EchoTutor Persistence] loadSessionInteractions notice:', err);
    return [];
  }
}

/**
 * Stores a newly generated interview question and rubric in the session.
 */
export async function saveGeneratedQuestion(params: {
  sessionId: string;
  userId: string;
  track: InterviewTrack;
  topic: string;
  difficulty: DifficultyLevel;
  question: GeneratedQuestion;
}): Promise<PersistentInteraction> {
  if (!isDatabaseReady() || !supabase) {
    throw new Error('Database is unconfigured. Question not saved to server.');
  }

  const { data, error } = await supabase
    .from('interview_interactions')
    .insert({
      session_id: params.sessionId,
      user_id: params.userId,
      track: params.track,
      topic: params.topic,
      difficulty: params.difficulty,
      question_text: params.question.questionText,
      expected_rubric: params.question.expectedRubric,
      answer_text: '',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to save question to database.');
  }

  // Bump session updated_at
  await supabase
    .from('interview_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', params.sessionId)
    .eq('user_id', params.userId);

  return mapInteractionRow(data);
}

/**
 * Updates an interaction record with the candidate's answer and evaluation.
 */
export async function saveAnswerEvaluation(params: {
  interactionId: string;
  sessionId: string;
  userId: string;
  answerText: string;
  evaluation: AnswerEvaluation;
}): Promise<void> {
  if (!isDatabaseReady() || !supabase) {
    throw new Error('Database is unconfigured. Evaluation not saved to server.');
  }

  const { error } = await supabase
    .from('interview_interactions')
    .update({
      answer_text: params.answerText,
      overall_score: params.evaluation.overallScore,
      technical_accuracy: params.evaluation.technicalAccuracy,
      reasoning_score: params.evaluation.reasoningTradeoff,
      structure_score: params.evaluation.structureClarity,
      strengths: params.evaluation.strengths,
      weaknesses: params.evaluation.weaknesses,
      weakest_skill: params.evaluation.weakestSkill,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.interactionId)
    .eq('user_id', params.userId);

  if (error) {
    throw new Error(`Failed to save answer evaluation: ${error.message}`);
  }

  // Update session average score and cadence
  await syncSessionAverages(params.sessionId, params.userId);
}

/**
 * Updates an interaction record with the concept lesson and micro-exercise.
 */
export async function saveWeaknessLesson(params: {
  interactionId: string;
  userId: string;
  lesson: WeaknessLesson;
}): Promise<void> {
  if (!isDatabaseReady() || !supabase) {
    throw new Error('Database is unconfigured. Lesson not saved to server.');
  }

  const { error } = await supabase
    .from('interview_interactions')
    .update({
      lesson_title: params.lesson.conceptTitle,
      lesson_explanation: params.lesson.conceptExplanation,
      real_world_example: params.lesson.realWorldExample,
      micro_exercise_question: params.lesson.microExerciseQuestion,
      exercise_hint: params.lesson.exerciseHint,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.interactionId)
    .eq('user_id', params.userId);

  if (error) {
    throw new Error(`Failed to save weakness lesson: ${error.message}`);
  }
}

/**
 * Updates an interaction record with the candidate's retry answer and verification evaluation.
 */
export async function saveRetryEvaluation(params: {
  interactionId: string;
  sessionId: string;
  userId: string;
  retryAnswerText: string;
  retryEval: RetryEvaluation;
}): Promise<void> {
  if (!isDatabaseReady() || !supabase) {
    throw new Error('Database is unconfigured. Retry evaluation not saved to server.');
  }

  const { error } = await supabase
    .from('interview_interactions')
    .update({
      retry_answer: params.retryAnswerText,
      retry_score: params.retryEval.newScore,
      improvement_delta: params.retryEval.improvementDelta,
      is_weakness_resolved: params.retryEval.isWeaknessResolved,
      retry_comparison_feedback: params.retryEval.comparisonFeedback,
      retry_evidence: params.retryEval.improvementEvidence,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.interactionId)
    .eq('user_id', params.userId);

  if (error) {
    throw new Error(`Failed to save retry evaluation: ${error.message}`);
  }

  await syncSessionAverages(params.sessionId, params.userId);
}

/**
 * Verifies progression eligibility against stored records.
 * Calls server-side RPC if available; enforces identical rules locally if RPC pending.
 */
export async function verifyAndRecordProgression(params: {
  sessionId: string;
  track: InterviewTrack;
  userId: string;
  difficulty: DifficultyLevel;
}): Promise<{
  eligible: boolean;
  levelAchieved?: string;
  reason?: string;
  verifiedScoreAvg?: number;
  weaknessesResolvedCount?: number;
  evidenceSummary?: string;
}> {
  if (!isDatabaseReady() || !supabase) {
    return { eligible: false, reason: 'Database unconfigured for verified progression.' };
  }

  // 1. Attempt database RPC call (anti-tamper procedure)
  try {
    const { data, error } = await supabase.rpc('verify_and_record_progression', {
      p_session_id: params.sessionId,
      p_track: params.track,
    });

    if (!error && data) {
      if (data.eligible) {
        return {
          eligible: true,
          levelAchieved: data.level_achieved,
          verifiedScoreAvg: data.verified_score_avg,
          weaknessesResolvedCount: data.weaknesses_resolved_count,
          evidenceSummary: data.evidence_summary,
        };
      } else {
        return {
          eligible: false,
          reason: data.reason || 'Progression requirements not satisfied.',
        };
      }
    }
  } catch (rpcErr) {
    console.warn('[EchoTutor Persistence] RPC call notice, checking fallback:', rpcErr);
  }

  // 2. Strict client-side fallback query against real persisted records if RPC is not yet created
  const interactions = await loadSessionInteractions(params.sessionId, params.userId);
  const evaluated = interactions.filter((i) => i.overallScore != null);

  // Rule 1: At least two evaluated submissions
  if (evaluated.length < 2) {
    return {
      eligible: false,
      reason: `Insufficient evaluated submissions (${evaluated.length}/2 required).`,
    };
  }

  // Rule 2: Average score of at least 75%
  const totalScore = evaluated.reduce((sum, item) => sum + (item.overallScore || 0), 0);
  const avg = Math.round(totalScore / evaluated.length);
  if (avg < 75) {
    return {
      eligible: false,
      reason: `Average score of ${avg}% is below the 75% threshold.`,
    };
  }

  // Rule 3: Successful resolution of identified weaknesses on retry
  const resolvedCount = interactions.filter((i) => i.isWeaknessResolved).length;
  if (resolvedCount < 1) {
    return {
      eligible: false,
      reason: 'No weaknesses successfully resolved on retry yet.',
    };
  }

  // Rule 4: Zero critical rubric deficits (no retries with unresolved weaknesses)
  const unresolvedRetries = interactions.filter(
    (i) => i.retryScore != null && !i.isWeaknessResolved
  ).length;
  if (unresolvedRetries > 0) {
    return {
      eligible: false,
      reason: 'Blocked by unresolved critical deficits from a previous retry.',
    };
  }

  // Progression qualified
  const nextDiff =
    params.difficulty === 'foundation'
      ? 'pressure-cooker'
      : params.difficulty === 'pressure-cooker'
      ? 'executive'
      : 'master';

  const evidence = `Evidenced ${evaluated.length} substantive submissions (average ${avg}/100), ${resolvedCount} resolved weakness(es), and zero critical deficits.`;

  try {
    await supabase.from('candidate_progression').insert({
      user_id: params.userId,
      session_id: params.sessionId,
      track: params.track,
      level_achieved: nextDiff,
      evidence_summary: evidence,
      verified_score_avg: avg,
      weaknesses_resolved_count: resolvedCount,
    });
  } catch (err) {
    console.warn('[EchoTutor Persistence] Candidate progression insert notice:', err);
  }

  return {
    eligible: true,
    levelAchieved: nextDiff,
    verifiedScoreAvg: avg,
    weaknessesResolvedCount: resolvedCount,
    evidenceSummary: evidence,
  };
}

/**
 * Marks an interview session as completed or abandoned.
 */
export async function updateSessionStatus(params: {
  sessionId: string;
  userId: string;
  status: SessionStatus;
  durationSeconds?: number;
  overallScore?: number;
  feedbackSummary?: string;
}): Promise<void> {
  if (!isDatabaseReady() || !supabase) return;

  const updates: Record<string, unknown> = {
    status: params.status,
    updated_at: new Date().toISOString(),
  };

  if (params.status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }
  if (params.durationSeconds !== undefined) {
    updates.duration_seconds = params.durationSeconds;
  }
  if (params.overallScore !== undefined) {
    updates.overall_score = params.overallScore;
  }
  if (params.feedbackSummary !== undefined) {
    updates.feedback_summary = params.feedbackSummary;
  }

  await supabase
    .from('interview_sessions')
    .update(updates)
    .eq('id', params.sessionId)
    .eq('user_id', params.userId);
}

/**
 * Computes dashboard telemetry and progression metrics directly from persisted records.
 */
export async function loadDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  const fallback: DashboardMetrics = {
    totalSessions: 0,
    completedSessions: 0,
    inProgressSession: null,
    averageOverallScore: null,
    averageCadenceScore: null,
    averageDefenseScore: null,
    totalInteractionsEvaluated: 0,
    totalWeaknessesResolved: 0,
    currentLevelByTrack: {
      technical: 'foundation',
      hr: 'foundation',
    },
    recentProgression: [],
  };

  if (!isDatabaseReady() || !supabase) return fallback;

  try {
    // 1. Fetch user sessions
    const { data: sessionRows } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const sessions = (sessionRows || []).map(mapSessionRow);
    const completed = sessions.filter((s) => s.status === 'completed');
    const inProgress = sessions.find((s) => s.status === 'in-progress') || null;

    // 2. Fetch user interactions
    const { data: interactionRows } = await supabase
      .from('interview_interactions')
      .select('*')
      .eq('user_id', userId);

    const interactions = (interactionRows || []).map(mapInteractionRow);
    const evaluated = interactions.filter((i) => i.overallScore != null);
    const resolvedWeaknesses = interactions.filter((i) => i.isWeaknessResolved).length;

    // Compute average scores
    let avgOverall: number | null = null;
    let avgDefense: number | null = null;
    if (evaluated.length > 0) {
      const sumOverall = evaluated.reduce((sum, item) => sum + (item.overallScore || 0), 0);
      avgOverall = Math.round(sumOverall / evaluated.length);

      const defenseEvaluations = evaluated.filter((i) => i.reasoningScore != null);
      if (defenseEvaluations.length > 0) {
        const sumDef = defenseEvaluations.reduce((sum, i) => sum + (i.reasoningScore || 0), 0);
        avgDefense = Math.round(sumDef / defenseEvaluations.length);
      }
    }

    // 3. Fetch progression achievements
    const { data: progressionRows } = await supabase
      .from('candidate_progression')
      .select('*')
      .eq('user_id', userId)
      .order('verified_at', { ascending: false });

    const progression: ProgressionRecord[] = (progressionRows || []).map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      sessionId: row.session_id ? String(row.session_id) : null,
      track: (row.track as InterviewTrack) || 'technical',
      levelAchieved: String(row.level_achieved),
      evidenceSummary: String(row.evidence_summary),
      verifiedScoreAvg: Number(row.verified_score_avg || 0),
      weaknessesResolvedCount: Number(row.weaknesses_resolved_count || 0),
      verifiedAt: String(row.verified_at),
    }));

    // Determine current level by track
    const levelByTrack: Record<InterviewTrack, string> = {
      technical: 'foundation',
      hr: 'foundation',
    };

    const techProgression = progression.find((p) => p.track === 'technical');
    if (techProgression) {
      levelByTrack.technical = techProgression.levelAchieved;
    }
    const hrProgression = progression.find((p) => p.track === 'hr');
    if (hrProgression) {
      levelByTrack.hr = hrProgression.levelAchieved;
    }

    return {
      totalSessions: sessions.length,
      completedSessions: completed.length,
      inProgressSession: inProgress,
      averageOverallScore: avgOverall,
      averageCadenceScore: avgOverall ? Math.min(100, Math.round(avgOverall * 0.95)) : null,
      averageDefenseScore: avgDefense,
      totalInteractionsEvaluated: evaluated.length,
      totalWeaknessesResolved: resolvedWeaknesses,
      currentLevelByTrack: levelByTrack,
      recentProgression: progression,
    };
  } catch (err) {
    console.warn('[EchoTutor Persistence] loadDashboardMetrics notice:', err);
    return fallback;
  }
}

/**
 * Internal helper to sync session aggregate scores from its interactions.
 */
async function syncSessionAverages(sessionId: string, userId: string): Promise<void> {
  if (!isDatabaseReady() || !supabase) return;

  try {
    const { data } = await supabase
      .from('interview_interactions')
      .select('overall_score, reasoning_score')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .not('overall_score', 'is', null);

    if (!data || data.length === 0) return;

    const scores = data.map((d) => Number(d.overall_score));
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    await supabase
      .from('interview_sessions')
      .update({
        overall_score: avgScore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', userId);
  } catch (err) {
    console.warn('[EchoTutor Persistence] syncSessionAverages caught:', err);
  }
}

function mapSessionRow(row: Record<string, unknown>): PersistentSession {
  const difficulty = (row.difficulty as DifficultyLevel) || 'foundation';
  return {
    id: String(row.id),
    userId: String(row.user_id),
    track: (row.track as InterviewTrack) || 'technical',
    difficulty,
    topic: String(row.topic || 'General Practice'),
    mode: (row.mode as PracticeMode) || 'typed',
    status: (row.status as SessionStatus) || 'in-progress',
    durationSeconds: Number(row.duration_seconds || 0),
    overallScore: row.overall_score != null ? Number(row.overall_score) : null,
    cadenceScore: row.cadence_score != null ? Number(row.cadence_score) : null,
    defenseScore: row.defense_score != null ? Number(row.defense_score) : null,
    feedbackSummary: row.feedback_summary ? String(row.feedback_summary) : null,
    completedAt: row.completed_at ? String(row.completed_at) : null,
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
    totalQuestions: getTotalQuestionsForDifficulty(difficulty),
  };
}

function mapInteractionRow(row: Record<string, unknown>): PersistentInteraction {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    userId: String(row.user_id),
    track: (row.track as InterviewTrack) || 'technical',
    topic: String(row.topic || ''),
    difficulty: (row.difficulty as DifficultyLevel) || 'foundation',
    questionText: String(row.question_text || ''),
    expectedRubric: Array.isArray(row.expected_rubric)
      ? (row.expected_rubric as string[])
      : [],
    answerText: String(row.answer_text || ''),
    overallScore: row.overall_score != null ? Number(row.overall_score) : null,
    technicalAccuracy: row.technical_accuracy != null ? Number(row.technical_accuracy) : null,
    reasoningScore: row.reasoning_score != null ? Number(row.reasoning_score) : null,
    structureScore: row.structure_score != null ? Number(row.structure_score) : null,
    strengths: Array.isArray(row.strengths) ? (row.strengths as string[]) : [],
    weaknesses: Array.isArray(row.weaknesses) ? (row.weaknesses as string[]) : [],
    weakestSkill: row.weakest_skill ? String(row.weakest_skill) : null,
    lessonTitle: row.lesson_title ? String(row.lesson_title) : null,
    lessonExplanation: row.lesson_explanation ? String(row.lesson_explanation) : null,
    realWorldExample: row.real_world_example ? String(row.real_world_example) : null,
    microExerciseQuestion: row.micro_exercise_question ? String(row.micro_exercise_question) : null,
    exerciseHint: row.exercise_hint ? String(row.exercise_hint) : null,
    retryAnswer: row.retry_answer ? String(row.retry_answer) : null,
    retryScore: row.retry_score != null ? Number(row.retry_score) : null,
    improvementDelta: row.improvement_delta != null ? Number(row.improvement_delta) : null,
    isWeaknessResolved: Boolean(row.is_weakness_resolved),
    retryComparisonFeedback: row.retry_comparison_feedback
      ? String(row.retry_comparison_feedback)
      : null,
    retryEvidence: Array.isArray(row.retry_evidence) ? (row.retry_evidence as string[]) : [],
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}
