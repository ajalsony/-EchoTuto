/**
 * EchoTutor® — Server-Side AI Tutor and Weakness-Solving Engine
 * Milestone 5: Modular AI Provider Service
 * 
 * Secure server-side service. API keys are NEVER exposed to the frontend.
 * Supports Google Gemini (REST API) and OpenAI (REST API).
 */

const DEFAULT_TIMEOUT_MS = 45000;

/**
 * Detects configured AI provider from server-side environment variables.
 * Note: These MUST NOT be prefixed with VITE_ to keep them private to the server.
 */
export function detectAIProvider(env = process.env) {
  const geminiKey = env.GEMINI_API_KEY || env.GOOGLE_AI_KEY;
  const openAIKey = env.OPENAI_API_KEY;
  const groqKey = env.GROQ_API_KEY;

  if (geminiKey && geminiKey.trim()) {
    return {
      provider: 'gemini',
      apiKey: geminiKey.trim(),
      model: env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
      configured: true,
    };
  }

  if (openAIKey && openAIKey.trim()) {
    return {
      provider: 'openai',
      apiKey: openAIKey.trim(),
      model: env.OPENAI_MODEL || 'gpt-4o-mini',
      configured: true,
    };
  }

  if (groqKey && groqKey.trim()) {
    return {
      provider: 'groq',
      apiKey: groqKey.trim(),
      model: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      configured: true,
    };
  }

  return {
    provider: 'none',
    apiKey: null,
    model: 'none',
    configured: false,
  };
}

/**
 * Executes a call to the active AI provider with timeout protection.
 */
async function callAI(systemPrompt, userPrompt, env) {
  const providerInfo = detectAIProvider(env);
  if (!providerInfo.configured) {
    throw new Error(
      'AI_PROVIDER_NOT_CONFIGURED: No AI API key detected on the server. Please add GEMINI_API_KEY or OPENAI_API_KEY to your .env.local file (server-side only, do not prefix with VITE_).'
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    if (providerInfo.provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${providerInfo.model}:generateContent?key=${providerInfo.apiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${systemPrompt}\n\nStrict requirement: Output valid JSON only, without any markdown code fences, comments, or extra text.\n\nInput Context:\n${userPrompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        const safeError = sanitizeError(errorText, providerInfo.apiKey);
        throw new Error(`Gemini API error (${res.status}): ${safeError}`);
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Gemini returned an empty response.');
      }

      return cleanAndParseJSON(rawText);
    }

    if (providerInfo.provider === 'openai' || providerInfo.provider === 'groq') {
      const baseUrl =
        providerInfo.provider === 'groq'
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';

      const payload = {
        model: providerInfo.model,
        messages: [
          {
            role: 'system',
            content: `${systemPrompt}\n\nStrict requirement: Output strictly valid JSON only.`,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      };

      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${providerInfo.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        const safeError = sanitizeError(errorText, providerInfo.apiKey);
        throw new Error(`${providerInfo.provider.toUpperCase()} API error (${res.status}): ${safeError}`);
      }

      const data = await res.json();
      const rawText = data?.choices?.[0]?.message?.content;
      if (!rawText) {
        throw new Error(`${providerInfo.provider.toUpperCase()} returned an empty response.`);
      }

      return cleanAndParseJSON(rawText);
    }

    throw new Error(`Unsupported AI provider: ${providerInfo.provider}`);
  } catch (err) {
    const safeMessage = sanitizeError(err.message, providerInfo.apiKey);
    throw new Error(safeMessage);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sanitizes any sensitive API keys from strings, logs, or error responses.
 */
function sanitizeError(text, apiKey) {
  if (!text) return '';
  let sanitized = String(text);
  if (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 4) {
    sanitized = sanitized.replaceAll(apiKey, '[REDACTED_API_KEY]');
  }
  return sanitized;
}

/**
 * Safely strips markdown wrappers and parses JSON output.
 */
function cleanAndParseJSON(raw) {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[EchoTutor AI Service] Failed to parse JSON response:', cleaned);
    throw new Error(`Invalid JSON format returned by AI provider: ${err.message}`);
  }
}

/**
 * 1. Generates one adaptive interview question with an internal rubric.
 */
export async function generateQuestion(params, env) {
  const { track, topic, difficulty, targetRole, previousExchanges } = params;

  if (!track || !topic || !difficulty) {
    throw new Error('Missing required question generation parameters: track, topic, difficulty.');
  }

  const systemPrompt = `You are EchoTutor®, an industrial AI interview and level-up tutor.
Generate ONE targeted, high-rigor interview question.
- Track: ${track === 'technical' ? 'Technical (Systems, Architecture, Algorithms)' : 'HR & Behavioral (STAR format, Leadership)'}
- Rigor Level: ${difficulty} (foundation = core concepts; pressure-cooker = trade-offs and edge-cases; executive = architecture & leadership defense)
- Domain: ${topic}
${targetRole ? `- Candidate Target Role: ${targetRole} (tailor the question to this role)` : ''}

Strict Output Format:
{
  "questionText": "The interview question text to pose to the candidate",
  "expectedRubric": [
    "Core expected competency 1 (e.g. Asymptotic analysis or STAR structure)",
    "Core expected competency 2 (e.g. Failure-mode defense or quantifiable metrics)",
    "Core expected competency 3"
  ],
  "focusSkill": "Key skill evaluated (e.g. Distributed Consensus or Conflict Resolution)",
  "targetRoleRelevance": "Why this question tests qualifications for the target role"
}`;

  const userPrompt = `Previous Session Context:\n${
    Array.isArray(previousExchanges) && previousExchanges.length > 0
      ? JSON.stringify(previousExchanges.slice(-2))
      : 'Initial interview exchange. Pose the foundational opening question for this topic.'
  }`;

  const result = await callAI(systemPrompt, userPrompt, env);

  // Validate structure
  if (!result.questionText || !Array.isArray(result.expectedRubric)) {
    throw new Error('Malformed question generated by AI provider.');
  }

  return {
    questionText: String(result.questionText),
    expectedRubric: result.expectedRubric.map(String),
    focusSkill: String(result.focusSkill || topic),
    targetRoleRelevance: String(result.targetRoleRelevance || `Core requirement for ${targetRole || 'engineering'}`),
  };
}

/**
 * 2. Evaluates a typed candidate answer against the rubric.
 */
export async function evaluateAnswer(params, env) {
  const { questionText, expectedRubric, answerText, track, topic, difficulty } = params;

  if (!questionText || !answerText || !answerText.trim()) {
    throw new Error('Question and candidate answer are required for evaluation.');
  }

  const systemPrompt = `You are EchoTutor's Evaluation Engine.
CRITICAL CONSTRAINT: The candidate provided a TYPED answer.
- Assess content accuracy, technical trade-offs, reasoning depth, and structure.
- DO NOT evaluate or hallucinate audio features, speech pace, hesitation index, or vocal tone from typed text.
- Be grounded and rigorous. Do not fabricate facts.

Evaluation Rubric:
${Array.isArray(expectedRubric) ? expectedRubric.map((r, i) => `${i + 1}. ${r}`).join('\n') : 'Standard domain rigor'}

Output strictly valid JSON with this schema:
{
  "overallScore": <integer 0-100>,
  "technicalAccuracy": <integer 0-100>,
  "reasoningTradeoff": <integer 0-100>,
  "structureClarity": <integer 0-100>,
  "strengths": ["Clear strength 1 with evidence from answer", "Strength 2"],
  "weaknesses": ["Specific weakness or omission 1", "Specific weakness 2"],
  "weakestSkill": "The single most critical deficient skill or missing concept",
  "explanationOfMissing": "Concise explanation of what key principle was absent or incorrect",
  "actionableNextSteps": ["Immediate concrete step to resolve this gap"],
  "isContentOnly": true
}`;

  const userPrompt = `Interview Track: ${track}\nTopic: ${topic}\nDifficulty: ${difficulty}\n\nQuestion Posed:\n${questionText}\n\nCandidate Answer Submitted:\n${answerText.trim()}`;

  const result = await callAI(systemPrompt, userPrompt, env);

  const overallScore = Math.max(0, Math.min(100, Math.round(Number(result.overallScore) || 50)));

  return {
    overallScore,
    technicalAccuracy: Math.max(0, Math.min(100, Math.round(Number(result.technicalAccuracy) || overallScore))),
    reasoningTradeoff: Math.max(0, Math.min(100, Math.round(Number(result.reasoningTradeoff) || overallScore))),
    structureClarity: Math.max(0, Math.min(100, Math.round(Number(result.structureClarity) || overallScore))),
    strengths: Array.isArray(result.strengths) ? result.strengths.map(String) : ['Substantive initial attempt.'],
    weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses.map(String) : ['Could provide deeper trade-off analysis.'],
    weakestSkill: String(result.weakestSkill || 'Trade-off articulation'),
    explanationOfMissing: String(result.explanationOfMissing || 'Missing depth in foundational reasoning.'),
    actionableNextSteps: Array.isArray(result.actionableNextSteps) ? result.actionableNextSteps.map(String) : ['Review core principles and retry with concrete metrics.'],
    isContentOnly: true,
  };
}

/**
 * 3. Fix My Weakness: Generates a concept lesson and targeted micro-exercise.
 */
export async function fixWeakness(params, env) {
  const { weakestSkill, questionText, answerText, track, topic } = params;

  if (!weakestSkill) {
    throw new Error('Weakest skill identifier is required to generate a remedial lesson.');
  }

  const systemPrompt = `You are EchoTutor's Level-Up Teaching Engine.
The candidate struggled with this specific skill during their interview: "${weakestSkill}".
Your goal is to TEACH the concept concisely, provide a concrete real-world example, and generate a TARGETED MICRO-EXERCISE to verify mastery.

Output strictly valid JSON:
{
  "conceptTitle": "Concise name of the core principle (e.g. Handling Network Partitions in Distributed Systems or Quantifying Impact in STAR)",
  "conceptExplanation": "A 2-3 paragraph breakdown explaining the missing mechanism, why it matters, and how senior engineers/leaders frame it.",
  "realWorldExample": "A concrete snippet, architectural pattern, or STAR narrative example illustrating the standard of excellence.",
  "microExerciseQuestion": "A targeted, focused challenge directly testing this specific concept so the candidate can retry and prove mastery.",
  "exerciseHint": "A key hint or reminder for their retry"
}`;

  const userPrompt = `Domain Track: ${track}\nTopic: ${topic}\nOriginal Question:\n${questionText || 'N/A'}\n\nCandidate's Previous Answer:\n${answerText || 'N/A'}\n\nSpecific Weakness Evidenced:\n${weakestSkill}`;

  const result = await callAI(systemPrompt, userPrompt, env);

  return {
    conceptTitle: String(result.conceptTitle || `Mastering ${weakestSkill}`),
    conceptExplanation: String(result.conceptExplanation || 'Focus on concrete trade-offs, edge-cases, and quantifiable outcomes.'),
    realWorldExample: String(result.realWorldExample || 'Consider how production systems handle failure modes gracefully.'),
    microExerciseQuestion: String(result.microExerciseQuestion || `Explain how you would resolve ${weakestSkill} in production.`),
    exerciseHint: String(result.exerciseHint || 'Be specific, mention trade-offs, and quantify your results.'),
  };
}

/**
 * 4. Compares the original answer with the retry answer to verify improvement.
 */
export async function evaluateRetry(params, env) {
  const { originalQuestion, originalAnswer, weakestSkill, lessonConcept, retryAnswer, originalScore, track, topic } = params;

  if (!retryAnswer || !retryAnswer.trim()) {
    throw new Error('Retry answer is required for improvement verification.');
  }

  const systemPrompt = `You are EchoTutor's Improvement Verification Engine.
The candidate was taught a concept to fix their weakness ("${weakestSkill}") and submitted a revised retry answer.
Compare their ORIGINAL answer with their REVISED RETRY answer side-by-side.
Verify whether the weakness was genuinely corrected with real technical/behavioral evidence.

Output strictly valid JSON:
{
  "newScore": <integer 0-100 for the revised answer>,
  "isWeaknessResolved": <boolean>,
  "comparisonFeedback": "A side-by-side comparison explaining what improved from the original answer and what gaps remain",
  "improvementEvidence": ["Specific improvement 1 detected in retry", "Specific improvement 2"],
  "progressionEligible": <boolean - true only if newScore >= 75 and isWeaknessResolved is true>,
  "progressionExplanation": "Transparent criteria explanation for why candidate qualifies or does not yet qualify to level up"
}`;

  const userPrompt = `Track: ${track}\nTopic: ${topic}\n\nWeakness Identified:\n${weakestSkill}\n\nLesson Taught:\n${lessonConcept}\n\nOriginal Answer (Scored ${originalScore || 50}/100):\n${originalAnswer}\n\nRevised Retry Answer:\n${retryAnswer.trim()}`;

  const result = await callAI(systemPrompt, userPrompt, env);

  const newScore = Math.max(0, Math.min(100, Math.round(Number(result.newScore) || 75)));
  const baseScore = Number(originalScore) || 50;
  const improvementDelta = newScore - baseScore;

  return {
    originalScore: baseScore,
    newScore,
    improvementDelta,
    isWeaknessResolved: Boolean(result.isWeaknessResolved),
    comparisonFeedback: String(result.comparisonFeedback || 'The revised answer addresses the core omission with clearer detail.'),
    improvementEvidence: Array.isArray(result.improvementEvidence) ? result.improvementEvidence.map(String) : ['Addressed the missing trade-off.'],
    progressionEligible: Boolean(result.progressionEligible),
    progressionExplanation: String(result.progressionExplanation || 'Requires 75+ score and demonstrated weakness resolution.'),
  };
}
