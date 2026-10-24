/**
 * Verification that a poor retry does NOT resolve the weakness
 * and progression remains locked.
 */

const BASE_URL = 'http://localhost:5173';

async function testUnresolvedRetry() {
  console.log('Testing poor retry answer with real AI...');

  const poorRetryAnswer = 'I still think leader election just needs a timeout. If nodes disconnect, they just reconnect later.';

  const retryRes = await fetch(`${BASE_URL}/api/ai/evaluate-retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      originalQuestion: 'How does Raft leader election ensure safety and log up-to-dateness?',
      originalAnswer: 'Raft has a leader that sends heartbeats.',
      weakestSkill: 'Raft Safety and Election Invariants',
      lessonConcept: 'Raft Safety and Election Invariants',
      retryAnswer: poorRetryAnswer,
      originalScore: 20,
      track: 'technical',
      topic: 'Distributed Consensus',
    }),
  });

  const data = await retryRes.json();
  console.log('Poor Retry HTTP Status:', retryRes.status);
  console.log('New Score:', data.data?.newScore);
  console.log('Is Weakness Resolved:', data.data?.isWeaknessResolved);
  console.log('Progression Eligible:', data.data?.progressionEligible);
  console.log('AI Feedback:', data.data?.comparisonFeedback);

  if (data.data?.isWeaknessResolved === false && data.data?.progressionEligible === false) {
    console.log('\n✓ VERIFIED: Real AI correctly kept weakness UNRESOLVED and blocked progression for poor retry!');
  } else {
    console.error('Unexpected: poor retry was marked resolved!', data);
    process.exit(1);
  }
}

testUnresolvedRetry().catch((e) => {
  console.error(e);
  process.exit(1);
});
