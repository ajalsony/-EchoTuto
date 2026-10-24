/**
 * EchoTutor® — Client-Side AI API Client
 * Milestone 5: Level-Up Tutor & Weakness-Solving Client
 * 
 * Interacts only with the secure server-side endpoint (/api/ai/*).
 * Never touches or requires AI secret keys in frontend code.
 */

import type { InterviewTrack, DifficultyLevel } from '../types';

export interface AIStatus {
  configured: boolean;
  provider: string;
  model: string;
  message: string;
}

export interface GeneratedQuestion {
  questionText: string;
  expectedRubric: string[];
  focusSkill: string;
  targetRoleRelevance: string;
}

export interface AnswerEvaluation {
  overallScore: number;
  technicalAccuracy: number;
  reasoningTradeoff: number;
  structureClarity: number;
  strengths: string[];
  weaknesses: string[];
  weakestSkill: string;
  explanationOfMissing: string;
  actionableNextSteps: string[];
  isContentOnly: boolean;
}

export interface WeaknessLesson {
  conceptTitle: string;
  conceptExplanation: string;
  realWorldExample: string;
  microExerciseQuestion: string;
  exerciseHint: string;
}

export interface RetryEvaluation {
  originalScore: number;
  newScore: number;
  improvementDelta: number;
  isWeaknessResolved: boolean;
  comparisonFeedback: string;
  improvementEvidence: string[];
  progressionEligible: boolean;
  progressionExplanation: string;
}

const TIMEOUT_MS = 45000;

async function postJson<T>(endpoint: string, payload: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || `AI request failed with status ${res.status}`);
    }

    return json.data as T;
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('AI request timed out after 25 seconds. Please check your connection and try again.');
      }
      throw err;
    }
    throw new Error('An unexpected error occurred contacting the AI tutor service.');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Checks if the server-side AI provider is configured.
 */
export async function checkAIStatus(): Promise<AIStatus> {
  try {
    const res = await fetch('/api/ai/status');
    if (!res.ok) {
      return {
        configured: false,
        provider: 'none',
        model: 'none',
        message: 'Could not contact AI server endpoint.',
      };
    }
    const data = await res.json();
    return {
      configured: Boolean(data.configured),
      provider: String(data.provider || 'none'),
      model: String(data.model || 'none'),
      message: String(data.message || ''),
    };
  } catch {
    return {
      configured: false,
      provider: 'none',
      model: 'none',
      message: 'AI backend endpoint unreachable. Ensure dev server is active.',
    };
  }
}

/**
 * Generates an adaptive interview question with an internal rubric.
 */
export async function generateQuestionApi(params: {
  track: InterviewTrack;
  topic: string;
  difficulty: DifficultyLevel;
  targetRole?: string;
  previousExchanges?: unknown[];
}): Promise<GeneratedQuestion> {
  return postJson<GeneratedQuestion>('/api/ai/generate-question', params);
}

/**
 * Evaluates candidate typed answer against the internal rubric.
 */
export async function evaluateAnswerApi(params: {
  questionText: string;
  expectedRubric: string[];
  answerText: string;
  track: InterviewTrack;
  topic: string;
  difficulty: DifficultyLevel;
}): Promise<AnswerEvaluation> {
  return postJson<AnswerEvaluation>('/api/ai/evaluate-answer', params);
}

/**
 * Generates a targeted lesson and micro-exercise to fix the candidate's weakest skill.
 */
export async function fixWeaknessApi(params: {
  weakestSkill: string;
  questionText: string;
  answerText: string;
  track: InterviewTrack;
  topic: string;
}): Promise<WeaknessLesson> {
  return postJson<WeaknessLesson>('/api/ai/fix-weakness', params);
}

/**
 * Compares the candidate's retry answer with their original answer and verifies improvement.
 */
export async function evaluateRetryApi(params: {
  originalQuestion: string;
  originalAnswer: string;
  weakestSkill: string;
  lessonConcept: string;
  retryAnswer: string;
  originalScore: number;
  track: InterviewTrack;
  topic: string;
}): Promise<RetryEvaluation> {
  return postJson<RetryEvaluation>('/api/ai/evaluate-retry', params);
}
