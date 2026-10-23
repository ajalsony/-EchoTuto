/**
 * EchoTutor — Milestone 5B: Live Engine Integration Test
 * Verifies real AI provider responses against all 5 endpoints:
 * 1. GET /api/ai/status
 * 2. POST /api/ai/generate-question
 * 3. POST /api/ai/evaluate-answer
 * 4. POST /api/ai/fix-weakness
 * 5. POST /api/ai/evaluate-retry
 */

const BASE_URL = 'http://localhost:5173';

async function runLiveTest() {
  console.log('=== Step 1: Checking AI Status ===');
  const statusRes = await fetch(`${BASE_URL}/api/ai/status`);
  const statusData = await statusRes.json();
  console.log('Status Result:', statusData);

  if (!statusData.configured) {
    console.error('AI provider is not configured! Aborting live test.');
    process.exit(1);
  }

  console.log('\n=== Step 2: Generating Interview Question ===');
  const genRes = await fetch(`${BASE_URL}/api/ai/generate-question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      track: 'technical',
      topic: 'Distributed Consensus & Raft',
      difficulty: 'foundation',
      targetRole: 'Senior Backend Engineer',
    }),
  });
  const genData = await genRes.json();
  console.log('Generate Question HTTP Status:', genRes.status);
  console.log('Question:', genData.data?.questionText);
  console.log('Rubric:', genData.data?.expectedRubric);
  console.log('Focus Skill:', genData.data?.focusSkill);

  if (!genData.success || !genData.data?.questionText) {
    console.error('Question generation failed:', genData);
    process.exit(1);
  }

  console.log('\n=== Step 3: Submitting Candidate Answer & Evaluating ===');
  const testAnswer =
    'In Raft, we elect a leader to handle log replication. If a node fails, we wait for a timeout and start an election. The leader sends heartbeats to maintain authority.';
  const evalRes = await fetch(`${BASE_URL}/api/ai/evaluate-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      questionText: genData.data.questionText,
      expectedRubric: genData.data.expectedRubric,
      answerText: testAnswer,
      track: 'technical',
      topic: 'Distributed Consensus & Raft',
      difficulty: 'foundation',
    }),
  });
  const evalData = await evalRes.json();
  console.log('Evaluation HTTP Status:', evalRes.status);
  console.log('Overall Score:', evalData.data?.overallScore);
  console.log('Breakdown:', {
    accuracy: evalData.data?.technicalAccuracy,
    reasoning: evalData.data?.reasoningTradeoff,
    structure: evalData.data?.structureClarity,
  });
  console.log('Evidenced Strengths:', evalData.data?.strengths);
  console.log('Evidenced Weaknesses:', evalData.data?.weaknesses);
  console.log('Primary Weakness Identified:', evalData.data?.weakestSkill);
  console.log('Explanation of Missing:', evalData.data?.explanationOfMissing);

  if (!evalData.success || !evalData.data?.weakestSkill) {
    console.error('Evaluation failed:', evalData);
    process.exit(1);
  }

  console.log('\n=== Step 4: Fix My Weakness (Teaching Lesson & Micro-Exercise) ===');
  const fixRes = await fetch(`${BASE_URL}/api/ai/fix-weakness`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      weakestSkill: evalData.data.weakestSkill,
      questionText: genData.data.questionText,
      answerText: testAnswer,
      track: 'technical',
      topic: 'Distributed Consensus & Raft',
    }),
  });
  const fixData = await fixRes.json();
  console.log('Fix Weakness HTTP Status:', fixRes.status);
  console.log('Concept Title:', fixData.data?.conceptTitle);
  console.log('Concept Explanation:', fixData.data?.conceptExplanation?.substring(0, 150) + '...');
  console.log('Real World Example:', fixData.data?.realWorldExample?.substring(0, 150) + '...');
  console.log('Micro Exercise Challenge:', fixData.data?.microExerciseQuestion);

  if (!fixData.success || !fixData.data?.microExerciseQuestion) {
    console.error('Fix weakness failed:', fixData);
    process.exit(1);
  }

  console.log('\n=== Step 5: Submitting Retry Answer & Evaluating Improvement ===');
  const retryAnswer =
    'To handle partition tolerance in Raft, we require a strict majority quorum of (N/2)+1 nodes before committing an entry. During a network partition, the minority cluster cannot achieve quorum, rejecting client writes to prevent split-brain. We accept temporary unavailability in the minority partition in favor of strict consistency (CP trade-off). Once the partition heals, the term counter resolves conflicts by overwriting uncommitted entries from stale leaders.';
  const retryRes = await fetch(`${BASE_URL}/api/ai/evaluate-retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originalQuestion: genData.data.questionText,
      originalAnswer: testAnswer,
      weakestSkill: evalData.data.weakestSkill,
      lessonConcept: fixData.data.conceptTitle,
      retryAnswer: retryAnswer,
      originalScore: evalData.data.overallScore,
      track: 'technical',
      topic: 'Distributed Consensus & Raft',
    }),
  });
  const retryData = await retryRes.json();
  console.log('Evaluate Retry HTTP Status:', retryRes.status);
  console.log('Original Score:', retryData.data?.originalScore);
  console.log('New Score:', retryData.data?.newScore);
  console.log('Improvement Delta:', retryData.data?.improvementDelta);
  console.log('Is Weakness Resolved:', retryData.data?.isWeaknessResolved);
  console.log('Comparison Feedback:', retryData.data?.comparisonFeedback);
  console.log('Improvement Evidence:', retryData.data?.improvementEvidence);
  console.log('Progression Eligible:', retryData.data?.progressionEligible);
  console.log('Progression Explanation:', retryData.data?.progressionExplanation);

  if (!retryData.success) {
    console.error('Retry evaluation failed:', retryData);
    process.exit(1);
  }

  console.log('\n============================================================');
  console.log('ALL 5 MILESTONE 5B REAL AI ENDPOINTS VERIFIED SUCCESSFULLY!');
  console.log('============================================================\n');
}

runLiveTest().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
