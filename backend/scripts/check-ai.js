import { env } from '../src/config/env.js';

// Lists model metadata only. Never generates content or prints the API key.
if (!env.geminiApiKey) {
  console.error('GEMINI_API_KEY is not configured.');
  process.exitCode = 1;
} else {
  try {
    const models = [];
    let pageToken = '';
    do {
      const url = new URL('https://generativelanguage.googleapis.com/v1beta/models');
      url.searchParams.set('pageSize', '100');
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const response = await fetch(url, { headers: { 'x-goog-api-key': env.geminiApiKey }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(`Model discovery returned HTTP ${response.status}. Check your key and project access.`);
      const data = await response.json();
      models.push(...(data.models || []));
      pageToken = data.nextPageToken || '';
    } while (pageToken);
    const available = new Set(models.filter((model) => model.supportedGenerationMethods?.includes('generateContent')).map((model) => model.name.replace(/^models\//, '')));
    const configured = [env.geminiModel, ...env.aiModelFallbacks.map((value) => value.replace(/^gemini:/, ''))];
    for (const model of configured) {
      console.log(`${model}: ${available.has(model) ? 'available for generateContent' : 'NOT AVAILABLE with this API key'}`);
      if (!available.has(model)) process.exitCode = 1;
    }
    console.log('Metadata check only. Generation, available quota, and billing tier were not tested.');
  } catch (error) {
    console.error(error.name === 'TimeoutError' ? 'Model discovery timed out. Check network access.' : error.message === 'fetch failed' ? 'Could not reach Gemini. Check DNS, proxy, and network access.' : error.message);
    process.exitCode = 1;
  }
}
