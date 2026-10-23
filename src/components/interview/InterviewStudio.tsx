import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Cpu,
  RefreshCw,
  Send,
  Loader2,
  AlertCircle,
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Target,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  checkAIStatus,
  generateQuestionApi,
  evaluateAnswerApi,
  fixWeaknessApi,
  evaluateRetryApi,
  type AIStatus,
  type GeneratedQuestion,
  type AnswerEvaluation,
  type WeaknessLesson,
  type RetryEvaluation,
} from '../../lib/aiClient';
import type { InterviewConfig } from '../../types';

interface InterviewStudioProps {
  config: InterviewConfig;
  onBackToSetup: () => void;
  onExitHome: () => void;
}

type StudioStage =
  | 'generating-question'
  | 'answering'
  | 'evaluating'
  | 'evaluated'
  | 'teaching-weakness'
  | 'retrying'
  | 'evaluating-retry'
  | 'retry-evaluated'
  | 'progression-summary';

export const InterviewStudio: React.FC<InterviewStudioProps> = ({
  config,
  onBackToSetup,
  onExitHome,
}) => {
  const { user, profile } = useAuth();

  // AI Backend Status
  const [aiStatus, setAiStatus] = useState<AIStatus>({
    configured: false,
    provider: 'none',
    model: 'none',
    message: 'Checking AI provider status...',
  });
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Workflow State
  const [currentStage, setCurrentStage] = useState<StudioStage>('generating-question');
  const [questionCount, setQuestionCount] = useState(1);
  const maxQuestions = 3;

  // Active Question Data
  const [currentQuestion, setCurrentQuestion] = useState<GeneratedQuestion | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Candidate Answer State
  const [answerText, setAnswerText] = useState('');
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Remediation State ("Fix My Weakness")
  const [weaknessLesson, setWeaknessLesson] = useState<WeaknessLesson | null>(null);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [retryAnswerText, setRetryAnswerText] = useState('');
  const [retryEvaluation, setRetryEvaluation] = useState<RetryEvaluation | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [isEvaluatingRetry, setIsEvaluatingRetry] = useState(false);

  // Evidence Progression Tracking
  const [verifiedAttempts, setVerifiedAttempts] = useState<number>(0);
  const [totalScoreSum, setTotalScoreSum] = useState<number>(0);
  const [weaknessesResolvedCount, setWeaknessesResolvedCount] = useState<number>(0);

  // Persistence Status Tracking (Database Verified vs Temporary In-Memory)
  const [persistenceMode, setPersistenceMode] = useState<'in-memory' | 'database-verified'>('in-memory');

  // Check server AI status on mount
  useEffect(() => {
    let isMounted = true;
    checkAIStatus()
      .then((status) => {
        if (isMounted) {
          setAiStatus(status);
          setIsCheckingStatus(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsCheckingStatus(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch or Generate Question
  const loadNextQuestion = useCallback(async () => {
    setIsGenerating(true);
    setQuestionError(null);
    setCurrentStage('generating-question');
    setAnswerText('');
    setEvaluation(null);
    setEvaluationError(null);
    setWeaknessLesson(null);
    setLessonError(null);
    setRetryAnswerText('');
    setRetryEvaluation(null);
    setRetryError(null);

    try {
      const q = await generateQuestionApi({
        track: config.track,
        topic: config.topic,
        difficulty: config.difficulty,
        targetRole: profile?.targetRole || undefined,
      });
      setCurrentQuestion(q);
      setCurrentStage('answering');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate interview question.';
      setQuestionError(msg);
      // Fallback domain question so the candidate is never stuck if API key is unconfigured
      setCurrentQuestion({
        questionText:
          config.track === 'technical'
            ? `In a high-throughput distributed system implementing ${config.topic}, how would you architect state synchronization across nodes during network partitions while maintaining consistency trade-offs?`
            : `Describe a high-stakes scenario involving ${config.topic} where you faced cross-functional resistance. How did you structure your strategy, resolve conflicts, and quantify the final outcome?`,
        expectedRubric:
          config.track === 'technical'
            ? [
                'Correct explanation of partition tolerance and consistency trade-offs',
                'Identification of failure modes and recovery mechanisms',
                'Quantifiable performance implications (latency vs throughput)',
              ]
            : [
                'Strict adherence to STAR narrative framework',
                'Clear articulation of individual ownership and conflict resolution',
                'Quantifiable business or technical outcome',
              ],
        focusSkill: config.track === 'technical' ? 'Partition Tolerance & Trade-Offs' : 'STAR Conflict Resolution',
        targetRoleRelevance: `Core competency evaluated for ${profile?.targetRole || 'Software Engineering'} candidates.`,
      });
      setCurrentStage('answering');
    } finally {
      setIsGenerating(false);
    }
  }, [config.track, config.topic, config.difficulty, profile?.targetRole]);

  // Initial Question on Mount
  useEffect(() => {
    loadNextQuestion();
  }, [loadNextQuestion]);

  // Submit Answer for Evaluation
  const handleSubmitAnswer = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!answerText.trim() || isEvaluating || !currentQuestion) return;

    setIsEvaluating(true);
    setEvaluationError(null);
    setCurrentStage('evaluating');

    try {
      const evalResult = await evaluateAnswerApi({
        questionText: currentQuestion.questionText,
        expectedRubric: currentQuestion.expectedRubric,
        answerText: answerText.trim(),
        track: config.track,
        topic: config.topic,
        difficulty: config.difficulty,
      });

      setEvaluation(evalResult);
      setVerifiedAttempts((prev) => prev + 1);
      setTotalScoreSum((prev) => prev + evalResult.overallScore);
      setCurrentStage('evaluated');

      // Attempt background database save (gracefully handles if migration not applied yet)
      saveInteractionToDatabase({
        question: currentQuestion.questionText,
        rubric: currentQuestion.expectedRubric,
        answer: answerText.trim(),
        evaluation: evalResult,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Evaluation service error.';
      setEvaluationError(msg);
      // DO NOT invent AI evaluations, improvements, or scores when an API request fails.
      // Retain the candidate's answer text so no effort is lost, and remain in answering stage.
      setCurrentStage('answering');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Launch "Fix My Weakness" Teaching Flow
  const handleStartFixWeakness = async () => {
    if (!evaluation || !currentQuestion) return;
    setIsGeneratingLesson(true);
    setLessonError(null);
    setCurrentStage('teaching-weakness');

    try {
      const lesson = await fixWeaknessApi({
        weakestSkill: evaluation.weakestSkill,
        questionText: currentQuestion.questionText,
        answerText,
        track: config.track,
        topic: config.topic,
      });
      setWeaknessLesson(lesson);
      setCurrentStage('retrying');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate concept lesson.';
      setLessonError(msg);
      setCurrentStage('evaluated');
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  // Submit Retry Answer
  const handleSubmitRetry = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!retryAnswerText.trim() || isEvaluatingRetry || !currentQuestion || !evaluation) return;

    setIsEvaluatingRetry(true);
    setRetryError(null);
    setCurrentStage('evaluating-retry');

    try {
      const retryResult = await evaluateRetryApi({
        originalQuestion: currentQuestion.questionText,
        originalAnswer: answerText,
        weakestSkill: evaluation.weakestSkill,
        lessonConcept: weaknessLesson?.conceptTitle || evaluation.weakestSkill,
        retryAnswer: retryAnswerText.trim(),
        originalScore: evaluation.overallScore,
        track: config.track,
        topic: config.topic,
      });

      setRetryEvaluation(retryResult);
      if (retryResult.isWeaknessResolved) {
        setWeaknessesResolvedCount((prev) => prev + 1);
      }
      setCurrentStage('retry-evaluated');

      // Persist milestone progression if qualified
      checkAndPersistProgression(retryResult.isWeaknessResolved);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Retry evaluation service error.';
      setRetryError(msg);
      // DO NOT invent AI evaluations, improvements, or scores when an API request fails.
      // Keep candidate retry text intact and remain in retrying stage so they can re-verify.
      setCurrentStage('retrying');
    } finally {
      setIsEvaluatingRetry(false);
    }
  };

  // Safe database insertion & persistence tracking
  const saveInteractionToDatabase = async (data: {
    question: string;
    rubric: string[];
    answer: string;
    evaluation: AnswerEvaluation;
  }) => {
    if (!user || !supabase || !isSupabaseConfigured) {
      setPersistenceMode('in-memory');
      return;
    }
    try {
      const { error } = await supabase.from('interview_interactions').insert({
        user_id: user.id,
        track: config.track,
        topic: config.topic,
        difficulty: config.difficulty,
        question_text: data.question,
        expected_rubric: data.rubric,
        answer_text: data.answer,
        overall_score: data.evaluation.overallScore,
        technical_accuracy: data.evaluation.technicalAccuracy,
        reasoning_score: data.evaluation.reasoningTradeoff,
        structure_score: data.evaluation.structureClarity,
        strengths: data.evaluation.strengths,
        weaknesses: data.evaluation.weaknesses,
        weakest_skill: data.evaluation.weakestSkill,
      });
      if (error) {
        setPersistenceMode('in-memory');
      } else {
        setPersistenceMode('database-verified');
      }
    } catch {
      setPersistenceMode('in-memory');
    }
  };

  // Check and persist level progression event if evidence criteria are met
  const checkAndPersistProgression = async (justResolvedWeakness: boolean) => {
    const updatedResolved = justResolvedWeakness ? weaknessesResolvedCount + 1 : weaknessesResolvedCount;
    const avg = verifiedAttempts > 0 ? Math.round(totalScoreSum / verifiedAttempts) : 0;
    if (verifiedAttempts >= 2 && avg >= 75 && updatedResolved >= 1) {
      if (user && supabase && isSupabaseConfigured) {
        try {
          await supabase.from('candidate_progression').insert({
            user_id: user.id,
            track: config.track,
            level_achieved: getNextDifficulty(config.difficulty).toLowerCase().replace(/\s+/g, '-'),
            evidence_summary: `Evidenced ${verifiedAttempts} substantive answers (avg ${avg}/100) and verified resolution of ${updatedResolved} weakness(es).`,
            verified_score_avg: avg,
            weaknesses_resolved_count: updatedResolved,
          });
        } catch {
          // Handled silently if migration pending
        }
      }
    }
  };

  // Evidence Progression Calculation
  // Requires: >= 2 evaluated attempts, average score >= 75, at least 1 verified resolved weakness,
  // and no currently unresolved weakness on the active retry.
  const averageScore = verifiedAttempts > 0 ? Math.round(totalScoreSum / verifiedAttempts) : 0;
  const hasActiveUnresolvedWeakness = retryEvaluation !== null && !retryEvaluation.isWeaknessResolved;
  const qualifiesForLevelUp =
    verifiedAttempts >= 2 &&
    averageScore >= 75 &&
    weaknessesResolvedCount >= 1 &&
    !hasActiveUnresolvedWeakness;

  const getNextDifficulty = (current: string) => {
    if (current === 'foundation') return 'Pressure-Cooker';
    if (current === 'pressure-cooker') return 'Executive Master';
    return 'Master Verified';
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center font-inria animate-fadeIn">
      {/* Top Studio Telemetry Bar */}
      <div className="w-full flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF] animate-pulse" />
          <span className="text-[11px] font-mono text-[#00F0FF] tracking-wider uppercase font-bold">
            LEVEL-UP STUDIO // {config.track === 'technical' ? 'TECHNICAL DEFENSE' : 'HR BEHAVIORAL'}
          </span>
          <span className="text-xs text-white/20">•</span>
          <span className="text-xs font-mono text-[#9EA6B0] uppercase hidden sm:inline">
            Active Rigor: <strong className="text-white">{config.difficulty.toUpperCase()}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBackToSetup}
            className="text-xs font-mono text-[#9EA6B0] hover:text-[#00F0FF] transition-colors inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg daemon-card daemon-card-hover uppercase tracking-wider"
          >
            <RefreshCw className="w-3 h-3 text-[#00F0FF]" />
            <span className="hidden sm:inline">Reconfigure</span>
          </button>
          <button
            type="button"
            onClick={onExitHome}
            className="text-xs font-mono text-[#9EA6B0] hover:text-[#FFFFFF] transition-colors inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg daemon-card daemon-card-hover uppercase tracking-wider"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      {/* AI Provider Status Banner */}
      {!isCheckingStatus && !aiStatus.configured && (
        <div className="w-full mb-6 p-4 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-[#FFB800]">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider block">
                AI Backend Standby (Server Key Pending)
              </span>
              <span className="text-[#9EA6B0]">
                To activate live model generation, add <code className="text-white font-bold">GEMINI_API_KEY</code> or{' '}
                <code className="text-white font-bold">OPENAI_API_KEY</code> to your server environment or{' '}
                <code className="text-white font-bold">.env.local</code> (server-side only, no VITE_ prefix).
              </span>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded bg-[#FFB800]/20 font-bold shrink-0">
            OFFLINE FALLBACK ACTIVE
          </span>
        </div>
      )}

      {/* Verified Configuration Banner */}
      <div className="w-full mb-8 p-5 rounded-xl daemon-card relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-tr" aria-hidden="true">+</span>
        <span className="daemon-crosshair-bl" aria-hidden="true">+</span>
        <span className="daemon-crosshair-br" aria-hidden="true">+</span>

        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-[#0A0B0D] border border-white/[0.1] text-[#00F0FF]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-anton text-lg tracking-wide text-[#FFFFFF] uppercase">
                {config.track === 'technical' ? 'Technical Interview & Remediation' : 'HR & Behavioral Mastery'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded daemon-badge font-bold">
                STAGE: {currentStage.toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-mono text-[#9EA6B0] mt-1">
              Domain: <span className="text-[#FFFFFF] font-bold">{config.topic}</span> • Target Role:{' '}
              <span className="text-[#00F0FF]">{profile?.targetRole || 'Software Engineering'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#9EA6B0]">
            Question <strong className="text-[#00F0FF]">{questionCount}</strong> of {maxQuestions}
          </span>
        </div>
      </div>

      {/* Main Studio Console Grid */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Left Column: Question, Response & Evaluation (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Question Prompter Card */}
          <div className="daemon-card rounded-xl p-6 relative">
            <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
            <span className="daemon-crosshair-tr" aria-hidden="true">+</span>

            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#00F0FF]" />
                <span className="font-anton text-lg text-[#FFFFFF] uppercase tracking-wide">
                  Active Interview Prompt
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#00F0FF] px-2.5 py-0.5 rounded daemon-badge font-bold uppercase">
                {currentQuestion?.focusSkill || 'Skill Evaluation'}
              </span>
            </div>

            {questionError && (
              <div className="mb-4 p-3 rounded bg-[#FFB800]/10 border border-[#FFB800]/30 text-xs font-mono text-[#FFB800] flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Notice: {questionError} (Operating with domain backup question)</span>
              </div>
            )}

            {isGenerating ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-6 h-6 text-[#00F0FF] animate-spin mb-3" />
                <span className="text-xs font-mono text-[#9EA6B0]">
                  Synthesizing question for {config.difficulty} difficulty...
                </span>
              </div>
            ) : currentQuestion ? (
              <div className="space-y-4">
                <p className="font-inria text-base sm:text-lg text-[#FFFFFF] leading-relaxed">
                  {currentQuestion.questionText}
                </p>

                {/* Rubric Badge Pill Preview */}
                <div className="pt-2 border-t border-white/[0.08]">
                  <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block mb-2 font-bold">
                    INTERNAL EVALUATION RUBRIC:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentQuestion.expectedRubric.map((r, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2.5 py-1 rounded bg-[#0A0B0D] border border-white/[0.08] text-[#9EA6B0]"
                      >
                        ✓ {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs font-mono text-[#9EA6B0]">Ready to generate question.</p>
            )}
          </div>

          {/* Candidate Response Input Console */}
          {currentStage === 'answering' && (
            <form onSubmit={handleSubmitAnswer} className="daemon-card rounded-xl p-6 relative space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#9EA6B0] font-bold">
                  CANDIDATE RESPONSE CONSOLE (TYPED FIRST)
                </span>
                <span className="text-[11px] font-mono text-[#9EA6B0]">
                  {answerText.trim() ? answerText.trim().split(/\s+/).length : 0} words
                </span>
              </div>

              {/* Evaluation Error Alert with Retry Action */}
              {evaluationError && (
                <div className="p-4 rounded-xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/40 text-[#FFFFFF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_16px_rgba(255,77,109,0.15)]">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-[#FF4D6D] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-mono text-xs uppercase tracking-wider text-[#FF4D6D] font-bold block">
                        Evaluation Request Notice
                      </span>
                      <p className="text-xs font-mono text-[#9EA6B0] mt-1 leading-relaxed">
                        {evaluationError}
                      </p>
                      {evaluationError.includes('AI_PROVIDER_NOT_CONFIGURED') && (
                        <p className="text-[11px] font-mono text-[#00F0FF] mt-1">
                          Tip: Configure <code className="text-white font-bold">GEMINI_API_KEY</code> or{' '}
                          <code className="text-white font-bold">OPENAI_API_KEY</code> in{' '}
                          <code className="text-white font-bold">.env.local</code> on the server to activate AI evaluation.
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSubmitAnswer()}
                    className="px-4 py-2 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] text-[#0A0B0D] font-anton text-xs uppercase tracking-wider shrink-0 inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Evaluation</span>
                  </button>
                </div>
              )}

              {/* Guidance helper */}
              <div className="p-3 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-xs font-mono text-[#9EA6B0]">
                {config.track === 'technical' ? (
                  <span>
                    💡 <strong className="text-white">Technical Guide:</strong> Structure with: 1. Core
                    Mechanism / Pattern, 2. Complexity & Scalability, 3. Trade-offs & Failure Handling.
                  </span>
                ) : (
                  <span>
                    💡 <strong className="text-white">Behavioral Guide:</strong> Use the STAR method: Situation,
                    Task, Specific Action, Quantifiable Result.
                  </span>
                )}
              </div>

              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type your structured answer here. Be explicit regarding trade-offs, edge-cases, and reasoning..."
                rows={7}
                className="w-full bg-[#0A0B0D] text-[#FFFFFF] text-sm font-mono placeholder:text-[#9EA6B0]/40 p-4 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:outline-none transition-all leading-relaxed"
                required
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-mono text-[#9EA6B0]">
                  ASSESSMENT: CONTENT ONLY • ZERO FAKE VOCAL CADENCE INFERENCING
                </span>

                <button
                  type="submit"
                  disabled={!answerText.trim() || isEvaluating}
                  className="px-6 py-3 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] active:scale-[0.98] text-[#0A0B0D] font-anton text-base tracking-wider uppercase inline-flex items-center gap-2 transition-all shadow-[0_0_16px_rgba(0,240,255,0.3)] disabled:opacity-50"
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>EVALUATING SUBSTANCE...</span>
                    </>
                  ) : (
                    <>
                      <span>[ Submit Answer for AI Evaluation ]</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Evaluating Loading State */}
          {currentStage === 'evaluating' && (
            <div className="daemon-card rounded-xl p-8 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin mb-3" />
              <span className="font-anton text-xl text-white uppercase tracking-wide">
                Evaluating Candidate Answer
              </span>
              <p className="text-xs font-mono text-[#9EA6B0] mt-1.5 max-w-md">
                Comparing answer against rubrics for technical correctness, reasoning depth, and structure...
              </p>
            </div>
          )}

          {/* Stage 3: Evaluation Results & Fix My Weakness Action */}
          {(currentStage === 'evaluated' ||
            currentStage === 'teaching-weakness' ||
            currentStage === 'retrying' ||
            currentStage === 'evaluating-retry' ||
            currentStage === 'retry-evaluated') &&
            evaluation && (
              <div className="daemon-card rounded-xl p-6 sm:p-7 relative space-y-6">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div className="flex items-center gap-2.5">
                    <Award className="w-5 h-5 text-[#00F0FF]" />
                    <h3 className="font-anton text-2xl text-white uppercase tracking-wide">
                      Evaluation & Skill Diagnosis
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">Overall Score</span>
                    <span className="font-anton text-3xl text-[#00F0FF]">{evaluation.overallScore}/100</span>
                  </div>
                </div>

                {evaluationError && (
                  <div className="p-3 rounded bg-[#FFB800]/10 border border-[#FFB800]/30 text-xs font-mono text-[#FFB800] flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Evaluation Notice: {evaluationError} (Generated via heuristic assessment)</span>
                  </div>
                )}

                {/* Score Breakdown Pillars */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-center">
                    <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">Technical Accuracy</span>
                    <span className="font-mono text-lg font-bold text-white mt-0.5 block">
                      {evaluation.technicalAccuracy}%
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-center">
                    <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">Reasoning & Trade-Offs</span>
                    <span className="font-mono text-lg font-bold text-[#00F0FF] mt-0.5 block">
                      {evaluation.reasoningTradeoff}%
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-center">
                    <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">Structure Clarity</span>
                    <span className="font-mono text-lg font-bold text-white mt-0.5 block">
                      {evaluation.structureClarity}%
                    </span>
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-[#0A0B0D] border border-[#00F0FF]/20 space-y-2">
                    <span className="text-xs font-mono text-[#00F0FF] font-bold uppercase tracking-wider block">
                      ✓ Evidenced Strengths
                    </span>
                    <ul className="text-xs font-mono text-[#9EA6B0] space-y-1.5 list-disc list-inside">
                      {evaluation.strengths.map((s, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg bg-[#0A0B0D] border border-[#FF4D6D]/30 space-y-2">
                    <span className="text-xs font-mono text-[#FF4D6D] font-bold uppercase tracking-wider block">
                      ⚠ Evidenced Weaknesses
                    </span>
                    <ul className="text-xs font-mono text-[#9EA6B0] space-y-1.5 list-disc list-inside">
                      {evaluation.weaknesses.map((w, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Key Identified Weakness Banner */}
                <div className="p-4 rounded-lg bg-[#FFB800]/10 border border-[#FFB800]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-[#FFB800] tracking-wider uppercase font-bold block">
                      PRIMARY DEFICIT IDENTIFIED
                    </span>
                    <h4 className="font-anton text-lg text-white uppercase tracking-wide mt-0.5">
                      {evaluation.weakestSkill}
                    </h4>
                    <p className="text-xs font-mono text-[#9EA6B0] mt-1">{evaluation.explanationOfMissing}</p>
                  </div>

                  {currentStage === 'evaluated' && (
                    <button
                      type="button"
                      id="fix-weakness-btn"
                      onClick={handleStartFixWeakness}
                      disabled={isGeneratingLesson}
                      className="px-5 py-3 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] text-[#0A0B0D] font-anton text-sm uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-[0_0_16px_rgba(0,240,255,0.3)] shrink-0"
                    >
                      {isGeneratingLesson ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>SYNTHESIZING LESSON...</span>
                        </>
                      ) : (
                        <>
                          <span>[ 🛠 FIX MY WEAKNESS ]</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {lessonError && (
                  <div className="p-3 rounded bg-[#FF4D6D]/15 border border-[#FF4D6D]/30 text-xs font-mono text-white flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#FF4D6D] shrink-0" />
                      <span>Lesson Synthesis Notice: {lessonError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartFixWeakness}
                      className="px-3 py-1.5 rounded bg-[#00F0FF] text-[#0A0B0D] font-anton text-xs uppercase shrink-0"
                    >
                      Retry Lesson
                    </button>
                  </div>
                )}
              </div>
            )}

          {/* Stage 4: "Fix My Weakness" Lesson & Targeted Micro-Exercise */}
          {(currentStage === 'retrying' ||
            currentStage === 'evaluating-retry' ||
            currentStage === 'retry-evaluated') &&
            weaknessLesson && (
              <div className="daemon-card rounded-xl p-6 sm:p-7 relative space-y-6 border border-[#00F0FF]/40 animate-fadeIn">
                <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
                <span className="daemon-crosshair-tr" aria-hidden="true">+</span>

                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-5 h-5 text-[#00F0FF]" />
                    <div>
                      <span className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-wider font-bold block">
                        AI TUTOR // CONCEPT BREAKDOWN & RETRY
                      </span>
                      <h3 className="font-anton text-2xl text-white uppercase tracking-wide">
                        {weaknessLesson.conceptTitle}
                      </h3>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded daemon-badge font-bold uppercase">
                    REMEDIAL TARGET
                  </span>
                </div>

                {/* Concept Lesson */}
                <div className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.08] space-y-3">
                  <span className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-wider font-bold block">
                    TEACHING BREAKDOWN:
                  </span>
                  <p className="text-xs sm:text-sm font-inria text-[#FFFFFF]/90 leading-relaxed">
                    {weaknessLesson.conceptExplanation}
                  </p>
                </div>

                {/* Real-World Pattern Example */}
                <div className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.08] space-y-2">
                  <span className="text-[10px] font-mono text-[#7AE582] uppercase tracking-wider font-bold block">
                    STANDARD OF EXCELLENCE EXAMPLE:
                  </span>
                  <p className="text-xs font-mono text-[#7AE582]/90 leading-relaxed bg-[#14181B] p-3 rounded border border-white/[0.05]">
                    {weaknessLesson.realWorldExample}
                  </p>
                </div>

                {/* Targeted Micro-Exercise */}
                <div className="p-4 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 space-y-2">
                  <span className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-wider font-bold block">
                    TARGETED PRACTICE EXERCISE:
                  </span>
                  <p className="text-sm font-inria text-white font-bold leading-relaxed">
                    {weaknessLesson.microExerciseQuestion}
                  </p>
                  <span className="text-xs font-mono text-[#9EA6B0] block italic">
                    💡 Hint: {weaknessLesson.exerciseHint}
                  </span>
                </div>

                {/* Retry Input Form */}
                {currentStage === 'retrying' && (
                  <form onSubmit={handleSubmitRetry} className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-white uppercase tracking-wider font-bold">
                        SUBMIT REVISED RETRY ANSWER
                      </span>
                      <span className="text-[11px] font-mono text-[#9EA6B0]">
                        {retryAnswerText.trim() ? retryAnswerText.trim().split(/\s+/).length : 0} words
                      </span>
                    </div>

                    {retryError && (
                      <div className="p-3 rounded bg-[#FF4D6D]/15 border border-[#FF4D6D]/30 text-xs font-mono text-white flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-[#FF4D6D] shrink-0" />
                          <span>Verification Notice: {retryError}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSubmitRetry()}
                          className="px-3 py-1.5 rounded bg-[#00F0FF] text-[#0A0B0D] font-anton text-xs uppercase shrink-0"
                        >
                          Retry Verification
                        </button>
                      </div>
                    )}

                    <textarea
                      value={retryAnswerText}
                      onChange={(e) => setRetryAnswerText(e.target.value)}
                      placeholder="Apply the taught concept here to correct your original weakness. Include concrete trade-offs and metrics..."
                      rows={6}
                      className="w-full bg-[#0A0B0D] text-[#FFFFFF] text-sm font-mono placeholder:text-[#9EA6B0]/40 p-4 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:outline-none transition-all leading-relaxed"
                      required
                    />

                    <button
                      type="submit"
                      disabled={!retryAnswerText.trim() || isEvaluatingRetry}
                      className="w-full min-h-[48px] px-6 py-3 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] text-[#0A0B0D] font-anton text-base tracking-wider uppercase inline-flex items-center justify-center gap-2 transition-all shadow-[0_0_16px_rgba(0,240,255,0.3)] disabled:opacity-50"
                    >
                      {isEvaluatingRetry ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>VERIFYING IMPROVEMENT DELTA...</span>
                        </>
                      ) : (
                        <>
                          <span>[ Verify Retry Improvement ]</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Retry Improvement Verification Results (Side-by-Side Comparison) */}
                {currentStage === 'retry-evaluated' && retryEvaluation && (
                  <div className="p-5 rounded-lg bg-[#0A0B0D] border border-white/[0.08] space-y-4">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                      <span className="font-anton text-lg text-white uppercase tracking-wide">
                        Side-by-Side Delta Verification
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-[#9EA6B0]">
                          Original: <strong className="text-white">{retryEvaluation.originalScore}</strong>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#00F0FF]" />
                        <span className="text-xs font-mono text-[#00F0FF] font-bold">
                          Retry: {retryEvaluation.newScore} ({retryEvaluation.improvementDelta >= 0 ? '+' : ''}
                          {retryEvaluation.improvementDelta} pts)
                        </span>
                      </div>
                    </div>

                    {/* Delta Comparison Blocks */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="p-3 rounded bg-[#14181B] border border-white/[0.06] space-y-1">
                        <span className="text-[#9EA6B0] uppercase block font-bold">Original Answer:</span>
                        <p className="text-white/60 line-clamp-4 leading-relaxed">{answerText}</p>
                      </div>
                      <div className="p-3 rounded bg-[#14181B] border border-[#00F0FF]/30 space-y-1">
                        <span className="text-[#00F0FF] uppercase block font-bold">Revised Retry Answer:</span>
                        <p className="text-white leading-relaxed line-clamp-4">{retryAnswerText}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-xs font-mono">
                      <span className="text-[#00F0FF] font-bold block mb-1">AI Verification Verdict:</span>
                      <p className="text-white/90 leading-relaxed">{retryEvaluation.comparisonFeedback}</p>
                    </div>

                    {/* Weakness Resolution Check and Action Gate */}
                    {!retryEvaluation.isWeaknessResolved ? (
                      <div className="p-4 rounded-lg bg-[#FF4D6D]/10 border border-[#FF4D6D]/40 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="w-5 h-5 text-[#FF4D6D] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-mono text-[#FF4D6D] uppercase tracking-wider font-bold block">
                              DEFICIT STILL EVIDENCED // WEAKNESS UNRESOLVED
                            </span>
                            <p className="text-xs font-mono text-white/90 mt-1 leading-relaxed">
                              The revised retry answer does not yet demonstrate verified resolution of{' '}
                              <strong className="text-[#FF4D6D]">{evaluation?.weakestSkill}</strong>. Level advancement is held until evidence of improvement is verified.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentStage('retrying');
                              setRetryError(null);
                            }}
                            className="px-5 py-2.5 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] text-[#0A0B0D] font-anton text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                          >
                            <Target className="w-3.5 h-3.5" />
                            <span>[ 🎯 Practice Another Targeted Exercise ]</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (questionCount < maxQuestions) {
                                setQuestionCount((prev) => prev + 1);
                                loadNextQuestion();
                              } else {
                                setCurrentStage('progression-summary');
                              }
                            }}
                            className="px-4 py-2.5 rounded-lg daemon-card daemon-card-hover text-[#9EA6B0] hover:text-white font-mono text-xs uppercase tracking-wider inline-flex items-center gap-1.5"
                          >
                            <span>Continue Next Question (Weakness Stays Open)</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-[#7AE582]/10 border border-[#7AE582]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="w-5 h-5 text-[#7AE582] shrink-0" />
                          <div>
                            <span className="text-[10px] font-mono text-[#7AE582] uppercase tracking-wider font-bold block">
                              DEFICIT REMEDIATED // EVIDENCE VERIFIED
                            </span>
                            <p className="text-xs font-mono text-white/90">
                              Successfully demonstrated mastery of <strong className="text-[#7AE582]">{evaluation?.weakestSkill}</strong>.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (questionCount < maxQuestions) {
                              setQuestionCount((prev) => prev + 1);
                              loadNextQuestion();
                            } else {
                              setCurrentStage('progression-summary');
                            }
                          }}
                          className="px-6 py-2.5 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] text-[#0A0B0D] font-anton text-sm uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(0,240,255,0.25)] shrink-0"
                        >
                          <span>
                            {questionCount < maxQuestions ? 'Advance to Next Challenge →' : 'View Final Progression'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Right Column: Evidence-Based Level Progression Matrix (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Progression HUD */}
          <div className="daemon-card rounded-xl p-6 relative flex flex-col justify-between">
            <span className="daemon-crosshair-tl" aria-hidden="true">+</span>
            <span className="daemon-crosshair-tr" aria-hidden="true">+</span>

            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#00F0FF]" />
                  <span className="font-anton text-lg text-white uppercase tracking-wide">
                    Level-Up Evidence
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded daemon-badge font-bold uppercase">
                  {config.difficulty}
                </span>
              </div>

              {/* Progress Criteria Details */}
              <div className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.08] space-y-3">
                <span className="text-[10px] font-mono text-[#9EA6B0] uppercase tracking-wider font-bold block">
                  QUALIFICATION CRITERIA FOR {getNextDifficulty(config.difficulty).toUpperCase()}:
                </span>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-[#9EA6B0]">Evaluated Submissions:</span>
                    <span className="text-white font-bold">{verifiedAttempts} / 2 required</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9EA6B0]">Average Content Rigor:</span>
                    <span className={`font-bold ${averageScore >= 75 ? 'text-[#00F0FF]' : 'text-white'}`}>
                      {averageScore}/100 {averageScore >= 75 ? '✓' : '(75 required)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9EA6B0]">Weaknesses Remediated:</span>
                    <span className="text-[#7AE582] font-bold">{weaknessesResolvedCount} Verified</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.08]">
                    <span className="text-[#9EA6B0]">Persistence Status:</span>
                    <span
                      className={`font-bold text-[10px] ${
                        persistenceMode === 'database-verified' ? 'text-[#7AE582]' : 'text-[#FFB800]'
                      }`}
                    >
                      {persistenceMode === 'database-verified'
                        ? 'SUPABASE VERIFIED'
                        : 'IN-MEMORY (Migration Pending)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Qualification Status Badge */}
              {qualifiesForLevelUp ? (
                <div className="p-4 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/50 text-center space-y-1 animate-pulse">
                  <span className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-widest font-bold block">
                    LEVEL ADVANCEMENT QUALIFIED
                  </span>
                  <h4 className="font-anton text-xl text-white uppercase">
                    Promoted to {getNextDifficulty(config.difficulty)}
                  </h4>
                  <p className="text-[11px] font-mono text-[#9EA6B0]">
                    Evidence verified through consistent scoring and weakness remediation.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-center space-y-1">
                  <span className="text-[10px] font-mono text-[#9EA6B0] uppercase tracking-widest block font-bold">
                    EVALUATING REPEATED EVIDENCE
                  </span>
                  <p className="text-xs font-inria text-[#9EA6B0] leading-relaxed">
                    Promotion requires repeated high-signal answers and verified weakness resolution. No single lucky
                    scores.
                  </p>
                </div>
              )}
            </div>

            {/* Candidate Identity Stamp */}
            <div className="pt-4 mt-6 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-[#9EA6B0]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>CANDIDATE #{user?.id?.substring(0, 6) || 'AUTH'}</span>
              </span>
              <span className="text-[#00F0FF]">RLS GATED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
