import test from 'node:test';
import assert from 'node:assert/strict';

process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.GEMINI_MODEL = 'gemini-test-model';

const { generateGeminiJson, generateGeminiText, parseGeminiJson } = await import('../src/services/gemini.service.js');

test('generateGeminiJson calls Gemini generateContent with JSON response format', async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl;
  let capturedBody;

  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: '{"questionText":"Explain your design choice.","questionType":"main"}' }],
          },
        }],
      }),
    };
  };

  try {
    const raw = await generateGeminiJson('Ask a question', { systemInstruction: 'JSON only', temperature: 0.5 });
    const parsed = parseGeminiJson(raw);

    assert.equal(capturedUrl, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-test-model:generateContent');
    assert.equal(capturedBody.contents[0].parts[0].text, 'Ask a question');
    assert.equal(capturedBody.system_instruction.parts[0].text, 'JSON only');
    assert.equal(capturedBody.generationConfig.temperature, 0.5);
    assert.equal(capturedBody.generationConfig.responseMimeType, 'application/json');
    assert.equal(parsed.questionText, 'Explain your design choice.');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('parseGeminiJson repairs a malformed trailing token from Gemini output', () => {
  const malformed = `{
  "decision": "ASK_FOLLOWUP",
  "questionText": "How would you prevent this deadlock?",
  "reasoning": "The candidate needs a practical follow-up."
  ."
}`;

  const parsed = parseGeminiJson(malformed);

  assert.equal(parsed.decision, 'ASK_FOLLOWUP');
  assert.equal(parsed.questionText, 'How would you prevent this deadlock?');
});

test('generateGeminiText sends inline audio parts for transcription', async () => {
  const originalFetch = globalThis.fetch;
  let capturedBody;

  globalThis.fetch = async (_url, options) => {
    capturedBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: 'This is the spoken answer.' }],
          },
        }],
      }),
    };
  };

  try {
    const text = await generateGeminiText([
      { text: 'Transcribe this audio.' },
      { inlineData: { mimeType: 'audio/webm', data: 'ZmFrZQ==' } },
    ]);

    assert.equal(capturedBody.contents[0].parts[1].inlineData.mimeType, 'audio/webm');
    assert.equal(capturedBody.generationConfig.temperature, 0.2);
    assert.equal(text, 'This is the spoken answer.');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('generateGeminiJson maps Gemini quota failures to operational 429 errors', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => ({
    ok: false,
    status: 429,
    text: async () => JSON.stringify({ error: { message: 'quota exceeded' } }),
  });

  try {
    await assert.rejects(
      () => generateGeminiJson('Ask a question'),
      (error) => error.statusCode === 429
        && error.isOperational === true
        && /quota|rate limit/i.test(error.message),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
