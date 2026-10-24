/**
 * EchoTutor® — Evaluation Rubric Engine
 * Milestone 5 / Accuracy Improvement
 * 
 * Defines question-specific evaluation rubrics, dimension weights,
 * and domain-calibrated assessment standards.
 */

/**
 * Returns configurable dimension weights based on track, topic, and difficulty.
 * Weights must sum to 1.0 (100%).
 * 
 * Dimensions:
 * 1. factualCorrectness: Technical accuracy, absence of misconceptions.
 * 2. conceptCoverage: Breadth of essential core concepts addressed.
 * 3. reasoningDepth: Trade-off analysis, mechanisms, "why" and "how".
 * 4. practicalApplication: Concrete examples, edge cases, or quantifiable STAR outcomes.
 * 5. communicationClarity: Organization, conciseness, avoiding vague filler.
 */
export function getDimensionWeights(track = 'technical', difficulty = 'foundation') {
  if (track === 'hr' || track === 'behavioral') {
    // Behavioral & HR: emphasize situation context, personal ownership, quantifiable outcome, and STAR clarity
    return {
      factualCorrectness: 0.15,   // Relevance, authenticity, alignment with real behavioral scenarios
      conceptCoverage: 0.25,      // Context, specific task, individual actions
      reasoningDepth: 0.25,       // Decision rationale, conflict handling, leadership reflection
      practicalApplication: 0.25, // Measurable impact, quantifiable metrics, team/business outcome
      communicationClarity: 0.10, // STAR structure, conciseness, avoidance of generic platitudes
    };
  }

  // Technical Track
  if (difficulty === 'executive') {
    // Executive / Architecture defense: heavy emphasis on strategic trade-offs and failure resilience
    return {
      factualCorrectness: 0.25,
      conceptCoverage: 0.20,
      reasoningDepth: 0.30,
      practicalApplication: 0.15,
      communicationClarity: 0.10,
    };
  }

  if (difficulty === 'pressure-cooker') {
    // Pressure-cooker: deep probe into edge cases, latency, and consistency trade-offs
    return {
      factualCorrectness: 0.30,
      conceptCoverage: 0.20,
      reasoningDepth: 0.30,
      practicalApplication: 0.10,
      communicationClarity: 0.10,
    };
  }

  // Foundation Technical (default)
  return {
    factualCorrectness: 0.30,
    conceptCoverage: 0.25,
    reasoningDepth: 0.25,
    practicalApplication: 0.10,
    communicationClarity: 0.10,
  };
}

/**
 * Builds or normalizes a question-specific evaluation rubric.
 * Guarantees both summary string array (expectedRubric) and rich structured detail (rubricDetail).
 */
export function buildQuestionRubric(params = {}) {
  const { track = 'technical', topic = 'System Design', difficulty = 'foundation', questionText = '', rubricDetail } = params;

  if (rubricDetail && Array.isArray(rubricDetail.coreConcepts) && rubricDetail.coreConcepts.length > 0) {
    const summaryStrings = [
      ...rubricDetail.coreConcepts.slice(0, 2),
      rubricDetail.expectedReasoning?.[0] || rubricDetail.supportingConcepts?.[0] || 'Trade-off & failure-mode analysis',
    ];
    return {
      expectedRubric: summaryStrings,
      rubricDetail: {
        coreConcepts: rubricDetail.coreConcepts.map(String),
        supportingConcepts: Array.isArray(rubricDetail.supportingConcepts) ? rubricDetail.supportingConcepts.map(String) : [],
        acceptableAlternatives: Array.isArray(rubricDetail.acceptableAlternatives) ? rubricDetail.acceptableAlternatives.map(String) : [],
        commonMisconceptions: Array.isArray(rubricDetail.commonMisconceptions) ? rubricDetail.commonMisconceptions.map(String) : [],
        expectedReasoning: Array.isArray(rubricDetail.expectedReasoning) ? rubricDetail.expectedReasoning.map(String) : [],
        excellenceCriteria: Array.isArray(rubricDetail.excellenceCriteria) ? rubricDetail.excellenceCriteria.map(String) : [],
      },
    };
  }

  // Pre-configured rich domain templates for fallback questions
  if (track === 'technical') {
    return {
      expectedRubric: [
        'Partition tolerance mechanisms and CAP theorem consistency trade-offs',
        'State synchronization protocols (Raft/Paxos leader election, log replication, quorum)',
        'Failure modes, split-brain mitigation, and latency vs throughput implications',
      ],
      rubricDetail: {
        coreConcepts: [
          'Majority quorum rule strictly defined as (N/2)+1 nodes to prevent split-brain',
          'Leader election mechanism with randomized timeouts to prevent split votes',
          'Log replication and commit index semantics during partitions',
        ],
        supportingConcepts: [
          'Heartbeat interval vs election timeout bounds',
          'Term numbers / epochs to identify stale leaders and reject partitioned nodes',
          'Client request handling on disconnected minority partitions (stale reads vs unavailable writes)',
        ],
        acceptableAlternatives: [
          'Accepts Paxos terminology (proposer, acceptor, learner, ballot numbers) if comparing protocols',
          'Accepts two-phase commit (2PC) or multi-Raft comparison if trade-offs are explicitly contrasted',
          'Accepts "quorum reads" or "read index" optimization discussions',
        ],
        commonMisconceptions: [
          'Claiming a minority (e.g. 2 nodes out of 5) can elect a leader or commit entries',
          'Claiming that Raft guarantees both 100% availability and strict consistency during arbitrary partitions (violates CAP)',
          'Confusing leader election timeouts with network socket timeouts',
        ],
        expectedReasoning: [
          'Explicit analysis of write latency trade-off (round-trip to majority) vs data safety',
          'Detailed behavior of the minority partition (rejecting writes or queuing until reconnected)',
        ],
        excellenceCriteria: [
          'Differentiates between committed log entries vs uncommitted speculative logs upon rejoining',
          'Discusses membership changes or log compaction (snapshots) under pressure',
        ],
      },
    };
  }

  // Behavioral Track Fallback
  return {
    expectedRubric: [
      'Structured narrative (STAR: Situation, Task, Action, Result) with individual accountability',
      'Clear decision-making rationale and cross-functional conflict resolution',
      'Quantifiable business or technical outcome with reflective learning',
    ],
    rubricDetail: {
      coreConcepts: [
        'Specific, real scenario describing cross-functional resistance or high-stakes challenge',
        'Explicit personal contribution (distinguishing "I" actions from generic "we")',
        'Measurable business, operational, or technical outcome (metrics, timeline, cost)',
      ],
      supportingConcepts: [
        'Stakeholder empathy and root cause identification of the disagreement',
        'De-escalation strategy (data-driven alignment, compromise, phased rollout)',
        'Key learning or retrospective improvement applied to subsequent projects',
      ],
      acceptableAlternatives: [
        'Accepts CAR (Context, Action, Result) or SOAR frameworks instead of strict STAR',
        'Accepts qualitative outcomes if accompanied by concrete operational milestones',
      ],
      commonMisconceptions: [
        'Attributing all success to "the team" without stating individual contribution',
        'Describing a conflict where the other party was simply wrong without showing resolution skills',
        'Ending without any measurable result or reflective takeaway',
      ],
      expectedReasoning: [
        'Explaining WHY a specific compromise or technical stance was chosen over alternatives',
        'Showing maturity in handling dissenting technical opinions',
      ],
      excellenceCriteria: [
        'Executive presence: demonstrates empathy, business acumen, and structural clarity',
        'Cites long-term organizational impact beyond the immediate conflict',
      ],
    },
  };
}
