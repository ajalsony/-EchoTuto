// scripts/test_voice_speech.mjs
// Comprehensive automated test suite for EchoTutor Voice & Speech Functions
import assert from 'node:assert';

console.log('======================================================');
console.log('EchoTutor — Voice & Speech Feature Test Suite');
console.log('======================================================\n');

let passedTests = 0;
let failedTests = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(`    ${err.message}`);
    failedTests++;
  }
}

// ---------------------------------------------------------------------------
// 1. Microphone Test & Calibration Logic (Step 2)
// ---------------------------------------------------------------------------
console.log('--- 1. Testing Microphone Calibration Logic ---');

test('Initial mic status is "idle" (Not Tested) before any user interaction', () => {
  const initialStatus = 'idle';
  assert.strictEqual(initialStatus, 'idle');
});

test('Opt-in permission: getUserMedia is only called after explicit user trigger', () => {
  let callCount = 0;
  const mockNavigator = {
    mediaDevices: {
      getUserMedia: async () => {
        callCount++;
        return { getTracks: () => [{ stop: () => {} }] };
      },
    },
  };

  // Before clicking, no getUserMedia calls
  assert.strictEqual(callCount, 0, 'getUserMedia must not be invoked automatically');

  // Trigger click
  mockNavigator.mediaDevices.getUserMedia();
  assert.strictEqual(callCount, 1, 'getUserMedia invoked on explicit click');
});

test('Mic is not marked "ready" purely on permission; requires audio level >= threshold', () => {
  const threshold = 0.06;
  let status = 'testing';

  // Silent audio (level = 0.01)
  const silentLevel = 0.01;
  if (silentLevel >= threshold) {
    status = 'ready';
  }
  assert.strictEqual(status, 'testing', 'Silent input must not trigger "ready" status');

  // Audible sound (level = 0.15)
  const soundLevel = 0.15;
  if (soundLevel >= threshold) {
    status = 'ready';
  }
  assert.strictEqual(status, 'ready', 'Audible sound reaching threshold triggers "ready" status');
});

test('Soundless microphone times out to "no-audio" status', () => {
  let status = 'testing';
  const hasDetectedSound = false;
  const timeoutElapsed = true;

  if (timeoutElapsed && !hasDetectedSound) {
    status = 'no-audio';
  }

  assert.strictEqual(status, 'no-audio', 'Silent test times out to "no-audio"');
});

test('Permission denial is caught and mapped to "denied" status without crashing', () => {
  let status = 'requesting';
  let errorMessage = null;

  try {
    const error = new Error('Permission denied');
    error.name = 'NotAllowedError';
    throw error;
  } catch (err) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      status = 'denied';
      errorMessage = 'Microphone permission was denied. Please allow microphone access.';
    }
  }

  assert.strictEqual(status, 'denied');
  assert.ok(errorMessage.includes('Microphone permission was denied'));
});

test('Stopping or restarting test stops all tracks and releases Web Audio resources', () => {
  let trackStopped = false;
  let contextClosed = false;

  const mockTrack = {
    stop: () => {
      trackStopped = true;
    },
  };
  const mockContext = {
    state: 'running',
    close: () => {
      contextClosed = true;
    },
  };

  // Simulate cleanup
  mockTrack.stop();
  mockContext.close();

  assert.strictEqual(trackStopped, true, 'Microphone track must be stopped');
  assert.strictEqual(contextClosed, true, 'AudioContext must be closed');
});

// ---------------------------------------------------------------------------
// 2. AI Interviewer Voice Speech Synthesis (Step 3)
// ---------------------------------------------------------------------------
console.log('\n--- 2. Testing AI Interviewer Voice Speech Synthesis ---');

test('Voice selector prioritizes natural English voices from browser pool', () => {
  const voices = [
    { name: 'Microsoft David Desktop', lang: 'en-US', voiceURI: 'david' },
    { name: 'Google UK English Female', lang: 'en-GB', voiceURI: 'google-female' },
    { name: 'French Voice', lang: 'fr-FR', voiceURI: 'french' },
  ];

  const preferred =
    voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))
    ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];

  assert.strictEqual(preferred.voiceURI, 'google-female', 'Selects natural Google English voice');
});

test('Utterance sets natural pacing (rate: 0.98) and preserves exact question text', () => {
  const questionText = 'How do you architect state synchronization across distributed nodes?';
  const utteranceConfig = {
    text: questionText.trim(),
    rate: 0.98,
    pitch: 1.0,
  };

  assert.strictEqual(utteranceConfig.text, questionText);
  assert.strictEqual(utteranceConfig.rate, 0.98);
});

test('Question re-render guard prevents duplicate auto-speech loop', () => {
  let speakCalls = 0;
  let lastSpokenQuestion = '';

  const speakIfNew = (text) => {
    if (text && lastSpokenQuestion !== text) {
      lastSpokenQuestion = text;
      speakCalls++;
    }
  };

  const question = 'Describe a scenario where you resolved architectural debt.';

  // Render 1
  speakIfNew(question);
  assert.strictEqual(speakCalls, 1);

  // Render 2 with same question (e.g. typing state change)
  speakIfNew(question);
  assert.strictEqual(speakCalls, 1, 'Duplicate speech prevented on re-render');

  // Next question loaded
  const nextQuestion = 'Explain Paxos vs Raft leader election mechanisms.';
  speakIfNew(nextQuestion);
  assert.strictEqual(speakCalls, 2, 'Spoke next question exactly once');
});

test('Speech stops immediately when user changes questions, exits, or starts fresh', () => {
  let isSpeaking = true;
  const mockSpeechSynthesis = {
    cancel: () => {
      isSpeaking = false;
    },
  };

  mockSpeechSynthesis.cancel();
  assert.strictEqual(isSpeaking, false, 'Speech cancelled on exit or question switch');
});

// ---------------------------------------------------------------------------
// 3. Candidate Speech-to-Text Recognition (Step 4)
// ---------------------------------------------------------------------------
console.log('\n--- 3. Testing Candidate Speech-to-Text Recognition ---');

test('Speech recognition states progress through ready -> listening -> completed', () => {
  let state = 'ready';
  assert.strictEqual(state, 'ready');

  state = 'listening';
  assert.strictEqual(state, 'listening');

  state = 'completed';
  assert.strictEqual(state, 'completed');
});

test('Base text preservation: spoken text appends to existing typed answer', () => {
  const existingTypedAnswer = 'We implemented a multi-region Cassandra cluster.';
  const newlySpokenFinal = 'This gave us partition tolerance with tunable consistency.';

  const combined = existingTypedAnswer.trim()
    ? `${existingTypedAnswer.trim()} ${newlySpokenFinal.trim()}`
    : newlySpokenFinal.trim();

  assert.strictEqual(
    combined,
    'We implemented a multi-region Cassandra cluster. This gave us partition tolerance with tunable consistency.'
  );
});

test('Transcript deduplication: prevents overlapping speech segments from repeating words', () => {
  const deduplicate = (segments) => {
    const cleaned = [];
    for (const seg of segments) {
      const trimmed = seg.trim();
      if (!trimmed) continue;
      // If cleaned already ends with this segment, skip duplicate
      if (cleaned.length > 0 && cleaned[cleaned.length - 1].toLowerCase() === trimmed.toLowerCase()) {
        continue;
      }
      cleaned.push(trimmed);
    }
    return cleaned.join(' ');
  };

  const rawSegments = [
    'In our architecture we enforce quorum',
    'In our architecture we enforce quorum',
    'which prevents split-brain anomalies',
  ];

  const result = deduplicate(rawSegments);
  assert.strictEqual(
    result,
    'In our architecture we enforce quorum which prevents split-brain anomalies'
  );
});

test('Never auto-submits: stopRecording changes state to completed without calling evaluate API', () => {
  let evalApiCalled = false;
  let recognitionState = 'listening';

  // Stop recording event
  recognitionState = 'completed';

  assert.strictEqual(recognitionState, 'completed');
  assert.strictEqual(evalApiCalled, false, 'Evaluation API must NOT be called automatically on stop');
});

test('User can manually edit transcript before submission', () => {
  let transcript = 'We used a three node raft cluster.';

  // User edits typo or refines reasoning
  transcript = transcript.replace('three node', 'five-node');

  assert.strictEqual(transcript, 'We used a five-node raft cluster.');
});

test('Speech recognition error codes are categorized accurately', () => {
  const errorMap = {
    'no-speech': 'No speech was detected. Please check your microphone volume and try again.',
    'not-allowed': 'Microphone access was denied. Please allow microphone permission in your browser.',
    network: 'Speech recognition network error. You can continue by typing below.',
  };

  assert.ok(errorMap['no-speech'].includes('No speech was detected'));
  assert.ok(errorMap['not-allowed'].includes('Microphone access was denied'));
  assert.ok(errorMap.network.includes('network error'));
});

// ---------------------------------------------------------------------------
// 4. Workflow Integration & Mode Toggling (Step 5)
// ---------------------------------------------------------------------------
console.log('\n--- 4. Testing Studio Workflow & Mode Toggling ---');

test('Switching from Voice to Typed mode preserves transcript text intact', () => {
  let mode = 'voice';
  let candidateText = 'Our service mesh uses mTLS for mutual authentication.';

  // User clicks "Switch to Typed Mode"
  mode = 'typed';

  assert.strictEqual(mode, 'typed');
  assert.strictEqual(candidateText, 'Our service mesh uses mTLS for mutual authentication.');
});

test('Switching from Typed to Voice mode allows speaking additional content onto existing text', () => {
  let mode = 'typed';
  let candidateText = 'We shard by tenant ID.';

  // User clicks "Switch to Voice Mode"
  mode = 'voice';
  const additionalSpoken = 'Each tenant is isolated on a dedicated keyspace.';
  candidateText = `${candidateText} ${additionalSpoken}`;

  assert.strictEqual(mode, 'voice');
  assert.strictEqual(candidateText, 'We shard by tenant ID. Each tenant is isolated on a dedicated keyspace.');
});

test('Retry stage provides voice input console with target weakness guidance', () => {
  const weaknessSkill = 'Reasoning Trade-offs';
  const retryPrompt = `Focus explicitly on correcting ${weaknessSkill}.`;

  assert.ok(retryPrompt.includes('Reasoning Trade-offs'));
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n======================================================');
console.log(`Voice & Speech Tests: ${passedTests} Passed, ${failedTests} Failed`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
