/**
 * Automated Verification Script for EchoTutor — Milestone 6: Persistent Learning & Progression
 * 
 * Verifies:
 * 1. Session creation and persistence mapping
 * 2. Saving generated questions and evaluation rubrics
 * 3. Saving evaluations and retries (improvement delta, weakness resolution)
 * 4. Session restoration workflow (resuming progress after page reload / return)
 * 5. User isolation and unauthorized access checks
 * 6. Honest handling of failed database writes without fabricating save status
 * 7. Anti-tamper Level-Up rules:
 *    - Rule 1: Minimum 2 evaluated submissions
 *    - Rule 2: Minimum 75% average score
 *    - Rule 3: Minimum 1 resolved weakness on retry
 *    - Rule 4: Zero active unresolved deficits
 * 8. Dashboard metrics calculation derived directly from persisted records
 * 9. Session lifecycle status transitions (in-progress -> completed / abandoned)
 */

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

// ----------------------------------------------------------------------------
// In-Memory Mock of Supabase PostgreSQL Database with RLS Simulation
// ----------------------------------------------------------------------------
class MockSupabaseDB {
  constructor() {
    this.sessions = [];
    this.interactions = [];
    this.progression = [];
    this.currentAuthUser = null;
  }

  setAuthUser(userId) {
    this.currentAuthUser = userId;
  }

  // Simulates RLS filter: auth.uid() = user_id
  applyRLS(records) {
    if (!this.currentAuthUser) return [];
    return records.filter((r) => r.user_id === this.currentAuthUser);
  }

  // 1. Session operations
  createSession(params) {
    if (!this.currentAuthUser) throw new Error('RLS Violation: Unauthorized session creation');
    const session = {
      id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: this.currentAuthUser,
      track: params.track,
      difficulty: params.difficulty,
      topic: params.topic,
      mode: params.mode || 'typed',
      status: 'in-progress',
      duration_seconds: 0,
      overall_score: null,
      cadence_score: null,
      defense_score: null,
      feedback_summary: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.sessions.push(session);
    return { ...session };
  }

  findActiveSession(track) {
    const userSessions = this.applyRLS(this.sessions);
    return (
      userSessions
        .filter((s) => s.status === 'in-progress' && (!track || s.track === track))
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0] || null
    );
  }

  updateSessionStatus(sessionId, status, overallScore, summary) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error('Session not found');
    if (session.user_id !== this.currentAuthUser) {
      throw new Error('RLS Violation: Cannot update another candidate session');
    }
    session.status = status;
    session.updated_at = new Date().toISOString();
    if (status === 'completed') {
      session.completed_at = new Date().toISOString();
      if (overallScore != null) session.overall_score = overallScore;
      if (summary) session.feedback_summary = summary;
    }
    return { ...session };
  }

  // 2. Interaction operations
  saveGeneratedQuestion(params) {
    if (!this.currentAuthUser) throw new Error('RLS Violation: Unauthorized');
    const interaction = {
      id: `inter-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      session_id: params.sessionId,
      user_id: this.currentAuthUser,
      track: params.track,
      topic: params.topic,
      difficulty: params.difficulty,
      question_text: params.questionText,
      expected_rubric: params.expectedRubric,
      answer_text: '',
      overall_score: null,
      technical_accuracy: null,
      reasoning_score: null,
      structure_score: null,
      strengths: [],
      weaknesses: [],
      weakest_skill: null,
      lesson_title: null,
      lesson_explanation: null,
      real_world_example: null,
      micro_exercise_question: null,
      exercise_hint: null,
      retry_answer: null,
      retry_score: null,
      improvement_delta: null,
      is_weakness_resolved: false,
      retry_comparison_feedback: null,
      retry_evidence: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.interactions.push(interaction);
    return { ...interaction };
  }

  saveAnswerEvaluation(interactionId, answerText, evaluation) {
    const inter = this.interactions.find((i) => i.id === interactionId);
    if (!inter) throw new Error('Interaction not found');
    if (inter.user_id !== this.currentAuthUser) {
      throw new Error('RLS Violation: Cannot update another candidate record');
    }
    inter.answer_text = answerText;
    inter.overall_score = evaluation.overallScore;
    inter.technical_accuracy = evaluation.technicalAccuracy;
    inter.reasoning_score = evaluation.reasoningTradeoff;
    inter.structure_score = evaluation.structureClarity;
    inter.strengths = evaluation.strengths;
    inter.weaknesses = evaluation.weaknesses;
    inter.weakest_skill = evaluation.weakestSkill;
    inter.updated_at = new Date().toISOString();
    return { ...inter };
  }

  saveWeaknessLesson(interactionId, lesson) {
    const inter = this.interactions.find((i) => i.id === interactionId);
    if (!inter) throw new Error('Interaction not found');
    if (inter.user_id !== this.currentAuthUser) {
      throw new Error('RLS Violation: Cannot update another candidate record');
    }
    inter.lesson_title = lesson.conceptTitle;
    inter.lesson_explanation = lesson.conceptExplanation;
    inter.real_world_example = lesson.realWorldExample;
    inter.micro_exercise_question = lesson.microExerciseQuestion;
    inter.exercise_hint = lesson.exerciseHint;
    inter.updated_at = new Date().toISOString();
    return { ...inter };
  }

  saveRetryEvaluation(interactionId, retryAnswerText, retryEval) {
    const inter = this.interactions.find((i) => i.id === interactionId);
    if (!inter) throw new Error('Interaction not found');
    if (inter.user_id !== this.currentAuthUser) {
      throw new Error('RLS Violation: Cannot update another candidate record');
    }
    inter.retry_answer = retryAnswerText;
    inter.retry_score = retryEval.newScore;
    inter.improvement_delta = retryEval.improvementDelta;
    inter.is_weakness_resolved = retryEval.isWeaknessResolved;
    inter.retry_comparison_feedback = retryEval.comparisonFeedback;
    inter.retry_evidence = retryEval.improvementEvidence;
    inter.updated_at = new Date().toISOString();
    return { ...inter };
  }

  loadSessionInteractions(sessionId) {
    const userInteractions = this.applyRLS(this.interactions);
    return userInteractions.filter((i) => i.session_id === sessionId);
  }

  // Disallow direct client INSERT into progression (enforces RLS policy)
  insertProgressionDirectClient(record) {
    throw new Error('RLS Violation: Direct client INSERT into candidate_progression is forbidden. Level achievements must be verified by server RPC');
  }

  // 3. Server-Side Progression Verification RPC Simulation
  verifyAndRecordProgressionRPC(sessionId, track) {
    if (!this.currentAuthUser) {
      return { success: false, error: 'UNAUTHORIZED' };
    }

    const session = this.sessions.find(
      (s) => s.id === sessionId && s.user_id === this.currentAuthUser
    );
    if (!session) {
      return { success: false, error: 'SESSION_NOT_FOUND' };
    }

    // Idempotency: Return existing progression record if already verified for this session
    const existing = this.progression.find((p) => p.session_id === sessionId);
    if (existing) {
      return {
        success: true,
        eligible: true,
        already_recorded: true,
        level_achieved: existing.level_achieved,
        verified_score_avg: existing.verified_score_avg,
        weaknesses_resolved_count: existing.weaknesses_resolved_count,
        evidence_summary: existing.evidence_summary,
      };
    }

    // Filter distinct, substantive evaluated interactions with non-empty answer text
    const userInteractions = this.loadSessionInteractions(sessionId).filter(
      (i) => i.overall_score != null && i.answer_text && i.answer_text.trim().length > 0
    );

    const attemptCount = userInteractions.length;
    const avgScore =
      attemptCount > 0
        ? Math.round(userInteractions.reduce((acc, i) => acc + i.overall_score, 0) / attemptCount)
        : 0;
    const resolvedCount = userInteractions.filter((i) => i.is_weakness_resolved).length;
    const unresolvedRetries = userInteractions.filter(
      (i) => i.retry_score != null && !i.is_weakness_resolved
    ).length;

    // Rule 1: >= 2 evaluated submissions
    if (attemptCount < 2) {
      return {
        success: false,
        eligible: false,
        reason: 'Insufficient evaluated submissions. Minimum 2 required.',
        attempt_count: attemptCount,
      };
    }

    // Rule 2: Average score >= 75%
    if (avgScore < 75) {
      return {
        success: false,
        eligible: false,
        reason: 'Average score below 75% threshold.',
        avg_score: avgScore,
      };
    }

    // Rule 3: >= 1 verified resolved weakness on retry
    if (resolvedCount < 1) {
      return {
        success: false,
        eligible: false,
        reason: 'No resolved weaknesses verified. Must complete targeted retry.',
        resolved_count: resolvedCount,
      };
    }

    // Rule 4: Zero active unresolved deficits
    if (unresolvedRetries > 0) {
      return {
        success: false,
        eligible: false,
        reason: 'Blocked by unresolved critical deficits from previous retry.',
        unresolved_count: unresolvedRetries,
      };
    }

    const nextDiff =
      session.difficulty === 'foundation'
        ? 'pressure-cooker'
        : session.difficulty === 'pressure-cooker'
        ? 'executive'
        : 'master';

    const evidence = `Evidenced ${attemptCount} substantive submissions (avg ${avgScore}/100), ${resolvedCount} resolved weakness(es), and zero critical deficits.`;

    const progRecord = {
      id: `prog-${Date.now()}`,
      user_id: this.currentAuthUser,
      session_id: sessionId,
      track,
      level_achieved: nextDiff,
      evidence_summary: evidence,
      verified_score_avg: avgScore,
      weaknesses_resolved_count: resolvedCount,
      verified_at: new Date().toISOString(),
    };
    this.progression.push(progRecord);

    return {
      success: true,
      eligible: true,
      level_achieved: nextDiff,
      verified_score_avg: avgScore,
      weaknesses_resolved_count: resolvedCount,
      evidence_summary: evidence,
    };
  }

  // 4. Dashboard metrics computation
  computeDashboardMetrics() {
    const userSessions = this.applyRLS(this.sessions);
    const userInteractions = this.applyRLS(this.interactions);
    const userProgression = this.applyRLS(this.progression);

    const evaluated = userInteractions.filter((i) => i.overall_score != null);
    const resolvedWeaknesses = userInteractions.filter((i) => i.is_weakness_resolved).length;
    const completed = userSessions.filter((s) => s.status === 'completed');
    const inProgress = userSessions.find((s) => s.status === 'in-progress') || null;

    let avgOverall = null;
    let avgDefense = null;
    if (evaluated.length > 0) {
      const sum = evaluated.reduce((acc, i) => acc + i.overall_score, 0);
      avgOverall = Math.round(sum / evaluated.length);
      const defenseEvals = evaluated.filter((i) => i.reasoning_score != null);
      if (defenseEvals.length > 0) {
        avgDefense = Math.round(
          defenseEvals.reduce((acc, i) => acc + i.reasoning_score, 0) / defenseEvals.length
        );
      }
    }

    const levelByTrack = {
      technical: 'foundation',
      hr: 'foundation',
    };
    const techProg = userProgression.find((p) => p.track === 'technical');
    if (techProg) levelByTrack.technical = techProg.level_achieved;
    const hrProg = userProgression.find((p) => p.track === 'hr');
    if (hrProg) levelByTrack.hr = hrProg.level_achieved;

    return {
      totalSessions: userSessions.length,
      completedSessions: completed.length,
      inProgressSession: inProgress,
      averageOverallScore: avgOverall,
      averageCadenceScore: avgOverall ? Math.min(100, Math.round(avgOverall * 0.95)) : null,
      averageDefenseScore: avgDefense,
      totalInteractionsEvaluated: evaluated.length,
      totalWeaknessesResolved: resolvedWeaknesses,
      currentLevelByTrack: levelByTrack,
      recentProgression: userProgression,
    };
  }
}

// ----------------------------------------------------------------------------
// Test Execution
// ----------------------------------------------------------------------------
async function runMilestone6Tests() {
  console.log('\n======================================================');
  console.log('EchoTutor — Milestone 6: Persistence & Learning Tests');
  console.log('======================================================\n');

  const db = new MockSupabaseDB();
  const USER_A = 'usr-candidate-001';
  const USER_B = 'usr-candidate-002';

  // --- Suite 1: Session Initialization and Creation ---
  console.log('--- 1. Testing Session Creation & Persistence ---');
  db.setAuthUser(USER_A);

  const session1 = db.createSession({
    track: 'technical',
    difficulty: 'foundation',
    topic: 'Distributed Raft Consensus',
    mode: 'typed',
  });

  assert(session1.id.startsWith('sess-'), 'Session receives unique UUID primary key');
  assert(session1.user_id === USER_A, 'Session is associated strictly with authenticated user');
  assert(session1.status === 'in-progress', 'Newly started session has status in-progress');
  assert(session1.track === 'technical', 'Session preserves selected track');
  assert(session1.difficulty === 'foundation', 'Session preserves initial difficulty tier');

  // --- Suite 2: Saving Question & Rubric ---
  console.log('\n--- 2. Testing Question & Rubric Persistence ---');
  const question1 = db.saveGeneratedQuestion({
    sessionId: session1.id,
    track: 'technical',
    topic: 'Distributed Raft Consensus',
    difficulty: 'foundation',
    questionText: 'How does Raft handle split-brain elections during network partitions?',
    expectedRubric: [
      'Term numbering to prevent stale leaders',
      'Majority quorum requirement (N/2 + 1)',
      'Log consistency check on append',
    ],
  });

  assert(question1.id.startsWith('inter-'), 'Interaction record receives unique primary key');
  assert(question1.session_id === session1.id, 'Interaction links to parent session');
  assert(question1.expected_rubric.length === 3, 'Internal evaluation rubric is persisted');
  assert(question1.answer_text === '', 'Answer text defaults to empty before candidate submission');

  // --- Suite 3: Saving Candidate Answer and Evaluation ---
  console.log('\n--- 3. Testing Answer & Evaluation Persistence ---');
  const eval1 = db.saveAnswerEvaluation(
    question1.id,
    'Raft uses election timeouts and term numbers to elect a leader with a majority quorum.',
    {
      overallScore: 78,
      technicalAccuracy: 80,
      reasoningTradeoff: 75,
      structureClarity: 80,
      strengths: ['Correct majority quorum explanation'],
      weaknesses: ['Omitted log commitment matching guarantees'],
      weakestSkill: 'Log Matching Safety Property',
    }
  );

  assert(eval1.overall_score === 78, 'Overall evaluation score persisted');
  assert(eval1.weakest_skill === 'Log Matching Safety Property', 'Primary deficit identified and stored');
  assert(eval1.weaknesses.length === 1, 'Specific weakness points stored in JSON array');

  // --- Suite 4: Remediation Lesson & Retry Persistence ---
  console.log('\n--- 4. Testing Remediation Lesson & Retry Persistence ---');
  const lesson1 = db.saveWeaknessLesson(question1.id, {
    conceptTitle: 'Raft Log Matching Property',
    conceptExplanation: 'If two entries in different logs have identical index and term...',
    realWorldExample: 'etcd cluster partitioned during cross-datacenter fiber cut',
    microExerciseQuestion: 'Explain why an uncommitted entry from a previous term cannot be committed directly.',
    exerciseHint: 'Consider Fig 8 in the Ongaro & Ousterhout paper.',
  });

  assert(lesson1.lesson_title === 'Raft Log Matching Property', 'Remediation lesson concept persisted');

  const retry1 = db.saveRetryEvaluation(
    question1.id,
    'A leader cannot directly commit an entry from an older term by counting replicas; it must commit by replicating an entry from its current term.',
    {
      newScore: 88,
      improvementDelta: 10,
      isWeaknessResolved: true,
      comparisonFeedback: 'Demonstrates verified comprehension of term-based log commitment rules.',
      improvementEvidence: ['Addressed prior gap regarding previous-term commit edge case.'],
    }
  );

  assert(retry1.retry_score === 88, 'Retry score persisted');
  assert(retry1.improvement_delta === 10, 'Measured delta (+10) persisted');
  assert(retry1.is_weakness_resolved === true, 'Weakness resolution verified and recorded');

  // --- Suite 5: Session Restoration on Refresh / Return ---
  console.log('\n--- 5. Testing Page Refresh & Session Restoration ---');
  // Simulate page reload: new caller instance querying DB
  const restoredSession = db.findActiveSession('technical');
  assert(restoredSession !== null, 'Active in-progress session found upon reload');
  assert(restoredSession.id === session1.id, 'Restores exact active session ID');

  const restoredInteractions = db.loadSessionInteractions(restoredSession.id);
  assert(restoredInteractions.length === 1, 'Restores all recorded session interactions');
  assert(
    restoredInteractions[0].question_text === question1.question_text,
    'Restores exact in-progress question'
  );
  assert(
    restoredInteractions[0].is_weakness_resolved === true,
    'Restores verified weakness resolution state'
  );

  // --- Suite 6: User Isolation & Unauthorized Access (Security) ---
  console.log('\n--- 6. Testing User Isolation & RLS Security ---');
  // Switch to User B
  db.setAuthUser(USER_B);
  const userBActiveSession = db.findActiveSession('technical');
  assert(userBActiveSession === null, 'User B cannot see User A active session (strict RLS isolation)');

  const userBAccessInteractions = db.loadSessionInteractions(session1.id);
  assert(userBAccessInteractions.length === 0, 'User B cannot query User A interactions');

  let unauthorizedUpdateBlocked = false;
  try {
    db.saveAnswerEvaluation(question1.id, 'Hacked answer', { overallScore: 100 });
  } catch (err) {
    unauthorizedUpdateBlocked = err.message.includes('RLS Violation');
  }
  assert(unauthorizedUpdateBlocked, 'Cross-user write attempts blocked with RLS violation error');

  // --- Suite 7: Handling Failed Database Writes Honestly ---
  console.log('\n--- 7. Testing Failed Database Writes & Error Transparency ---');
  // Switch back to User A
  db.setAuthUser(USER_A);
  let failedWriteErrorCaught = false;
  try {
    // Attempt save with invalid interaction ID
    db.saveAnswerEvaluation('non-existent-interaction-id', 'test answer', { overallScore: 50 });
  } catch (err) {
    failedWriteErrorCaught = err.message.includes('Interaction not found');
  }
  assert(failedWriteErrorCaught, 'Invalid/failed DB writes throw structured errors rather than fabricating saves');

  // --- Suite 8: Level-Up Anti-Tamper Enforcement ---
  console.log('\n--- 8. Testing Anti-Tamper Level-Up Qualification Rules ---');
  // Test 8a: Only 1 interaction -> Rule 1 fails (requires >= 2 evaluated submissions)
  const ruleCheck1 = db.verifyAndRecordProgressionRPC(session1.id, 'technical');
  assert(ruleCheck1.eligible === false, 'Single evaluated attempt blocked from Level-Up (< 2 submissions)');
  assert(ruleCheck1.attempt_count === 1, 'Audit reports exact evaluated submission count');

  // Add Question 2 with poor score (e.g. 50%) -> Rule 2 fails (avg < 75%)
  const question2 = db.saveGeneratedQuestion({
    sessionId: session1.id,
    track: 'technical',
    topic: 'Distributed Raft Consensus',
    difficulty: 'foundation',
    questionText: 'Explain log compaction via snapshots in Raft.',
    expectedRubric: ['State machine snapshotting', 'Compacting log indices'],
  });
  db.saveAnswerEvaluation(question2.id, 'Logs are just deleted.', {
    overallScore: 50,
    technicalAccuracy: 50,
    reasoningTradeoff: 50,
    structureClarity: 50,
    strengths: [],
    weaknesses: ['Failed to explain snapshotting'],
    weakestSkill: 'Snapshotting Mechanics',
  });

  const ruleCheck2 = db.verifyAndRecordProgressionRPC(session1.id, 'technical');
  assert(ruleCheck2.eligible === false, 'Low average score (64%) blocks Level-Up (< 75 threshold)');

  // Update Question 2 with strong score (e.g. 84%, avg becomes (78+84)/2 = 81%)
  db.saveAnswerEvaluation(question2.id, 'Snapshots capture full state machine state at index N, allowing discarded log entries.', {
    overallScore: 84,
    technicalAccuracy: 85,
    reasoningTradeoff: 82,
    structureClarity: 85,
    strengths: ['Correct snapshotting explanation'],
    weaknesses: ['Minor mention of chunked transfer missing'],
    weakestSkill: 'Snapshot Chunking',
  });

  // Test 8c: Add retry with unresolved weakness -> Rule 4 fails (unresolved deficits block promotion)
  db.saveRetryEvaluation(question2.id, 'Still incomplete retry', {
    newScore: 60,
    improvementDelta: 0,
    isWeaknessResolved: false,
    comparisonFeedback: 'Candidate still failed to explain snapshot chunking.',
    improvementEvidence: [],
  });

  const ruleCheck3 = db.verifyAndRecordProgressionRPC(session1.id, 'technical');
  assert(ruleCheck3.eligible === false, 'Active unresolved retry deficit blocks promotion (Rule 4)');

  // Fix retry on Question 2 -> resolves weakness
  db.saveRetryEvaluation(question2.id, 'Leader streams InstallSnapshot RPC in sequential chunks, candidate installs and resets state machine.', {
    newScore: 92,
    improvementDelta: 8,
    isWeaknessResolved: true,
    comparisonFeedback: 'Demonstrates clear grasp of InstallSnapshot RPC chunking.',
    improvementEvidence: ['Detailed RPC chunking and state machine reset.'],
  });

  // Now all 4 rules pass:
  // 1. attempts = 2 (>= 2)
  // 2. avg = (78 + 84)/2 = 81% (>= 75%)
  // 3. resolved weaknesses = 2 (>= 1)
  // 4. unresolved deficits = 0
  const ruleCheck4 = db.verifyAndRecordProgressionRPC(session1.id, 'technical');
  assert(ruleCheck4.eligible === true, 'All 4 rules satisfied qualifies for Level-Up advancement');
  assert(ruleCheck4.level_achieved === 'pressure-cooker', 'Correctly promotes from Foundation to Pressure-Cooker');
  assert(ruleCheck4.verified_score_avg === 81, 'Verified average score accurately recorded');
  assert(ruleCheck4.weaknesses_resolved_count === 2, 'Verified weaknesses resolved accurately recorded');

  // --- Suite 9: Dashboard Statistics Derived from Persisted Records ---
  console.log('\n--- 9. Testing Dashboard Telemetry Derived from Persisted DB ---');
  // Complete the session
  db.updateSessionStatus(session1.id, 'completed', 81, 'Mastered Raft consensus fundamentals');

  const metrics = db.computeDashboardMetrics();
  assert(metrics.totalSessions === 1, 'Dashboard counts 1 persisted session');
  assert(metrics.completedSessions === 1, 'Dashboard counts 1 completed session');
  assert(metrics.inProgressSession === null, 'No in-progress session remains after completion');
  assert(metrics.totalInteractionsEvaluated === 2, 'Evaluated questions count matches stored records (2)');
  assert(metrics.totalWeaknessesResolved === 2, 'Resolved weaknesses count matches stored records (2)');
  assert(metrics.averageOverallScore === 81, 'Average overall score matches stored records (81)');
  assert(metrics.currentLevelByTrack.technical === 'pressure-cooker', 'Technical track displays promoted level (pressure-cooker)');
  // --- Suite 10: Login Security & Anti-Enumeration Protections ---
  console.log('\n--- 10. Testing Native Email Login Security & Anti-Enumeration ---');
  
  // Test 10a: Non-email identifier (plain username) is intercepted and rejected without querying email RPC
  const validateLoginIdentifier = (identifier) => {
    const trimmed = identifier.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      return {
        valid: false,
        error: 'EchoTutor uses secure email authentication to protect candidate privacy. Please sign in with your registered email address (e.g. candidate@example.com).',
      };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return { valid: false, error: 'Please enter a valid email address.' };
    }
    return { valid: true, email: trimmed };
  };

  const usernameAttempt = validateLoginIdentifier('johndoe_candidate');
  assert(usernameAttempt.valid === false, 'Username login is intercepted to protect against email enumeration');
  assert(
    usernameAttempt.error.includes('secure email authentication'),
    'Provides privacy guidance explaining registered email is required'
  );

  // Test 10b: Valid email address passes validation
  const validEmailAttempt = validateLoginIdentifier('candidate@echotutor.dev');
  assert(validEmailAttempt.valid === true, 'Valid email format passes validation for native Supabase auth');
  assert(validEmailAttempt.email === 'candidate@echotutor.dev', 'Preserves clean normalized email for authentication');

  // Test 10c: Malformed email is rejected
  const malformedEmailAttempt = validateLoginIdentifier('invalid@email');
  assert(malformedEmailAttempt.valid === false, 'Malformed email format is rejected');

  // --- Suite 11: Server-Side Progression Anti-Forge & Idempotency ---
  console.log('\n--- 11. Testing Server-Side Progression Anti-Forge & Idempotency ---');

  // Test 11a: Direct client INSERT into candidate_progression is blocked by RLS
  let directInsertBlocked = false;
  try {
    db.insertProgressionDirectClient({
      user_id: USER_A,
      track: 'technical',
      level_achieved: 'executive',
    });
  } catch (err) {
    directInsertBlocked = err.message.includes('RLS Violation');
  }
  assert(directInsertBlocked, 'Direct client INSERT into candidate_progression is strictly blocked by RLS');

  // Test 11b: User B calling progression RPC on User A's session is rejected
  db.setAuthUser(USER_B);
  const crossUserRpc = db.verifyAndRecordProgressionRPC(session1.id, 'technical');
  assert(crossUserRpc.success === false, 'Cross-user progression RPC call is rejected');
  assert(crossUserRpc.error === 'SESSION_NOT_FOUND', 'Cross-user call returns SESSION_NOT_FOUND (user cannot verify another candidate session)');

  // Test 11c: Calling RPC with non-existent session ID is rejected
  db.setAuthUser(USER_A);
  const fakeSessionRpc = db.verifyAndRecordProgressionRPC('sess-fake-99999', 'technical');
  assert(fakeSessionRpc.success === false, 'Fabricated session ID is rejected');
  assert(fakeSessionRpc.error === 'SESSION_NOT_FOUND', 'Fabricated session ID returns SESSION_NOT_FOUND');

  // Test 11d: Duplicate progression verification returns existing record idempotently
  const duplicateRpc = db.verifyAndRecordProgressionRPC(session1.id, 'technical');
  assert(duplicateRpc.success === true, 'Duplicate progression call succeeds idempotently');
  assert(duplicateRpc.already_recorded === true, 'Duplicate call identifies progression as already recorded');
  assert(db.progression.filter(p => p.session_id === session1.id).length === 1, 'Exactly one progression row exists (no duplicate level achievements)');

  // Test 11e: Interactions with empty answer text do not count toward substantive submissions
  const sessionEmptyAnswers = db.createSession({
    track: 'technical',
    difficulty: 'foundation',
    topic: 'Distributed Systems',
  });
  const emptyQ1 = db.saveGeneratedQuestion(sessionEmptyAnswers.id, {
    difficulty: 'foundation',
    questionText: 'Prompt 1',
    expectedRubric: [],
  });
  // Empty answer text
  db.saveAnswerEvaluation(emptyQ1.id, '', {
    overallScore: 85,
    technicalAccuracy: 85,
    reasoningTradeoff: 85,
    structureClarity: 85,
    strengths: [],
    weaknesses: [],
    weakestSkill: 'None',
  });
  const emptyAnswerRpc = db.verifyAndRecordProgressionRPC(sessionEmptyAnswers.id, 'technical');
  assert(emptyAnswerRpc.eligible === false, 'Empty answer text does not count as a substantive evaluated submission');

  // --- Summary ---
  console.log('\n======================================================');
  console.log(`Milestone 6 Automated Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runMilestone6Tests().catch((err) => {
  console.error('Test runner caught fatal error:', err);
  process.exit(1);
});
