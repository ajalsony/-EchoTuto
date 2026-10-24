import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Cpu,
  RefreshCw,
  Loader2,
  AlertCircle,
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Target,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Keyboard,
  Mic,
  Timer,
  Terminal,
  SlidersHorizontal,
} from 'lucide-react';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useMicrophoneTest } from '../../hooks/useMicrophoneTest';
import { QuestionVoiceSpeaker } from './QuestionVoiceSpeaker';
import { VoiceSpeechConsole } from './VoiceSpeechConsole';
import { useAuth } from '../../context/AuthContext';
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
import {
  isDatabaseReady,
  findActiveSession,
  createSession,
  loadSessionInteractions,
  saveGeneratedQuestion,
  saveAnswerEvaluation,
  saveWeaknessLesson,
  saveRetryEvaluation,
  verifyAndRecordProgression,
  updateSessionStatus,
  getTotalQuestionsForDifficulty,
} from '../../lib/interviewPersistence';
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

/**
 * Concise fallback questions aligned with difficulty word-count targets:
 * - Easy: 8–20 words
 * - Medium: 12–25 words
 * - Hard: 15–30 words
 */
export function getConciseFallbackQuestion(
  track: 'technical' | 'hr',
  topic: string,
  difficulty: string
): GeneratedQuestion {
  const norm = (difficulty || '').toLowerCase();
  const isEasy = norm === 'easy' || norm === 'foundation';
  const isMedium = norm === 'medium' || norm === 'pressure-cooker';

  if (track === 'technical') {
    if (isEasy) {
      return {
        questionText: `How does ${topic} maintain data consistency when a single node fails?`,
        expectedRubric: [
          'Node failure detection and failover mechanism',
          'Data replication protocol and state recovery',
          'Basic consistency vs availability trade-off',
        ],
        focusSkill: 'Foundational Fault Tolerance',
        targetRoleRelevance: 'Core engineering competency in distributed systems.',
      };
    }
    if (isMedium) {
      return {
        questionText: `How do you balance consistency and latency trade-offs when implementing ${topic}?`,
        expectedRubric: [
          'Explanation of partition tolerance and consistency trade-offs',
          'Identification of failure modes and recovery mechanisms',
          'Quantifiable performance implications (latency vs throughput)',
        ],
        focusSkill: 'Partition Tolerance & Trade-Offs',
        targetRoleRelevance: 'System architecture and engineering trade-offs.',
      };
    }
    return {
      questionText: `How would you architect state synchronization in ${topic} during cross-region network partitions?`,
      expectedRubric: [
        'Strict majority quorum and split-brain mitigation protocols',
        'Epoch or term-based stale leader fencing',
        'Cross-region replication latency boundary invariants',
      ],
      focusSkill: 'High-Rigor Architecture Defense',
      targetRoleRelevance: 'Senior architecture and distributed systems mastery.',
    };
  }

  // HR & Behavioral Track
  if (isEasy) {
    return {
      questionText: `Can you describe a situation where you resolved a disagreement with a teammate?`,
      expectedRubric: [
        'Clear STAR narrative structure',
        'Root cause identification and empathy',
        'Constructive outcome and teamwork restoration',
      ],
      focusSkill: 'Teamwork & Empathy',
      targetRoleRelevance: 'Cross-functional collaboration and constructive communication.',
    };
  }
  if (isMedium) {
    return {
      questionText: `Describe a scenario where you handled cross-functional pushback to deliver a critical milestone.`,
      expectedRubric: [
        'Strict adherence to STAR narrative framework',
        'Clear articulation of individual ownership and conflict resolution',
        'Quantifiable business or technical outcome',
      ],
      focusSkill: 'STAR Conflict Resolution',
      targetRoleRelevance: 'Leadership ownership and stakeholder alignment.',
    };
  }
  return {
    questionText: `Describe a time you challenged an executive decision with data to prevent a major failure.`,
    expectedRubric: [
      'Executive presence and data-backed argumentation',
      'Risk de-escalation without compromising integrity',
      'Quantifiable long-term organizational impact',
    ],
    focusSkill: 'Executive Influence & Risk Mitigation',
    targetRoleRelevance: 'Executive leadership, strategic judgment, and integrity.',
  };
}

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

  // Workflow State & Difficulty-Based Limits
  const [currentStage, setCurrentStage] = useState<StudioStage>('generating-question');
  const [questionCount, setQuestionCount] = useState(1);
  const maxQuestions = getTotalQuestionsForDifficulty(config.difficulty);
  const [isAdvancing, setIsAdvancing] = useState(false);

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

  // Database Session & Persistence Tracking
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentInteractionId, setCurrentInteractionId] = useState<string | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(true);
  const [sessionRestoreNotice, setSessionRestoreNotice] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [progressionNotice, setProgressionNotice] = useState<string | null>(null);
  const [persistenceMode, setPersistenceMode] = useState<'in-memory' | 'database-verified'>(
    isDatabaseReady() ? 'database-verified' : 'in-memory'
  );

  // Voice & Speech Mode State
  const [currentMode, setCurrentMode] = useState<'voice' | 'typed'>(
    config.mode === 'voice' ? 'voice' : 'typed'
  );

  // Sync mode if config changes
  useEffect(() => {
    if (config.mode) {
      setCurrentMode(config.mode === 'voice' ? 'voice' : 'typed');
    }
  }, [config.mode]);

  // Audio / Speech Hooks
  const speech = useSpeechSynthesis();
  const micTest = useMicrophoneTest();
  const speechRecAnswer = useSpeechRecognition({
    initialTranscript: answerText,
    onTranscriptChange: (text) => setAnswerText(text),
  });
  const speechRecRetry = useSpeechRecognition({
    initialTranscript: retryAnswerText,
    onTranscriptChange: (text) => setRetryAnswerText(text),
  });

  const speechRef = useRef(speech);
  speechRef.current = speech;
  const speechRecAnswerRef = useRef(speechRecAnswer);
  speechRecAnswerRef.current = speechRecAnswer;
  const speechRecRetryRef = useRef(speechRecRetry);
  speechRecRetryRef.current = speechRecRetry;
  const currentSessionIdRef = useRef<string | null>(currentSessionId);
  currentSessionIdRef.current = currentSessionId;

  // Ref to prevent duplicate auto-spoken questions on re-render
  const lastSpokenQuestionRef = useRef<string>('');

  // Auto-speak question when loaded in voice mode (prevent duplicate on re-renders)
  useEffect(() => {
    if (
      currentStage === 'answering' &&
      currentQuestion?.questionText &&
      currentMode === 'voice' &&
      lastSpokenQuestionRef.current !== currentQuestion.questionText
    ) {
      lastSpokenQuestionRef.current = currentQuestion.questionText;
      speech.speak(currentQuestion.questionText);
    }
  }, [currentStage, currentQuestion?.questionText, currentMode, speech]);

  // Clean up all audio and speech recognition on unmount
  useEffect(() => {
    return () => {
      speech.stop();
      speechRecAnswer.stopListening();
      speechRecRetry.stopListening();
      micTest.stopTest();
    };
  }, [speech, speechRecAnswer, speechRecRetry, micTest]);

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
  const loadNextQuestion = useCallback(
    async (targetSessionId?: string) => {
      speechRef.current.stop();
      speechRecAnswerRef.current.stopListening();
      speechRecRetryRef.current.stopListening();
      lastSpokenQuestionRef.current = '';

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
      setSaveError(null);

      let generatedQ: GeneratedQuestion;
      try {
        generatedQ = await generateQuestionApi({
          track: config.track,
          topic: config.topic,
          difficulty: config.difficulty,
          targetRole: profile?.targetRole || undefined,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to generate interview question.';
        setQuestionError(msg);
        generatedQ = getConciseFallbackQuestion(config.track, config.topic, config.difficulty);
      }

      setCurrentQuestion(generatedQ);
      setCurrentStage('answering');
      setIsGenerating(false);

      // Persist generated question to Supabase if session active
      const sessionIdToUse = targetSessionId || currentSessionIdRef.current;
      if (sessionIdToUse && user && isDatabaseReady()) {
        try {
          const interaction = await saveGeneratedQuestion({
            sessionId: sessionIdToUse,
            userId: user.id,
            track: config.track,
            topic: config.topic,
            difficulty: config.difficulty,
            question: generatedQ,
          });
          setCurrentInteractionId(interaction.id);
          setSaveStatus('saved');
        } catch (dbErr: unknown) {
          const msg = dbErr instanceof Error ? dbErr.message : 'Database error';
          console.warn('[EchoTutor Studio] Question save warning:', msg);
          setSaveError('Notice: Could not sync question to database. You can continue practicing in local memory.');
          setSaveStatus('error');
        }
      }
    },
    [config.track, config.topic, config.difficulty, profile?.targetRole, user]
  );

  const loadNextQuestionRef = useRef(loadNextQuestion);
  loadNextQuestionRef.current = loadNextQuestion;

  // Restore or Create Session on Mount
  useEffect(() => {
    let isMounted = true;
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    const initOrRestore = async () => {
      setIsRestoringSession(true);
      setSessionRestoreNotice(null);

      // Failsafe timer: after 4s, never leave candidate stuck in restoring screen
      safetyTimer = setTimeout(() => {
        if (isMounted) {
          console.warn('[EchoTutor Studio] Session restoration timed out; entering active studio.');
          setIsRestoringSession(false);
          loadNextQuestionRef.current();
        }
      }, 4000);

      try {
        if (user && isDatabaseReady()) {
          try {
            const active = await findActiveSession(user.id, config.track);
            if (active && isMounted) {
              const interactions = await loadSessionInteractions(active.id, user.id);
              if (interactions.length > 0 && isMounted) {
                setCurrentSessionId(active.id);
                setPersistenceMode('database-verified');

                const sessionMax = getTotalQuestionsForDifficulty(active.difficulty || config.difficulty);
                const evaluatedList = interactions.filter((i) => i.overallScore != null);
                const scoreSum = evaluatedList.reduce((acc, i) => acc + (i.overallScore || 0), 0);
                const resolvedCount = interactions.filter((i) => i.isWeaknessResolved).length;

                setVerifiedAttempts(evaluatedList.length);
                setTotalScoreSum(scoreSum);
                setWeaknessesResolvedCount(resolvedCount);
                setQuestionCount(Math.min(sessionMax, Math.max(1, interactions.length)));

                const latest = interactions[interactions.length - 1];
                setCurrentInteractionId(latest.id);
                setCurrentQuestion({
                  questionText: latest.questionText,
                  expectedRubric: latest.expectedRubric,
                  focusSkill:
                    latest.weakestSkill ||
                    (config.track === 'technical'
                      ? 'Partition Tolerance & Trade-Offs'
                      : 'STAR Conflict Resolution'),
                  targetRoleRelevance: `Core competency evaluated for ${
                    profile?.targetRole || 'Software Engineering'
                  }.`,
                });

                if (!latest.answerText || latest.overallScore == null) {
                  // Question generated, awaiting answer or evaluation was interrupted
                  setCurrentStage('answering');
                  if (latest.answerText) {
                    setAnswerText(latest.answerText);
                    setSessionRestoreNotice(
                      `Resumed draft response for Question ${interactions.length} of ${sessionMax}. You can review and submit.`
                    );
                  } else {
                    setSessionRestoreNotice(
                      `Resumed in-progress session (Question ${interactions.length} of ${sessionMax}).`
                    );
                  }
                } else if (latest.overallScore != null && !latest.lessonTitle) {
                  // Answer evaluated
                  setAnswerText(latest.answerText);
                  setEvaluation({
                    overallScore: latest.overallScore,
                    technicalAccuracy: latest.technicalAccuracy || 0,
                    reasoningTradeoff: latest.reasoningScore || 0,
                    structureClarity: latest.structureScore || 0,
                    strengths: latest.strengths,
                    weaknesses: latest.weaknesses,
                    weakestSkill: latest.weakestSkill || 'Reasoning Trade-offs',
                    explanationOfMissing: 'Restored evaluation from your previous session.',
                    actionableNextSteps: ['Review weakness lesson to practice targeted retry.'],
                    isContentOnly: false,
                  });
                  setCurrentStage('evaluated');
                  setSessionRestoreNotice(
                    `Resumed evaluated response from previous session (Question ${interactions.length}).`
                  );
                } else if (latest.lessonTitle && !latest.retryAnswer) {
                  // Lesson generated, waiting for retry
                  setAnswerText(latest.answerText);
                  setEvaluation({
                    overallScore: latest.overallScore || 0,
                    technicalAccuracy: latest.technicalAccuracy || 0,
                    reasoningTradeoff: latest.reasoningScore || 0,
                    structureClarity: latest.structureScore || 0,
                    strengths: latest.strengths,
                    weaknesses: latest.weaknesses,
                    weakestSkill: latest.weakestSkill || 'Reasoning Trade-offs',
                    explanationOfMissing: 'Restored evaluation.',
                    actionableNextSteps: [],
                    isContentOnly: false,
                  });
                  setWeaknessLesson({
                    conceptTitle: latest.lessonTitle,
                    conceptExplanation: latest.lessonExplanation || '',
                    realWorldExample: latest.realWorldExample || '',
                    microExerciseQuestion: latest.microExerciseQuestion || '',
                    exerciseHint: latest.exerciseHint || '',
                  });
                  setCurrentStage('retrying');
                  setSessionRestoreNotice(
                    `Resumed targeted weakness lesson and practice exercise for Question ${interactions.length}.`
                  );
                } else if (latest.retryScore != null) {
                  // Retry evaluated
                  setAnswerText(latest.answerText);
                  setRetryAnswerText(latest.retryAnswer || '');
                  setEvaluation({
                    overallScore: latest.overallScore || 0,
                    technicalAccuracy: latest.technicalAccuracy || 0,
                    reasoningTradeoff: latest.reasoningScore || 0,
                    structureClarity: latest.structureScore || 0,
                    strengths: latest.strengths,
                    weaknesses: latest.weaknesses,
                    weakestSkill: latest.weakestSkill || 'Reasoning Trade-offs',
                    explanationOfMissing: 'Restored evaluation.',
                    actionableNextSteps: [],
                    isContentOnly: false,
                  });
                  setRetryEvaluation({
                    originalScore: latest.overallScore || 0,
                    newScore: latest.retryScore,
                    improvementDelta: latest.improvementDelta || 0,
                    isWeaknessResolved: latest.isWeaknessResolved,
                    comparisonFeedback: latest.retryComparisonFeedback || 'Restored retry evaluation.',
                    improvementEvidence: latest.retryEvidence,
                    progressionEligible: latest.isWeaknessResolved,
                    progressionExplanation: latest.isWeaknessResolved
                      ? 'Weakness resolution verified.'
                      : 'Unresolved weakness retains deficits.',
                  });
                  setCurrentStage('retry-evaluated');
                  setSessionRestoreNotice(
                    `Resumed completed retry verification for Question ${interactions.length}.`
                  );
                }

                setIsRestoringSession(false);
                return;
              } else if (isMounted) {
                // Active session exists without interactions yet: reuse it and load question 1
                setCurrentSessionId(active.id);
                setPersistenceMode('database-verified');
                setIsRestoringSession(false);
                loadNextQuestionRef.current(active.id);
                return;
              }
            }

            // No existing active session to restore: initialize new session
            const created = await createSession({
              userId: user.id,
              track: config.track,
              difficulty: config.difficulty,
              topic: config.topic,
              mode: config.mode,
            });

            if (isMounted) {
              setCurrentSessionId(created.id);
              setPersistenceMode('database-verified');
              setIsRestoringSession(false);
              loadNextQuestionRef.current(created.id);
              return;
            }
          } catch (err: unknown) {
            console.warn('[EchoTutor Studio] Session init notice:', err);
            if (isMounted) {
              setPersistenceMode('in-memory');
            }
          }
        }

        if (isMounted) {
          setIsRestoringSession(false);
          loadNextQuestionRef.current();
        }
      } finally {
        if (safetyTimer) clearTimeout(safetyTimer);
        if (isMounted) {
          setIsRestoringSession(false);
        }
      }
    };

    initOrRestore();
    return () => {
      isMounted = false;
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, [user?.id, config.track, config.difficulty, config.topic, config.mode]);

  // Submit Answer for Evaluation
  const handleSubmitAnswer = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!answerText.trim() || isEvaluating || !currentQuestion) return;

    speech.stop();
    speechRecAnswer.stopListening();

    setIsEvaluating(true);
    setEvaluationError(null);
    setCurrentStage('evaluating');

    try {
      const evalResult = await evaluateAnswerApi({
        questionText: currentQuestion.questionText,
        expectedRubric: currentQuestion.expectedRubric,
        rubricDetail: currentQuestion.rubricDetail,
        answerText: answerText.trim(),
        track: config.track,
        topic: config.topic,
        difficulty: config.difficulty,
      });

      setEvaluation(evalResult);
      setVerifiedAttempts((prev) => prev + 1);
      setTotalScoreSum((prev) => prev + evalResult.overallScore);
      setCurrentStage('evaluated');

      // Database persistence
      if (currentInteractionId && currentSessionId && user && isDatabaseReady()) {
        setSaveStatus('saving');
        try {
          await saveAnswerEvaluation({
            interactionId: currentInteractionId,
            sessionId: currentSessionId,
            userId: user.id,
            answerText: answerText.trim(),
            evaluation: evalResult,
          });
          setSaveStatus('saved');
          setSaveError(null);
        } catch (dbErr: unknown) {
          const msg = dbErr instanceof Error ? dbErr.message : 'Database error';
          console.warn('[EchoTutor Persistence] saveAnswerEvaluation failed:', msg);
          setSaveError('Notice: Could not save evaluation to cloud database. Your answer remains safe in local memory.');
          setSaveStatus('error');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Evaluation service error.';
      setEvaluationError(msg);
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

      if (currentInteractionId && user && isDatabaseReady()) {
        try {
          await saveWeaknessLesson({
            interactionId: currentInteractionId,
            userId: user.id,
            lesson,
          });
        } catch (dbErr) {
          console.warn('[EchoTutor Persistence] saveWeaknessLesson warning:', dbErr);
        }
      }
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

    speech.stop();
    speechRecRetry.stopListening();

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

      // Database persistence
      if (currentInteractionId && currentSessionId && user && isDatabaseReady()) {
        setSaveStatus('saving');
        try {
          await saveRetryEvaluation({
            interactionId: currentInteractionId,
            sessionId: currentSessionId,
            userId: user.id,
            retryAnswerText: retryAnswerText.trim(),
            retryEval: retryResult,
          });
          setSaveStatus('saved');
          setSaveError(null);

          // Verify progression with database anti-tamper RPC
          const progResult = await verifyAndRecordProgression({
            sessionId: currentSessionId,
            track: config.track,
            userId: user.id,
            difficulty: config.difficulty,
          });

          if (progResult.eligible) {
            setProgressionNotice(
              `Advancement verified! Promoted to ${progResult.levelAchieved?.toUpperCase()} based on stored evidence.`
            );
          }
        } catch (dbErr: unknown) {
          const msg = dbErr instanceof Error ? dbErr.message : 'Retry save error';
          console.warn('[EchoTutor Persistence] saveRetryEvaluation failed:', msg);
          setSaveError('Retry verification was not saved to database. Your result remains visible in this session.');
          setSaveStatus('error');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Retry evaluation service error.';
      setRetryError(msg);
      setCurrentStage('retrying');
    } finally {
      setIsEvaluatingRetry(false);
    }
  };

  // Retry Failed Database Save Action
  const handleRetryFailedSave = async () => {
    if (!currentInteractionId || !currentSessionId || !user || !isDatabaseReady()) return;
    setSaveStatus('saving');
    try {
      if (evaluation && answerText) {
        await saveAnswerEvaluation({
          interactionId: currentInteractionId,
          sessionId: currentSessionId,
          userId: user.id,
          answerText,
          evaluation,
        });
      }
      if (retryEvaluation && retryAnswerText) {
        await saveRetryEvaluation({
          interactionId: currentInteractionId,
          sessionId: currentSessionId,
          userId: user.id,
          retryAnswerText,
          retryEval: retryEvaluation,
        });
      }
      setSaveStatus('saved');
      setSaveError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save retry failed';
      setSaveError(msg);
      setSaveStatus('error');
    }
  };

  // Start Fresh Session Action
  const handleStartFreshSession = async () => {
    speech.stop();
    speechRecAnswer.stopListening();
    speechRecRetry.stopListening();
    micTest.stopTest();

    if (currentSessionId && user && isDatabaseReady()) {
      await updateSessionStatus({
        sessionId: currentSessionId,
        userId: user.id,
        status: 'abandoned',
      });
    }
    setCurrentSessionId(null);
    setCurrentInteractionId(null);
    setVerifiedAttempts(0);
    setTotalScoreSum(0);
    setWeaknessesResolvedCount(0);
    setQuestionCount(1);
    setSessionRestoreNotice(null);
    setSaveError(null);
    setProgressionNotice(null);
    setSaveStatus('idle');

    if (user && isDatabaseReady()) {
      try {
        const newSession = await createSession({
          userId: user.id,
          track: config.track,
          difficulty: config.difficulty,
          topic: config.topic,
          mode: config.mode,
        });
        setCurrentSessionId(newSession.id);
        setPersistenceMode('database-verified');
        loadNextQuestion(newSession.id);
        return;
      } catch (err) {
        console.warn('Fresh session creation error:', err);
      }
    }
    loadNextQuestion();
  };

  // Advance to Next Question or Complete Session
  const handleAdvanceNextQuestion = async () => {
    if (isAdvancing || isGenerating) return;
    setIsAdvancing(true);
    try {
      if (questionCount < maxQuestions) {
        setQuestionCount((prev) => prev + 1);
        await loadNextQuestion();
      } else {
        await handleFinishSession();
      }
    } finally {
      setIsAdvancing(false);
    }
  };

  // Complete / Finish Session Action
  const handleFinishSession = async () => {
    speech.stop();
    speechRecAnswer.stopListening();
    speechRecRetry.stopListening();
    micTest.stopTest();

    if (currentSessionId && user && isDatabaseReady()) {
      await updateSessionStatus({
        sessionId: currentSessionId,
        userId: user.id,
        status: 'completed',
        overallScore: averageScore,
        feedbackSummary: `Completed ${verifiedAttempts} of ${maxQuestions} questions with ${weaknessesResolvedCount} resolved weaknesses.`,
      });
    }
    setCurrentStage('progression-summary');
  };

  // Evidence Progression Calculation
  const averageScore = verifiedAttempts > 0 ? Math.round(totalScoreSum / verifiedAttempts) : 0;
  const hasActiveUnresolvedWeakness =
    retryEvaluation !== null && !retryEvaluation.isWeaknessResolved;
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

  const handleBackToSetupSafe = () => {
    speech.stop();
    speechRecAnswer.stopListening();
    speechRecRetry.stopListening();
    micTest.stopTest();
    if (currentSessionId && user && isDatabaseReady()) {
      updateSessionStatus({
        sessionId: currentSessionId,
        userId: user.id,
        status: 'in-progress',
        overallScore: averageScore > 0 ? averageScore : undefined,
        feedbackSummary: `In-progress: ${verifiedAttempts} of ${maxQuestions} questions answered.`,
      }).catch((e) => console.warn('[EchoTutor Persistence] setup exit notice:', e));
    }
    onBackToSetup();
  };

  const handleExitHomeSafe = () => {
    speech.stop();
    speechRecAnswer.stopListening();
    speechRecRetry.stopListening();
    micTest.stopTest();
    if (currentSessionId && user && isDatabaseReady()) {
      updateSessionStatus({
        sessionId: currentSessionId,
        userId: user.id,
        status: 'in-progress',
        overallScore: averageScore > 0 ? averageScore : undefined,
        feedbackSummary: `In-progress: ${verifiedAttempts} of ${maxQuestions} questions answered.`,
      }).catch((e) => console.warn('[EchoTutor Persistence] dashboard exit notice:', e));
    }
    onExitHome();
  };

  // Live Session Duration Timer
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsedTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleToggleMicTest = async () => {
    if (micTest.isTesting) {
      micTest.stopTest();
    } else {
      await micTest.startTest();
    }
  };

  if (isRestoringSession) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-24 flex flex-col items-center justify-center text-center font-inria animate-fadeIn">
        <Loader2 className="w-10 h-10 text-[#00F0FF] animate-spin mb-4" />
        <span className="font-anton text-2xl text-white uppercase tracking-wider">
          Restoring Persistent Studio Session
        </span>
        <p className="text-xs font-mono text-[#9EA6B0] mt-2">
          Syncing questions, evaluation rubrics, and remediation evidence from encrypted database...
        </p>
        <button
          type="button"
          onClick={() => {
            setIsRestoringSession(false);
            if (!currentQuestion) loadNextQuestionRef.current();
          }}
          className="mt-6 px-4 py-2 rounded-lg bg-[#14181B] border border-white/[0.1] hover:border-[#00F0FF]/40 text-xs font-mono text-[#00F0FF] hover:bg-[#1B2126] transition-all"
        >
          Skip Waiting & Enter Studio →
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0A0B0D] text-[#F8FAFC] font-inter">
      {/* 1. Stitch Compact Studio Sticky Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0A0B0D]/90 backdrop-blur-xl border-b border-white/[0.08] z-50 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] shadow-[0_0_10px_#00F0FF] animate-pulse" />
            <span className="font-syne font-bold text-sm sm:text-base tracking-wide text-white uppercase hidden sm:inline">
              EchoTutor<span className="text-[#00F0FF]">.AI</span>
            </span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#14181B] border border-white/[0.08]">
            <Timer className="w-3.5 h-3.5 text-[#00F0FF] animate-pulse" />
            <span className="font-mono text-xs text-[#F8FAFC] font-semibold">{formatElapsedTimer(sessionElapsedSeconds)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
              config.difficulty.toLowerCase().includes('hard')
                ? 'bg-[#FF3B30]/15 text-[#FF3B30] border-[#FF3B30]/40'
                : config.difficulty.toLowerCase().includes('medium')
                ? 'bg-[#FFB800]/15 text-[#FFB800] border-[#FFB800]/40'
                : 'bg-[#00FF85]/15 text-[#00FF85] border-[#00FF85]/40'
            }`}>
              {config.difficulty.toUpperCase()}
            </span>
            <span className="font-mono text-xs text-[#9EA6B0] hidden md:inline">
              TRACK: <strong className="text-[#00F0FF]">{config.track === 'technical' ? 'Technical Defense' : 'HR & Behavioral'}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio Active / Mic Test Sensor Toggle */}
          <button
            type="button"
            id="voiceToggleBtn"
            onClick={handleToggleMicTest}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              micTest.isTesting
                ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                : currentMode === 'voice'
                ? 'bg-[#14181B] hover:bg-[#1B2126] border-[#00F0FF]/30 text-[#00F0FF]'
                : 'bg-[#14181B] hover:bg-[#1B2126] border-white/[0.08] text-[#9EA6B0]'
            }`}
            title="Acoustic sensor live test & calibration"
          >
            <Mic className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline uppercase">
              {micTest.isTesting ? 'Mic Live' : currentMode === 'voice' ? 'Audio Active' : 'Audio Muted'}
            </span>
            {/* Live Audio Bars Micro-visualization */}
            <div className="flex items-end gap-0.5 h-3 ml-0.5">
              <span className={`w-0.5 rounded-full ${micTest.isTesting || currentMode === 'voice' ? 'h-2 bg-[#00F0FF] animate-pulse' : 'h-1 bg-white/20'}`} />
              <span className={`w-0.5 rounded-full ${micTest.isTesting || currentMode === 'voice' ? 'h-3 bg-[#00F0FF] animate-bounce' : 'h-1.5 bg-white/20'}`} />
              <span className={`w-0.5 rounded-full ${micTest.isTesting || currentMode === 'voice' ? 'h-2.5 bg-[#00F0FF] animate-pulse' : 'h-1 bg-white/20'}`} />
            </div>
          </button>

          {/* Mode Switcher */}
          <button
            type="button"
            id="studio-toggle-mode-btn"
            onClick={() => {
              speechRecAnswer.stopListening();
              speechRecRetry.stopListening();
              setCurrentMode((prev) => (prev === 'voice' ? 'typed' : 'voice'));
            }}
            className="text-xs font-mono text-[#9EA6B0] hover:text-[#00F0FF] transition-colors inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14181B] hover:bg-[#1B2126] border border-white/[0.08] uppercase tracking-wider"
            title="Toggle Voice (Speech-to-Text) / Silent Typed Mode"
          >
            {currentMode === 'voice' ? (
              <>
                <Keyboard className="w-3.5 h-3.5 text-[#9EA6B0]" />
                <span className="hidden md:inline">Typed Mode</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span className="hidden md:inline">Voice Mode</span>
              </>
            )}
          </button>

          {/* Reconfigure Setup */}
          <button
            type="button"
            id="studio-reconfigure-btn"
            onClick={handleBackToSetupSafe}
            title="Adjust interview track or difficulty setup"
            className="text-xs font-mono text-[#9EA6B0] hover:text-[#00F0FF] transition-colors inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#14181B] hover:bg-[#1B2126] border border-white/[0.08] uppercase tracking-wider"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Setup</span>
          </button>

          {/* Reset / Start Fresh */}
          <button
            type="button"
            onClick={handleStartFreshSession}
            title="Archive current in-progress session and start fresh"
            className="text-xs font-mono text-[#9EA6B0] hover:text-[#00F0FF] transition-colors inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#14181B] hover:bg-[#1B2126] border border-white/[0.08] uppercase tracking-wider"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Reset</span>
          </button>

          {/* Safe Exit Session (preserves in-progress state) */}
          <button
            type="button"
            onClick={handleExitHomeSafe}
            className="font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-lg bg-[#FF3B30]/15 text-[#FF3B30] border border-[#FF3B30]/30 hover:bg-[#FF3B30] hover:text-white transition-all inline-flex items-center gap-1.5"
            title="Safely exit to Candidate Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body with 64px Top Offset for Fixed Header */}
      <div className="pt-20 pb-12 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col font-inter">
        {/* 2. Diagnostic Sequence Stepper & Progress Strip */}
        <div className="w-full bg-[#14181B]/90 backdrop-blur-md border border-white/[0.08] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 mb-6 shadow-lg">
          {/* Step 1 to 4 */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {/* Step 1: Assess */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              currentStage === 'answering' || currentStage === 'evaluating'
                ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 font-bold'
                : verifiedAttempts > 0
                ? 'bg-[#1B2126] text-[#00FF85]'
                : 'bg-[#14181B] text-[#9EA6B0]'
            }`}>
              {verifiedAttempts > 0 && currentStage !== 'answering' && currentStage !== 'evaluating' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF85]" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
              )}
              <span className="uppercase tracking-wider">Step 1: Assess</span>
            </div>
            <span className="text-white/20 font-mono text-xs">/</span>

            {/* Step 2: Diagnose */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              currentStage === 'evaluated'
                ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 font-bold'
                : evaluation
                ? 'bg-[#1B2126] text-[#00FF85]'
                : 'bg-[#0A0B0D] text-[#9EA6B0]/60'
            }`}>
              {evaluation && currentStage !== 'evaluated' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF85]" />
              ) : (
                <span className="text-xs text-[#9EA6B0]">02</span>
              )}
              <span className="uppercase tracking-wider">Step 2: Diagnose</span>
            </div>
            <span className="text-white/20 font-mono text-xs">/</span>

            {/* Step 3: Teach */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              currentStage === 'teaching-weakness' || currentStage === 'retrying'
                ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 font-bold'
                : retryEvaluation
                ? 'bg-[#1B2126] text-[#00FF85]'
                : 'bg-[#0A0B0D] text-[#9EA6B0]/60'
            }`}>
              {retryEvaluation ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF85]" />
              ) : (
                <span className="text-xs text-[#9EA6B0]">03</span>
              )}
              <span className="uppercase tracking-wider">Step 3: Teach</span>
            </div>
            <span className="text-white/20 font-mono text-xs">/</span>

            {/* Step 4: Verify */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              currentStage === 'evaluating-retry' || currentStage === 'retry-evaluated' || currentStage === 'progression-summary'
                ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 font-bold'
                : 'bg-[#0A0B0D] text-[#9EA6B0]/60'
            }`}>
              <span className="text-xs text-[#9EA6B0]">04</span>
              <span className="uppercase tracking-wider">Step 4: Verify</span>
            </div>
          </div>

          {/* Progress Bar & Question Counter */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs font-mono text-[#9EA6B0] uppercase">Progress:</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
                  QUESTION {questionCount} / {maxQuestions}
                </span>
              </div>
              <div className="w-36 sm:w-48 h-1.5 rounded-full bg-[#0A0B0D] border border-white/[0.08] overflow-hidden mt-1">
                <div
                  role="progressbar"
                  aria-valuenow={Math.min(100, Math.round((verifiedAttempts / maxQuestions) * 100))}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Interview progress: ${verifiedAttempts} of ${maxQuestions} questions completed`}
                  className="h-full bg-gradient-to-r from-[#00F0FF] to-[#00FF85] rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(0,240,255,0.4)]"
                  style={{ width: `${Math.min(100, (verifiedAttempts / maxQuestions) * 100)}%` }}
                />
              </div>
            </div>
            {verifiedAttempts > 0 && currentStage !== 'progression-summary' && (
              <button
                type="button"
                onClick={handleFinishSession}
                className="text-[11px] font-mono px-3 py-1.5 rounded-lg bg-[#14181B] hover:bg-[#1B2126] text-[#00F0FF] border border-[#00F0FF]/30 transition-colors uppercase tracking-wider"
              >
                Debrief
              </button>
            )}
          </div>
        </div>

        {/* Resumed Session Alert Banner */}
        {sessionRestoreNotice && (
          <div className="w-full mb-6 p-4 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-[#00F0FF] animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 shrink-0 text-[#00F0FF]" />
              <span>{sessionRestoreNotice}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSessionRestoreNotice(null)}
                className="px-2.5 py-1 rounded bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-white font-bold text-[10px] uppercase"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleStartFreshSession}
                className="px-2.5 py-1 rounded border border-white/20 hover:bg-white/10 text-[#9EA6B0] hover:text-white text-[10px] uppercase"
              >
                Start Fresh
              </button>
            </div>
          </div>
        )}

        {/* Progression Notice Banner */}
        {progressionNotice && (
          <div className="w-full mb-6 p-4 rounded-xl bg-[#00FF85]/15 border border-[#00FF85]/50 flex items-center gap-3 text-xs font-mono text-[#00FF85] animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-bold">{progressionNotice}</span>
          </div>
        )}

        {/* Save Error Notice Banner */}
        {saveError && (
          <div className="w-full mb-6 p-4 rounded-xl bg-[#FF3B30]/15 border border-[#FF3B30]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-white animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#FF3B30] shrink-0 mt-0.5" />
              <div>
                <span className="text-[#FF3B30] font-bold uppercase tracking-wider block">
                  Database Sync Notice
                </span>
                <span className="text-[#9EA6B0] mt-0.5 block">{saveError}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRetryFailedSave}
              disabled={saveStatus === 'saving'}
              className="px-3.5 py-1.5 rounded-lg bg-[#FF3B30]/20 hover:bg-[#FF3B30]/30 border border-[#FF3B30]/50 text-white font-bold text-xs uppercase shrink-0 inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${saveStatus === 'saving' ? 'animate-spin' : ''}`} />
              <span>Retry Cloud Sync</span>
            </button>
          </div>
        )}

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

        {/* Main Studio Console Grid */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-8">
          {/* Left Column: Question, Response & Evaluation (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Focused Interview Question Card */}
            <div className="relative bg-[#14181B] border border-white/[0.08] rounded-xl p-6 shadow-xl overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#00F0FF]/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between gap-4 mb-4 border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#1B2126] text-[#00F0FF] font-mono text-[11px] font-bold">
                    PROMPT #{config.topic.slice(0, 3).toUpperCase()}-{String(questionCount).padStart(2, '0')}
                  </span>
                  <span className="font-mono text-[11px] text-[#9EA6B0] uppercase hidden sm:inline">
                    {config.track === 'technical' ? 'Runtime Constraints: Sub-10ms SLAs' : 'STAR Competency Evaluation'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00FF85] animate-pulse" />
                  <span className="font-mono text-[11px] text-[#9EA6B0]">
                    {currentMode === 'voice' ? 'Acoustic Sensor Ready' : 'Silent Editor Active'}
                  </span>
                </div>
              </div>

              {questionError && (
                <div className="mb-4 p-3 rounded bg-[#FFB800]/10 border border-[#FFB800]/30 text-xs font-mono text-[#FFB800] flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Notice: {questionError} (Operating with domain backup question)</span>
                </div>
              )}

              {isGenerating ? (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin mb-3" />
                  <span className="text-xs font-mono text-[#9EA6B0]">
                    Synthesizing question for {config.difficulty} difficulty...
                  </span>
                </div>
              ) : currentQuestion ? (
                <div className="space-y-4">
                  <h1 className="font-syne text-lg sm:text-xl font-bold text-[#F8FAFC] leading-snug">
                    {currentQuestion.questionText}
                  </h1>

                  {/* AI Interviewer Voice Prompter */}
                  <QuestionVoiceSpeaker
                    questionText={currentQuestion.questionText}
                    speech={speech}
                  />

                  {/* Rubric Criteria Taxonomy Badges */}
                  <div className="pt-2 border-t border-white/[0.08]">
                    <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block mb-2 font-bold tracking-wider">
                      INTERNAL EVALUATION RUBRIC:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {currentQuestion.expectedRubric.map((r, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#0A0B0D] border border-white/[0.08] text-[#9EA6B0] flex items-center gap-1.5"
                        >
                          <span className="text-[#00F0FF]">✓</span> {r}
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
              <div className="space-y-4">
                {/* Evaluation Error Alert with Retry Action */}
                {evaluationError && (
                  <div className="p-4 rounded-xl bg-[#FF3B30]/15 border border-[#FF3B30]/40 text-[#FFFFFF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_16px_rgba(255,59,48,0.15)]">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-[#FF3B30] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-mono text-xs uppercase tracking-wider text-[#FF3B30] font-bold block">
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
                      className="px-4 py-2 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] text-[#0A0B0D] font-mono font-bold text-xs uppercase tracking-wider shrink-0 inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Evaluation</span>
                    </button>
                  </div>
                )}

                {currentMode === 'voice' ? (
                  /* Voice Speech Console with Live Audio Meter & Editable Transcript */
                  <VoiceSpeechConsole
                    speechRec={speechRecAnswer}
                    micTest={micTest}
                    value={answerText}
                    onChange={setAnswerText}
                    onSubmit={() => handleSubmitAnswer()}
                    isSubmitting={isEvaluating}
                    submitButtonText="Submit Answer for AI Evaluation"
                    onSwitchToTyped={() => {
                      speechRecAnswer.stopListening();
                      setCurrentMode('typed');
                    }}
                    placeholder="Your spoken response will be transcribed here in real-time. You can edit the text before submitting..."
                    guideTitle={config.track === 'technical' ? 'Technical Architecture Guide' : 'Behavioral STAR Guide'}
                    guideText={
                      config.track === 'technical'
                        ? 'Structure with: 1. Core Mechanism / Pattern, 2. Complexity & Scalability, 3. Trade-offs & Failure Handling.'
                        : 'Use the STAR method: Situation, Task, Specific Action, Quantifiable Result.'
                    }
                    idPrefix="initial-answer-voice"
                  />
                ) : (
                  /* Stitch High-Fidelity Typed Mode Terminal Workspace */
                  <form onSubmit={handleSubmitAnswer} className="bg-[#0A0B0D] border border-white/[0.08] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                    {/* Terminal Tab Bar */}
                    <div className="bg-[#14181B] px-4 pt-3 flex items-center justify-between gap-4 border-b border-white/[0.08]">
                      <div className="flex items-center gap-1">
                        <div className="px-4 py-2 rounded-t-lg bg-[#0A0B0D] border-t border-x border-white/[0.1] text-[#00F0FF] font-mono text-xs font-bold flex items-center gap-2">
                          <Terminal className="w-3.5 h-3.5 text-[#00F0FF]" />
                          <span>{config.track === 'technical' ? 'Architecture_Defense.md' : 'STAR_Response.md'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pb-2 text-[#9EA6B0] font-mono text-xs">
                        <span>UTF-8</span>
                        <span className="text-[#00FF85] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF85]" /> Auto-Saved
                        </span>
                      </div>
                    </div>

                    {/* Textarea Canvas */}
                    <div className="relative p-4 font-mono text-sm leading-relaxed text-[#F8FAFC]">
                      <textarea
                        id="initial-typed-answer-input"
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder={config.track === 'technical'
                          ? "Detail your system architecture, data flow, failure modes, and trade-offs..."
                          : "Describe the Situation, Task, your specific Action, and the quantifiable Result..."
                        }
                        rows={8}
                        className="w-full bg-transparent text-[#F8FAFC] font-mono placeholder:text-[#9EA6B0]/40 focus:outline-none resize-none leading-relaxed"
                        required
                      />
                    </div>

                    {/* Terminal Action Tray */}
                    <div className="pt-3 pb-3 px-4 flex flex-wrap items-center justify-between gap-4 bg-[#14181B]/80 border-t border-white/[0.08]">
                      <div className="flex items-center gap-4 text-[#9EA6B0] font-mono text-xs">
                        <span>WORDS: <strong className="text-white">{answerText.trim() ? answerText.trim().split(/\s+/).length : 0}</strong></span>
                        <span>CHARS: <strong className="text-white">{answerText.length}</strong></span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          id="initial-switch-voice-btn"
                          onClick={() => setCurrentMode('voice')}
                          className="px-3 py-2 rounded-lg bg-[#1B2126] hover:bg-[#222930] text-[#9EA6B0] hover:text-[#00F0FF] font-mono text-xs flex items-center gap-1.5 transition-all"
                        >
                          <Mic className="w-3.5 h-3.5 text-[#00F0FF]" />
                          <span>Voice Mode</span>
                        </button>
                        <button
                          type="submit"
                          disabled={!answerText.trim() || isEvaluating}
                          className="px-5 py-2 rounded-lg bg-[#00F0FF] text-[#0A0B0D] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-[#00D4E5] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-50"
                        >
                          {isEvaluating ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Evaluating...</span>
                            </>
                          ) : (
                            <>
                              <Cpu className="w-3.5 h-3.5" />
                              <span>Evaluate My Answer</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Evaluating Loading State */}
            {currentStage === 'evaluating' && (
              <div className="bg-[#14181B] border border-white/[0.08] rounded-xl p-8 text-center flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin mb-3" />
                <span className="font-syne text-xl font-bold text-white uppercase tracking-wide">
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
              <div className="bg-[#14181B] border border-white/[0.08] rounded-xl p-6 sm:p-7 relative space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div className="flex items-center gap-2.5">
                    <Award className="w-5 h-5 text-[#00F0FF]" />
                    <h3 className="font-syne text-2xl font-bold text-white uppercase tracking-wide">
                      Evaluation & Skill Diagnosis
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">Overall Score</span>
                    <span className="font-mono text-3xl font-black text-[#00F0FF]">{evaluation.overallScore}/100</span>
                  </div>
                </div>

                {evaluationError && (
                  <div className="p-3 rounded bg-[#FFB800]/10 border border-[#FFB800]/30 text-xs font-mono text-[#FFB800] flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Evaluation Notice: {evaluationError} (Generated via heuristic assessment)</span>
                  </div>
                )}

                {/* Evaluator Confidence / Ambiguity Note */}
                {evaluation.evaluatorNote && (
                  <div className="p-3 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-xs font-mono text-[#00F0FF] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse shrink-0" />
                    <span>{evaluation.evaluatorNote}</span>
                  </div>
                )}

                {/* Score Breakdown Pillars */}
                {evaluation.dimensionScores ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      <div className="p-3 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-center">
                        <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">Factual Correctness</span>
                        <span className="font-mono text-base sm:text-lg font-bold text-white mt-0.5 block">
                          {evaluation.dimensionScores.factualCorrectness}%
                        </span>
                        <span className="text-[9px] font-mono text-[#9EA6B0]">Weight {Math.round((evaluation.dimensionWeights?.factualCorrectness || 0.3) * 100)}%</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-center">
                        <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">Concept Coverage</span>
                        <span className="font-mono text-base sm:text-lg font-bold text-[#00F0FF] mt-0.5 block">
                          {evaluation.dimensionScores.conceptCoverage}%
                        </span>
                        <span className="text-[9px] font-mono text-[#9EA6B0]">Weight {Math.round((evaluation.dimensionWeights?.conceptCoverage || 0.25) * 100)}%</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-center">
                        <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">Reasoning Depth</span>
                        <span className="font-mono text-base sm:text-lg font-bold text-white mt-0.5 block">
                          {evaluation.dimensionScores.reasoningDepth}%
                        </span>
                        <span className="text-[9px] font-mono text-[#9EA6B0]">Weight {Math.round((evaluation.dimensionWeights?.reasoningDepth || 0.25) * 100)}%</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-center">
                        <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">Practical Defense</span>
                        <span className="font-mono text-base sm:text-lg font-bold text-white mt-0.5 block">
                          {evaluation.dimensionScores.practicalApplication}%
                        </span>
                        <span className="text-[9px] font-mono text-[#9EA6B0]">Weight {Math.round((evaluation.dimensionWeights?.practicalApplication || 0.1) * 100)}%</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-center col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">Structure Clarity</span>
                        <span className="font-mono text-base sm:text-lg font-bold text-white mt-0.5 block">
                          {evaluation.dimensionScores.communicationClarity}%
                        </span>
                        <span className="text-[9px] font-mono text-[#9EA6B0]">Weight {Math.round((evaluation.dimensionWeights?.communicationClarity || 0.1) * 100)}%</span>
                      </div>
                    </div>
                    {evaluation.scoreBreakdown && (
                      <span className="text-[10px] font-mono text-[#9EA6B0] block text-right">
                        {evaluation.scoreBreakdown}
                      </span>
                    )}
                  </div>
                ) : (
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
                )}

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

                  <div className="p-4 rounded-lg bg-[#0A0B0D] border border-[#FF3B30]/30 space-y-2">
                    <span className="text-xs font-mono text-[#FF3B30] font-bold uppercase tracking-wider block">
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
                    <h4 className="font-syne text-lg font-bold text-white uppercase tracking-wide mt-0.5">
                      {evaluation.weakestSkill}
                    </h4>
                    <p className="text-xs font-mono text-[#9EA6B0] mt-1">{evaluation.explanationOfMissing}</p>
                  </div>

                  {currentStage === 'evaluated' && (
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        id="fix-weakness-btn"
                        onClick={handleStartFixWeakness}
                        disabled={isGeneratingLesson || isAdvancing}
                        className="px-5 py-3 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] text-[#0A0B0D] font-mono font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-[0_0_16px_rgba(0,240,255,0.3)] shrink-0 disabled:opacity-50"
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

                      <button
                        type="button"
                        id="studio-next-question-btn"
                        onClick={handleAdvanceNextQuestion}
                        disabled={isAdvancing || isGeneratingLesson}
                        className="px-5 py-3 rounded-lg bg-[#1B2126] hover:bg-[#222930] border border-white/20 hover:border-[#00F0FF]/50 text-white hover:text-[#00F0FF] font-mono font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-all shrink-0 disabled:opacity-50"
                      >
                        {isAdvancing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#00F0FF]" />
                            <span>PREPARING...</span>
                          </>
                        ) : questionCount < maxQuestions ? (
                          <>
                            <span>Next Question ({questionCount + 1}/{maxQuestions})</span>
                            <ArrowRight className="w-4 h-4 text-[#00F0FF]" />
                          </>
                        ) : (
                          <>
                            <span>Complete Interview ({maxQuestions}/{maxQuestions})</span>
                            <CheckCircle2 className="w-4 h-4 text-[#00FF85]" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {lessonError && (
                  <div className="p-3 rounded bg-[#FF3B30]/15 border border-[#FF3B30]/30 text-xs font-mono text-white flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#FF3B30] shrink-0" />
                      <span>Lesson Synthesis Notice: {lessonError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartFixWeakness}
                      className="px-3 py-1.5 rounded bg-[#00F0FF] text-[#0A0B0D] font-mono font-bold text-xs uppercase shrink-0"
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
              <div className="bg-[#14181B] border border-[#00F0FF]/40 rounded-xl p-6 sm:p-7 relative space-y-6 shadow-2xl animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-5 h-5 text-[#00F0FF]" />
                    <div>
                      <span className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-wider font-bold block">
                        AI TUTOR // CONCEPT BREAKDOWN & RETRY
                      </span>
                      <h3 className="font-syne text-xl sm:text-2xl font-bold text-white uppercase tracking-wide">
                        {weaknessLesson.conceptTitle}
                      </h3>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] font-bold uppercase">
                    REMEDIAL TARGET
                  </span>
                </div>

                {/* Concept Lesson */}
                <div className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.08] space-y-2">
                  <span className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-wider font-bold block">
                    TEACHING BREAKDOWN:
                  </span>
                  <p className="text-xs sm:text-sm font-inter text-[#F8FAFC]/90 leading-relaxed">
                    {weaknessLesson.conceptExplanation}
                  </p>
                </div>

                {/* Real-World Pattern Example */}
                <div className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.08] space-y-2">
                  <span className="text-[10px] font-mono text-[#00FF85] uppercase tracking-wider font-bold block">
                    STANDARD OF EXCELLENCE EXAMPLE:
                  </span>
                  <p className="text-xs font-mono text-[#00FF85]/90 leading-relaxed bg-[#14181B] p-3 rounded border border-white/[0.05]">
                    {weaknessLesson.realWorldExample}
                  </p>
                </div>

                {/* Targeted Micro-Exercise */}
                <div className="p-4 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 space-y-2">
                  <span className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-wider font-bold block">
                    TARGETED PRACTICE EXERCISE:
                  </span>
                  <p className="text-sm font-inter text-white font-semibold leading-relaxed">
                    {weaknessLesson.microExerciseQuestion}
                  </p>
                  <span className="text-xs font-mono text-[#9EA6B0] block italic">
                    💡 Hint: {weaknessLesson.exerciseHint}
                  </span>
                </div>

                {/* Retry Input Form */}
                {currentStage === 'retrying' && (
                  <div className="space-y-4 pt-2">
                    {retryError && (
                      <div className="p-3 rounded bg-[#FF3B30]/15 border border-[#FF3B30]/30 text-xs font-mono text-white flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-[#FF3B30] shrink-0" />
                          <span>Verification Notice: {retryError}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSubmitRetry()}
                          className="px-3 py-1.5 rounded bg-[#00F0FF] text-[#0A0B0D] font-mono font-bold text-xs uppercase shrink-0"
                        >
                          Retry Verification
                        </button>
                      </div>
                    )}

                    {currentMode === 'voice' ? (
                      /* Voice Speech Console for Retry */
                      <VoiceSpeechConsole
                        speechRec={speechRecRetry}
                        micTest={micTest}
                        value={retryAnswerText}
                        onChange={setRetryAnswerText}
                        onSubmit={() => handleSubmitRetry()}
                        isSubmitting={isEvaluatingRetry}
                        submitButtonText="Verify Retry Improvement"
                        onSwitchToTyped={() => {
                          speechRecRetry.stopListening();
                          setCurrentMode('typed');
                        }}
                        placeholder="Apply the taught concept here to correct your original weakness. Include concrete trade-offs and metrics..."
                        guideTitle="Targeted Remediation Guide"
                        guideText={`Focus explicitly on correcting ${weaknessLesson.conceptTitle || evaluation?.weakestSkill}.`}
                        idPrefix="retry-answer-voice"
                      />
                    ) : (
                      /* Silent Typed Form for Retry */
                      <form onSubmit={handleSubmitRetry} className="bg-[#0A0B0D] border border-white/[0.08] rounded-xl p-4 sm:p-5 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                          <div className="flex items-center gap-2">
                            <Keyboard className="w-4 h-4 text-[#00F0FF]" />
                            <span className="text-xs font-mono text-white uppercase tracking-wider font-bold">
                              SUBMIT REVISED RETRY ANSWER (TYPED MODE)
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              id="retry-switch-voice-btn"
                              onClick={() => setCurrentMode('voice')}
                              className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#14181B] hover:bg-[#1B2126] border border-white/[0.08] text-[#9EA6B0] hover:text-[#00F0FF] inline-flex items-center gap-1.5 transition-all"
                              title="Switch to Voice Mode for Retry"
                            >
                              <Mic className="w-3 h-3 text-[#00F0FF]" />
                              <span>Voice Mode</span>
                            </button>
                            <span className="text-[11px] font-mono text-[#9EA6B0]">
                              {retryAnswerText.trim() ? retryAnswerText.trim().split(/\s+/).length : 0} words
                            </span>
                          </div>
                        </div>

                        <textarea
                          id="retry-typed-answer-input"
                          value={retryAnswerText}
                          onChange={(e) => setRetryAnswerText(e.target.value)}
                          placeholder="Apply the taught concept here to correct your original weakness. Include concrete trade-offs and metrics..."
                          rows={6}
                          className="w-full bg-[#14181B] text-[#FFFFFF] text-sm font-mono placeholder:text-[#9EA6B0]/40 p-4 rounded-lg border border-white/[0.1] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] focus:outline-none transition-all leading-relaxed"
                          required
                        />

                        <button
                          type="submit"
                          disabled={!retryAnswerText.trim() || isEvaluatingRetry}
                          className="w-full min-h-[46px] px-6 py-3 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] text-[#0A0B0D] font-mono font-bold text-sm tracking-wider uppercase inline-flex items-center justify-center gap-2 transition-all shadow-[0_0_16px_rgba(0,240,255,0.3)] disabled:opacity-50"
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
                  </div>
                )}

                {/* Retry Improvement Verification Results (Side-by-Side Comparison) */}
                {currentStage === 'retry-evaluated' && retryEvaluation && (
                  <div className="p-5 rounded-lg bg-[#0A0B0D] border border-white/[0.08] space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#00FF85]" />
                        <span className="font-syne text-lg font-bold text-white uppercase tracking-wide">
                          Historical Delta Verification
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-[#9EA6B0]">
                          Original: <strong className="text-white">{retryEvaluation.originalScore}</strong>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#00F0FF]" />
                        <span className="text-xs font-mono text-[#00FF85] font-bold bg-[#00FF85]/10 px-2 py-0.5 rounded border border-[#00FF85]/30">
                          Retry: {retryEvaluation.newScore} ({retryEvaluation.improvementDelta >= 0 ? '+' : ''}
                          {retryEvaluation.improvementDelta} PTS RECOVERY)
                        </span>
                      </div>
                    </div>

                    {/* Side-by-Side on desktop, stacked on mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="p-3.5 rounded-lg bg-[#14181B] border border-white/[0.06] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[#9EA6B0] uppercase font-bold">Attempt #1:</span>
                          <span className="text-xs font-mono font-bold text-[#FF3B30]">{retryEvaluation.originalScore} pts</span>
                        </div>
                        <p className="text-white/70 line-clamp-4 leading-relaxed">{answerText}</p>
                      </div>
                      <div className="p-3.5 rounded-lg bg-[#14181B] border border-[#00F0FF]/30 space-y-1.5 shadow-[0_0_12px_rgba(0,240,255,0.1)]">
                        <div className="flex items-center justify-between">
                          <span className="text-[#00F0FF] uppercase font-bold">Remediated #2:</span>
                          <span className="text-xs font-mono font-bold text-[#00FF85]">{retryEvaluation.newScore} pts</span>
                        </div>
                        <p className="text-white leading-relaxed line-clamp-4">{retryAnswerText}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-xs font-mono">
                      <span className="text-[#00F0FF] font-bold block mb-1">AI Verification Verdict:</span>
                      <p className="text-white/90 leading-relaxed">{retryEvaluation.comparisonFeedback}</p>
                    </div>

                    {/* Weakness Resolution Check and Action Gate */}
                    {!retryEvaluation.isWeaknessResolved ? (
                      <div className="p-4 rounded-lg bg-[#FF3B30]/10 border border-[#FF3B30]/40 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="w-5 h-5 text-[#FF3B30] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-mono text-[#FF3B30] uppercase tracking-wider font-bold block">
                              DEFICIT STILL EVIDENCED // WEAKNESS UNRESOLVED
                            </span>
                            <p className="text-xs font-mono text-white/90 mt-1 leading-relaxed">
                              The revised retry answer does not yet demonstrate verified resolution of{' '}
                              <strong className="text-[#FF3B30]">{evaluation?.weakestSkill}</strong>. Level advancement is held until evidence of improvement is verified.
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
                            className="px-5 py-2.5 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] text-[#0A0B0D] font-mono font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                          >
                            <Target className="w-3.5 h-3.5" />
                            <span>[ 🎯 Practice Another Targeted Exercise ]</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleAdvanceNextQuestion}
                            disabled={isAdvancing}
                            className="px-4 py-2.5 rounded-lg bg-[#14181B] hover:bg-[#1B2126] border border-white/[0.1] text-[#9EA6B0] hover:text-white font-mono text-xs uppercase tracking-wider inline-flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isAdvancing ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00F0FF]" />
                                <span>Advancing...</span>
                              </>
                            ) : questionCount < maxQuestions ? (
                              <>
                                <span>Continue Next Question ({questionCount + 1}/{maxQuestions})</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                <span>Finish Interview ({maxQuestions}/{maxQuestions})</span>
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF85]" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-[#00FF85]/10 border border-[#00FF85]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="w-5 h-5 text-[#00FF85] shrink-0" />
                          <div>
                            <span className="text-[10px] font-mono text-[#00FF85] uppercase tracking-wider font-bold block">
                              DEFICIT REMEDIATED // EVIDENCE VERIFIED
                            </span>
                            <p className="text-xs font-mono text-white/90">
                              Successfully demonstrated mastery of <strong className="text-[#00FF85]">{evaluation?.weakestSkill}</strong>.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAdvanceNextQuestion}
                          disabled={isAdvancing}
                          className="px-6 py-2.5 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] text-[#0A0B0D] font-syne font-bold text-sm uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(0,240,255,0.25)] shrink-0 disabled:opacity-50"
                        >
                          {isAdvancing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>PREPARING...</span>
                            </>
                          ) : questionCount < maxQuestions ? (
                            <>
                              <span>Advance to Next Challenge ({questionCount + 1}/{maxQuestions}) →</span>
                            </>
                          ) : (
                            <>
                              <span>View Final Progression Summary ({maxQuestions}/{maxQuestions}) →</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          {/* Progression Summary / Session Completion Screen */}
          {currentStage === 'progression-summary' && (
            <div className="bg-[#14181B] border border-white/[0.08] rounded-xl p-6 sm:p-8 relative space-y-6 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF]">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-widest font-bold block">
                      SESSION DEBRIEF // LEVEL-UP VERIFICATION
                    </span>
                    <h3 className="font-syne text-2xl sm:text-3xl font-bold text-white uppercase tracking-wide">
                      Practice Session Complete
                    </h3>
                  </div>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded bg-[#00FF85]/10 border border-[#00FF85]/30 text-[#00FF85] font-bold uppercase">
                  {persistenceMode === 'database-verified' ? 'CLOUD VERIFIED' : 'LOCAL CACHED'}
                </span>
              </div>

              {/* Verified Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-center">
                  <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">Evaluated Questions</span>
                  <span className="font-mono text-3xl font-bold text-white mt-1 block">{verifiedAttempts}</span>
                  <span className="text-[10px] font-mono text-[#9EA6B0]">Substantive Submissions</span>
                </div>

                <div className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-center">
                  <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">Average Score</span>
                  <span
                    className={`font-mono text-3xl font-bold mt-1 block ${
                      averageScore >= 75 ? 'text-[#00F0FF]' : 'text-white'
                    }`}
                  >
                    {averageScore}/100
                  </span>
                  <span className="text-[10px] font-mono text-[#9EA6B0]">
                    {averageScore >= 75 ? 'Threshold Achieved (≥75)' : 'Below 75 Threshold'}
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-[#0A0B0D] border border-white/[0.08] text-center">
                  <span className="text-[10px] font-mono text-[#9EA6B0] uppercase block">Weaknesses Remediated</span>
                  <span className="font-mono text-3xl font-bold text-[#00FF85] mt-1 block">{weaknessesResolvedCount}</span>
                  <span className="text-[10px] font-mono text-[#9EA6B0]">Targeted Retries Passed</span>
                </div>
              </div>

              {/* Progression Verdict Callout */}
              {qualifiesForLevelUp ? (
                <div className="p-5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/60 space-y-2 shadow-[0_0_24px_rgba(0,240,255,0.15)]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#00F0FF]" />
                    <span className="font-syne text-xl font-bold text-white uppercase tracking-wide">
                      Promotion Verified: Qualified for {getNextDifficulty(config.difficulty)}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-white/90 leading-relaxed">
                    All 4 anti-tamper advancement gates satisfied: ≥2 evaluated submissions, average score ≥ 75%, at least 1 resolved weakness, and zero critical deficits. Your achievement is recorded in your candidate dossier.
                  </p>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-[#0A0B0D] border border-white/[0.1] space-y-2">
                  <div className="flex items-center gap-2 text-[#FFB800]">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-syne text-lg font-bold uppercase tracking-wide">
                      Advancement Calibration Pending
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#9EA6B0] leading-relaxed">
                    Promotion requires repeated high-signal answers (≥75 average), verified resolution of identified weaknesses on retry, and zero unresolved critical deficits. Continue practice to unlock {getNextDifficulty(config.difficulty)}.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={onExitHome}
                  className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-lg bg-[#00F0FF] hover:bg-[#00D4E5] text-[#0A0B0D] font-mono font-bold text-sm tracking-wider uppercase inline-flex items-center justify-center gap-2 transition-all shadow-[0_0_16px_rgba(0,240,255,0.3)]"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                  <span>[ Return to Candidate Dashboard ]</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartFreshSession}
                  className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-lg bg-[#14181B] hover:bg-[#1B2126] border border-white/[0.1] text-[#FFFFFF] font-mono text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>Start Another Session</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Telemetry & Level Progression Matrix (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Diagnostic Score Engine HUD (Active when evaluation is present) */}
          {evaluation && (
            <div className="bg-[#14181B] border border-white/[0.08] rounded-xl p-5 sm:p-6 shadow-xl relative overflow-hidden animate-fadeIn">
              <div className="flex items-center justify-between mb-4 border-b border-white/[0.08] pb-3">
                <span className="font-mono text-xs text-[#9EA6B0] uppercase tracking-wider flex items-center gap-1.5 font-bold">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#00F0FF]" />
                  AI Telemetry Metric Hub
                </span>
                <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                  evaluation.overallScore >= 75
                    ? 'bg-[#00FF85]/15 text-[#00FF85] border border-[#00FF85]/30'
                    : 'bg-[#FF3B30]/15 text-[#FF3B30] border border-[#FF3B30]/30'
                }`}>
                  {evaluation.overallScore >= 75 ? 'SENIOR BAR MET' : 'BELOW BENCHMARK'}
                </span>
              </div>

              {/* Circular Metric Gauge Ring & Verdict */}
              <div className="flex items-center gap-5 pb-5">
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle className="text-[#0A0B0D]" cx="50" cy="50" fill="none" r="40" stroke="currentColor" strokeWidth="8" />
                    <circle
                      className="text-[#00F0FF] transition-all duration-1000"
                      cx="50"
                      cy="50"
                      fill="none"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * evaluation.overallScore) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono text-2xl font-black text-white">{evaluation.overallScore}</span>
                    <span className="font-mono text-[10px] text-[#9EA6B0]">/ 100</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <h2 className="font-syne text-lg font-bold text-[#F8FAFC]">Senior Bar Verdict</h2>
                  <p className="font-inter text-xs text-[#9EA6B0] leading-snug">
                    {evaluation.evaluatorNote || (
                      evaluation.overallScore >= 75
                        ? 'Demonstrated strong operational intuition and systematic problem solving.'
                        : 'Solid baseline, but requires deeper exploration of trade-offs and resilience bounds.'
                    )}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#9EA6B0]">Target Pass Bar:</span>
                    <span className="font-mono text-[11px] text-[#00FF85] font-bold">75 / 100</span>
                  </div>
                </div>
              </div>

              {/* Dimension Breakdown Progression Bars */}
              <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                {evaluation.dimensionScores ? (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs font-mono">
                        <span className="text-[#F8FAFC]">Technical Correctness</span>
                        <span className="font-bold text-[#00F0FF]">{evaluation.dimensionScores.factualCorrectness}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#0A0B0D] rounded-full overflow-hidden">
                        <div className="h-full bg-[#00F0FF] rounded-full transition-all duration-500" style={{ width: `${evaluation.dimensionScores.factualCorrectness}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs font-mono">
                        <span className="text-[#F8FAFC]">System Reasoning</span>
                        <span className="font-bold text-[#00F0FF]">{evaluation.dimensionScores.reasoningDepth}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#0A0B0D] rounded-full overflow-hidden">
                        <div className="h-full bg-[#00F0FF] rounded-full transition-all duration-500" style={{ width: `${evaluation.dimensionScores.reasoningDepth}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs font-mono">
                        <span className="text-[#F8FAFC]">Practical Defense</span>
                        <span className="font-bold text-[#00F0FF]">{evaluation.dimensionScores.practicalApplication}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#0A0B0D] rounded-full overflow-hidden">
                        <div className="h-full bg-[#00F0FF] rounded-full transition-all duration-500" style={{ width: `${evaluation.dimensionScores.practicalApplication}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs font-mono">
                        <span className="text-[#F8FAFC]">Structure Clarity</span>
                        <span className="font-bold text-[#00F0FF]">{evaluation.dimensionScores.communicationClarity}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#0A0B0D] rounded-full overflow-hidden">
                        <div className="h-full bg-[#00F0FF] rounded-full transition-all duration-500" style={{ width: `${evaluation.dimensionScores.communicationClarity}%` }} />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs font-mono">
                        <span className="text-[#F8FAFC]">Technical Accuracy</span>
                        <span className="font-bold text-[#00F0FF]">{evaluation.technicalAccuracy}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#0A0B0D] rounded-full overflow-hidden">
                        <div className="h-full bg-[#00F0FF] rounded-full transition-all duration-500" style={{ width: `${evaluation.technicalAccuracy}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs font-mono">
                        <span className="text-[#F8FAFC]">Reasoning & Trade-Offs</span>
                        <span className="font-bold text-[#00F0FF]">{evaluation.reasoningTradeoff}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#0A0B0D] rounded-full overflow-hidden">
                        <div className="h-full bg-[#00F0FF] rounded-full transition-all duration-500" style={{ width: `${evaluation.reasoningTradeoff}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs font-mono">
                        <span className="text-[#F8FAFC]">Structure Clarity</span>
                        <span className="font-bold text-[#00F0FF]">{evaluation.structureClarity}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#0A0B0D] rounded-full overflow-hidden">
                        <div className="h-full bg-[#00F0FF] rounded-full transition-all duration-500" style={{ width: `${evaluation.structureClarity}%` }} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Level-Up Evidence Matrix HUD */}
          <div className="bg-[#14181B] border border-white/[0.08] rounded-xl p-5 sm:p-6 shadow-xl relative flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#00F0FF]" />
                  <span className="font-syne text-lg font-bold text-white uppercase tracking-wide">
                    Level-Up Evidence
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] font-bold uppercase">
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
                    <span className="text-[#00FF85] font-bold">{weaknessesResolvedCount} Verified</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.08]">
                    <span className="text-[#9EA6B0]">Persistence Status:</span>
                    <span
                      className={`font-bold text-[10px] ${
                        persistenceMode === 'database-verified' ? 'text-[#00FF85]' : 'text-[#FFB800]'
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
                <div className="p-4 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/50 text-center space-y-1 animate-pulse shadow-[0_0_16px_rgba(0,240,255,0.2)]">
                  <span className="text-[10px] font-mono text-[#00F0FF] uppercase tracking-widest font-bold block">
                    LEVEL ADVANCEMENT QUALIFIED
                  </span>
                  <h4 className="font-syne text-lg font-bold text-white uppercase">
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
                  <p className="text-xs font-inter text-[#9EA6B0] leading-relaxed">
                    Promotion requires repeated high-signal answers and verified weakness resolution. No single lucky scores.
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
  </div>
  );
};
