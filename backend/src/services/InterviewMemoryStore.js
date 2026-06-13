import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

function tokenize(text = '') {
  return text.toLowerCase().match(/[a-z0-9+#.]+/g) || [];
}

function lexicalEmbedding(text = '') {
  const vector = new Array(64).fill(0);
  for (const token of tokenize(text)) {
    let hash = 0;
    for (let index = 0; index < token.length; index += 1) {
      hash = ((hash << 5) - hash + token.charCodeAt(index)) | 0;
    }
    vector[Math.abs(hash) % vector.length] += 1;
  }
  const magnitude = Math.hypot(...vector) || 1;
  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

function cosine(a = [], b = []) {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  return a.reduce((sum, value, index) => sum + value * b[index], 0);
}

async function openAiEmbedding(text) {
  if (process.env.NODE_ENV === 'test' || env.mockAi || !env.openaiApiKey) return null;
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
        input: text.slice(0, 8000),
      }),
    });
    if (!response.ok) throw new Error(`Embedding request failed with status ${response.status}`);
    const data = await response.json();
    return data.data?.[0]?.embedding || null;
  } catch (error) {
    logger.warn('Embedding unavailable; using lexical retrieval fallback', { error: error.message });
    return null;
  }
}

async function buildEmbedding(text) {
  return await openAiEmbedding(text) || lexicalEmbedding(text);
}

function summarize(memory = {}) {
  const exchanges = memory.exchanges || [];
  const aggregate = exchanges.reduce((acc, exchange) => {
    const extraction = exchange.extraction || {};
    for (const field of ['keywords', 'skills', 'technologies', 'experienceClaims', 'achievements', 'weaknesses', 'projectNames']) {
      acc[field] = [...new Set([...(acc[field] || []), ...(extraction[field] || [])])].slice(0, 20);
    }
    return acc;
  }, {});

  return {
    exchangeCount: exchanges.length,
    ...aggregate,
    averageConfidence: exchanges.length
      ? Number((exchanges.reduce((sum, item) => sum + Number(item.extraction?.confidence || 0), 0) / exchanges.length).toFixed(2))
      : 0,
  };
}

export const InterviewMemoryStore = {
  async appendExchange(memory = {}, { question, answer, extraction }) {
    const exchangeText = [
      question?.questionText,
      question?.topic,
      question?.subject,
      answer,
      ...(extraction.skills || []),
      ...(extraction.technologies || []),
      ...(extraction.projectNames || []),
    ].filter(Boolean).join(' ');

    const exchange = {
      id: `exchange_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      questionText: question?.questionText || '',
      questionType: question?.questionType || 'main',
      topic: question?.topic || '',
      subject: question?.subject || '',
      answerTranscript: answer,
      extraction,
      embedding: await buildEmbedding(exchangeText),
      createdAt: new Date(),
    };

    const exchanges = [...(memory.exchanges || []), exchange];
    return {
      ...memory,
      exchanges,
      summary: summarize({ ...memory, exchanges }),
      updatedAt: new Date(),
    };
  },

  async retrieve(memory = {}, query = '', limit = 3) {
    const queryEmbedding = await buildEmbedding(query);
    return [...(memory.exchanges || [])]
      .map((exchange) => ({ ...exchange, similarity: cosine(queryEmbedding, exchange.embedding || []) }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  },

  summarize,
};
