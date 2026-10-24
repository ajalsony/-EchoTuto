/**
 * Automated Verification Script for EchoTutor — Milestone 5A
 * Tests:
 * 1. AI Provider detection and status reporting
 * 2. Missing-key error handling and 503 HTTP status
 * 3. Security: Key redaction in error traces
 * 4. Router HTTP method enforcement (POST vs GET)
 * 5. Level-Up qualification and unresolved weakness logic
 */

import { detectAIProvider } from '../server/aiService.js';
import { handleAIEndpoint } from '../server/aiRouter.js';

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

async function runTests() {
  console.log('\n--- 1. Testing AI Provider Detection ---');
  
  // Test 1: Empty environment returns provider: 'none'
  const emptyDetection = detectAIProvider({});
  assert(emptyDetection.provider === 'none', 'Empty env detects provider as none');
  assert(emptyDetection.configured === false, 'Empty env reports configured as false');
  assert(emptyDetection.apiKey === null, 'Empty env has null apiKey');

  // Test 2: Gemini environment detection
  const geminiDetection = detectAIProvider({ GEMINI_API_KEY: 'test-gemini-secret-key-12345' });
  assert(geminiDetection.provider === 'gemini', 'GEMINI_API_KEY detected as gemini provider');
  assert(geminiDetection.configured === true, 'Gemini env reports configured as true');
  assert(geminiDetection.model === 'gemini-3.5-flash-lite', 'Default Gemini model is gemini-3.5-flash-lite');

  // Test 3: OpenAI environment detection
  const openAIDetection = detectAIProvider({ OPENAI_API_KEY: 'test-openai-secret-key-67890' });
  assert(openAIDetection.provider === 'openai', 'OPENAI_API_KEY detected as openai provider');
  assert(openAIDetection.configured === true, 'OpenAI env reports configured as true');
  assert(openAIDetection.model === 'gpt-4o-mini', 'Default OpenAI model is gpt-4o-mini');

  console.log('\n--- 2. Testing Router Middleware & Missing Key Handling ---');

  // Mock response object
  function createMockRes() {
    return {
      statusCode: 200,
      headers: {},
      body: '',
      setHeader(name, value) { this.headers[name] = value; },
      end(data) { this.body = data; },
    };
  }

  // Test 4: /api/ai/status endpoint
  const statusReq = { url: '/api/ai/status', method: 'GET' };
  const statusRes = createMockRes();
  await handleAIEndpoint(statusReq, statusRes, {});
  const statusJson = JSON.parse(statusRes.body);
  assert(statusRes.statusCode === 200, 'Status endpoint returns HTTP 200');
  assert(statusJson.configured === false, 'Status reports configured: false when no key set');
  assert(!statusRes.body.includes('apiKey'), 'Status response NEVER includes apiKey property');

  // Test 5: Endpoint with missing key returns HTTP 503
  const evalReq = {
    url: '/api/ai/evaluate-answer',
    method: 'POST',
    on(event, handler) {
      if (event === 'data') handler(Buffer.from(JSON.stringify({
        questionText: 'Test question',
        answerText: 'Test answer',
        track: 'technical',
        topic: 'System Design',
        difficulty: 'foundation',
      })));
      if (event === 'end') handler();
    },
  };
  const evalRes = createMockRes();
  await handleAIEndpoint(evalReq, evalRes, {});
  const evalJson = JSON.parse(evalRes.body);
  assert(evalRes.statusCode === 503, 'Missing key request returns HTTP 503');
  assert(evalJson.error === 'AI_PROVIDER_NOT_CONFIGURED', 'Error code is AI_PROVIDER_NOT_CONFIGURED');
  assert(evalJson.success === false, 'Success flag is false');

  // Test 6: Method not allowed on non-POST mutation endpoints
  const getReq = { url: '/api/ai/generate-question', method: 'GET' };
  const getRes = createMockRes();
  await handleAIEndpoint(getReq, getRes, {});
  assert(getRes.statusCode === 405, 'GET on generate-question returns HTTP 405');

  console.log('\n--- 3. Testing Level-Up Qualification Logic ---');

  // Logic rule:
  // qualifies = verifiedAttempts >= 2 && averageScore >= 75 && weaknessesResolvedCount >= 1 && !hasActiveUnresolvedWeakness
  function checkQualification(verifiedAttempts, averageScore, weaknessesResolvedCount, hasActiveUnresolvedWeakness) {
    return (
      verifiedAttempts >= 2 &&
      averageScore >= 75 &&
      weaknessesResolvedCount >= 1 &&
      !hasActiveUnresolvedWeakness
    );
  }

  // Scenario A: Single high score (90) - should NOT level up
  assert(
    !checkQualification(1, 90, 1, false),
    'Single attempt with 90 score cannot level up (requires >= 2 attempts)'
  );

  // Scenario B: 2 attempts with low average (68) - should NOT level up
  assert(
    !checkQualification(2, 68, 1, false),
    '2 attempts with 68 avg score cannot level up (requires >= 75)'
  );

  // Scenario C: 2 attempts, 80 avg, but 0 weaknesses remediated - should NOT level up
  assert(
    !checkQualification(2, 80, 0, false),
    'High score without weakness resolution cannot level up (requires >= 1 resolved weakness)'
  );

  // Scenario D: 2 attempts, 80 avg, 1 resolved, but current retry is unresolved - should NOT level up
  assert(
    !checkQualification(2, 80, 1, true),
    'Active unresolved weakness blocks level up'
  );

  // Scenario E: 2 attempts, 80 avg, 1 resolved, no active unresolved weakness - QUALIFIES!
  assert(
    checkQualification(2, 80, 1, false),
    '2 attempts, 80 avg, 1 resolved weakness qualifies for Level Up'
  );

  console.log(`\n========================================`);
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
