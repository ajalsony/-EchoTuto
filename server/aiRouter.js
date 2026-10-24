/**
 * EchoTutor® — Server-Side AI API Request Dispatcher
 * Milestone 5: HTTP Middleware Handler
 */

import {
  detectAIProvider,
  generateQuestion,
  evaluateAnswer,
  fixWeakness,
  evaluateRetry,
} from './aiService.js';

/**
 * Handles incoming HTTP requests for /api/ai endpoints.
 * Compatible with Vite dev server middleware and Node.js http servers.
 */
export async function handleAIEndpoint(req, res, env = process.env) {
  const url = req.url || '';
  const method = req.method || 'GET';

  // Set JSON headers
  res.setHeader('Content-Type', 'application/json');

  // 1. Status Check
  if (url === '/api/ai/status' || url.endsWith('/status')) {
    const providerInfo = detectAIProvider(env);
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        status: providerInfo.configured ? 'ready' : 'unconfigured',
        provider: providerInfo.provider,
        model: providerInfo.model,
        configured: providerInfo.configured,
        message: providerInfo.configured
          ? `Active AI provider: ${providerInfo.provider} (${providerInfo.model})`
          : 'No AI API key found. Add GEMINI_API_KEY or OPENAI_API_KEY to .env.local (server-side only, without VITE_).',
      })
    );
    return;
  }

  // All other endpoints require POST
  if (method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
    return;
  }

  // Parse JSON Body
  let body;
  try {
    body = await readJSONBody(req);
  } catch (err) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: `Malformed JSON request body: ${err.message}` }));
    return;
  }

  try {
    // 2. Generate Question
    if (url === '/api/ai/generate-question' || url.endsWith('/generate-question')) {
      const data = await generateQuestion(body, env);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, data }));
      return;
    }

    // 3. Evaluate Answer
    if (url === '/api/ai/evaluate-answer' || url.endsWith('/evaluate-answer')) {
      const data = await evaluateAnswer(body, env);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, data }));
      return;
    }

    // 4. Fix Weakness
    if (url === '/api/ai/fix-weakness' || url.endsWith('/fix-weakness')) {
      const data = await fixWeakness(body, env);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, data }));
      return;
    }

    // 5. Evaluate Retry
    if (url === '/api/ai/evaluate-retry' || url.endsWith('/evaluate-retry')) {
      const data = await evaluateRetry(body, env);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, data }));
      return;
    }

    // 404 Route Not Found
    res.statusCode = 404;
    res.end(JSON.stringify({ error: `Unknown endpoint: ${url}` }));
  } catch (err) {
    console.error(`[EchoTutor AI Server] Error processing ${url}:`, err.message);
    const isUnconfigured = err.message.includes('AI_PROVIDER_NOT_CONFIGURED');
    res.statusCode = isUnconfigured ? 503 : 500;
    res.end(
      JSON.stringify({
        success: false,
        error: isUnconfigured ? 'AI_PROVIDER_NOT_CONFIGURED' : 'AI_PROCESSING_ERROR',
        message: err.message,
      })
    );
  }
}

/**
 * Reads and parses JSON payload from incoming stream.
 */
function readJSONBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      // Cap at 1MB to prevent memory exhaustion
      if (raw.length > 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large (exceeds 1MB)'));
      }
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}
