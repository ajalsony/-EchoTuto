/**
 * EchoTutor® — Evaluation Schema & Accuracy Validator
 * Milestone 5 / Accuracy Improvement
 * 
 * Validates model outputs before returning them to the client.
 * Enforces weighted dimension calculations, evidence verification,
 * anti-injection defense, and strict weakness resolution gates.
 */

const INJECTION_PATTERNS = [
  /ignore (all|previous|prior) (instructions|prompts|rubrics|rules)/i,
  /system override/i,
  /disregard (the|all) (rubric|rules|prompt)/i,
  /award (a |me )?(100|full marks|maximum score)/i,
  /i am the (evaluator|interviewer|admin|system)/i,
  /output strictly valid json with 100/i,
  /print {"overallScore":\s*100/i,
];

/**
 * Checks whether the text is a prompt-injection attempt or evasion without technical substance.
 */
export function detectPromptInjection(text = '') {
  const trimmed = String(text).trim();
  if (!trimmed) return false;
  return INJECTION_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Validates and normalizes an AnswerEvaluation response.
 */
export function validateEvaluationResponse(rawResult, weights, answerText = '') {
  if (!rawResult || typeof rawResult !== 'object') {
    throw new Error('MALFORMED_EVALUATION: Model returned a non-object response.');
  }

  const trimmedAnswer = String(answerText).trim();
  const wordCount = trimmedAnswer.length > 0 ? trimmedAnswer.split(/\s+/).length : 0;
  const isInjection = detectPromptInjection(trimmedAnswer);

  // 1. Extract dimension scores (fallback to overallScore or 50)
  const rawScores = rawResult.dimensionScores || {};
  let factual = Number(rawScores.factualCorrectness ?? rawResult.technicalAccuracy ?? 50);
  let coverage = Number(rawScores.conceptCoverage ?? rawResult.technicalAccuracy ?? 50);
  let reasoning = Number(rawScores.reasoningDepth ?? rawResult.reasoningTradeoff ?? 50);
  let practical = Number(rawScores.practicalApplication ?? rawResult.reasoningTradeoff ?? 50);
  let clarity = Number(rawScores.communicationClarity ?? rawResult.structureClarity ?? 50);

  // Clamp 0-100
  factual = Math.max(0, Math.min(100, Math.round(Number.isFinite(factual) ? factual : 50)));
  coverage = Math.max(0, Math.min(100, Math.round(Number.isFinite(coverage) ? coverage : 50)));
  reasoning = Math.max(0, Math.min(100, Math.round(Number.isFinite(reasoning) ? reasoning : 50)));
  practical = Math.max(0, Math.min(100, Math.round(Number.isFinite(practical) ? practical : 50)));
  clarity = Math.max(0, Math.min(100, Math.round(Number.isFinite(clarity) ? clarity : 50)));

  // If candidate submission is an empty or evasion/injection attempt:
  if (isInjection) {
    factual = 0;
    coverage = 0;
    reasoning = 0;
    practical = 0;
    clarity = 10;
  } else if (wordCount === 0) {
    factual = 0;
    coverage = 0;
    reasoning = 0;
    practical = 0;
    clarity = 0;
  } else if (wordCount < 5) {
    // Extremely brief or non-substantive answer (e.g. "idk", "raft is cool")
    factual = Math.min(factual, 25);
    coverage = Math.min(coverage, 20);
    reasoning = Math.min(reasoning, 15);
    practical = Math.min(practical, 10);
  }

  // 2. Compute exact weighted overall score
  const computedScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        factual * weights.factualCorrectness +
        coverage * weights.conceptCoverage +
        reasoning * weights.reasoningDepth +
        practical * weights.practicalApplication +
        clarity * weights.communicationClarity
      )
    )
  );

  // 3. Process Evidence Items
  let evidenceItems = [];
  if (Array.isArray(rawResult.evidenceItems)) {
    evidenceItems = rawResult.evidenceItems
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const quote = String(item.quote || '').trim();
        // Quote verification: check if quote is approximately in answer
        const isVerifiedQuote =
          quote &&
          quote !== '[OMISSION]' &&
          trimmedAnswer.toLowerCase().includes(quote.toLowerCase().slice(0, 20));

        return {
          type: item.type === 'weakness' ? 'weakness' : 'strength',
          quote: quote || (item.type === 'weakness' ? '[OMISSION]' : 'Identified in submission'),
          isVerifiedQuote: Boolean(isVerifiedQuote || quote === '[OMISSION]'),
          analysis: String(item.analysis || ''),
          remediation: item.remediation ? String(item.remediation) : undefined,
        };
      });
  }

  // 4. Fallback strings if arrays are empty
  const strengths = Array.isArray(rawResult.strengths) && rawResult.strengths.length > 0
    ? rawResult.strengths.map(String)
    : isInjection
    ? ['No genuine technical strengths identified (prompt injection attempt).']
    : computedScore >= 75
    ? ['Demonstrated solid foundational comprehension of the core mechanism.']
    : ['Attempted initial formulation of the response.'];

  const weaknesses = Array.isArray(rawResult.weaknesses) && rawResult.weaknesses.length > 0
    ? rawResult.weaknesses.map(String)
    : isInjection
    ? ['Attempted prompt injection instead of addressing the interview question.']
    : computedScore < 75
    ? ['Missing rigorous analysis of trade-offs, edge-cases, and failure modes.']
    : ['Could deepen operational metrics and production edge-case handling.'];

  // 5. Weakest skill deficit
  let weakestSkill = String(rawResult.weakestSkill || '').trim();
  if (isInjection) {
    weakestSkill = 'Prompt Injection Defense & Question Adherence';
  } else if (!weakestSkill || weakestSkill === 'Trade-off articulation') {
    weakestSkill = computedScore < 50 ? 'Foundational Technical Core' : 'Trade-off and Edge Defense';
  }

  let explanationOfMissing = String(rawResult.explanationOfMissing || '').trim();
  if (isInjection) {
    explanationOfMissing = 'The candidate submitted an adversarial instruction override rather than technical analysis.';
  } else if (!explanationOfMissing) {
    explanationOfMissing = 'The response omitted essential trade-offs and failure-mode recovery mechanisms.';
  }

  // 6. Actionable next steps
  const actionableNextSteps = Array.isArray(rawResult.actionableNextSteps) && rawResult.actionableNextSteps.length > 0
    ? rawResult.actionableNextSteps.map(String)
    : ['Review core principles and retry with concrete metrics.'];

  // 7. Uncertainty & Ambiguity Detection
  let confidenceScore = Number(rawResult.confidenceScore);
  if (!Number.isFinite(confidenceScore) || confidenceScore <= 0 || confidenceScore > 1) {
    confidenceScore = wordCount < 15 ? 0.45 : wordCount < 30 ? 0.75 : 0.95;
  }
  if (isInjection) confidenceScore = 1.0;

  let evaluatorNote = rawResult.evaluatorNote ? String(rawResult.evaluatorNote).trim() : undefined;
  if (wordCount < 15 && !evaluatorNote && !isInjection) {
    evaluatorNote = 'Notice: Candidate submission is extremely brief (<15 words). Score reflects high uncertainty regarding overall competency.';
  }

  return {
    overallScore: computedScore,
    technicalAccuracy: factual,
    reasoningTradeoff: reasoning,
    structureClarity: clarity,
    strengths,
    weaknesses,
    weakestSkill,
    explanationOfMissing,
    actionableNextSteps,
    isContentOnly: true,
    dimensionScores: {
      factualCorrectness: factual,
      conceptCoverage: coverage,
      reasoningDepth: reasoning,
      practicalApplication: practical,
      communicationClarity: clarity,
    },
    dimensionWeights: weights,
    scoreBreakdown: `Score ${computedScore} = ` +
      `Factual(${factual}×${weights.factualCorrectness}) + ` +
      `Coverage(${coverage}×${weights.conceptCoverage}) + ` +
      `Reasoning(${reasoning}×${weights.reasoningDepth}) + ` +
      `Practical(${practical}×${weights.practicalApplication}) + ` +
      `Clarity(${clarity}×${weights.communicationClarity})`,
    evidenceItems,
    confidenceScore,
    evaluatorNote,
  };
}

/**
 * Validates and normalizes an evaluateRetry response.
 * Enforces that isWeaknessResolved is true ONLY IF:
 * 1. newScore >= 75
 * 2. Demonstrable evidence of fixing the missing concept is provided in retry.
 */
export function validateRetryResponse(rawResult, originalScore = 50, weakestSkill = '', retryAnswerText = '') {
  if (!rawResult || typeof rawResult !== 'object') {
    throw new Error('MALFORMED_RETRY_EVALUATION: Model returned a non-object retry response.');
  }

  const baseScore = Math.max(0, Math.min(100, Math.round(Number(originalScore) || 50)));
  let newScore = Math.max(0, Math.min(100, Math.round(Number(rawResult.newScore) || baseScore)));
  const trimmedRetry = String(retryAnswerText).trim();

  // Prompt injection check on retry
  if (detectPromptInjection(trimmedRetry)) {
    newScore = Math.min(newScore, 10);
  }

  const improvementDelta = newScore - baseScore;

  const rawEvidence = Array.isArray(rawResult.improvementEvidence)
    ? rawResult.improvementEvidence.map(String).filter((s) => s.trim().length > 0)
    : [];

  // Weakness is resolved ONLY when:
  // 1. newScore is at or above the 75-point advancement bar
  // 2. Candidate provided substantial retry text (>10 words)
  // 3. rawResult marked it resolved AND provided concrete improvement evidence
  // 4. Retry is not an injection
  const meetsScoreThreshold = newScore >= 75;
  const hasSubstance = trimmedRetry.split(/\s+/).length >= 10;
  const modelApproved = Boolean(rawResult.isWeaknessResolved);
  const hasEvidence = rawEvidence.length > 0;
  const isInjection = detectPromptInjection(trimmedRetry);

  const isWeaknessResolved =
    !isInjection &&
    meetsScoreThreshold &&
    hasSubstance &&
    modelApproved &&
    hasEvidence;

  const comparisonFeedback = String(
    rawResult.comparisonFeedback ||
      (isWeaknessResolved
        ? 'The revised answer addresses the core omission with verified technical precision.'
        : 'The revised answer does not yet provide sufficient technical evidence to resolve the deficit.')
  );

  const progressionEligible = isWeaknessResolved;
  const progressionExplanation = isWeaknessResolved
    ? `Deficit "${weakestSkill}" successfully remediated. Retry achieved ${newScore}/100 with verified evidence.`
    : `Deficit "${weakestSkill}" remains active. Requires retry score ≥ 75 (current: ${newScore}) and verified evidence of the missing concept.`;

  return {
    originalScore: baseScore,
    newScore,
    improvementDelta,
    isWeaknessResolved,
    comparisonFeedback,
    improvementEvidence: hasEvidence ? rawEvidence : ['Demonstrated initial awareness of the required concept.'],
    progressionEligible,
    progressionExplanation,
  };
}
