function normalize(text = '') {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function words(text = '') {
  return normalize(text).split(' ').filter((word) => word.length > 2);
}

export function questionSimilarity(a, b) {
  const left = new Set(words(a));
  const right = new Set(words(b));
  if (!left.size || !right.size) return 0;
  const overlap = [...left].filter((word) => right.has(word)).length;
  return overlap / Math.min(left.size, right.size);
}

export function isQuestionRepeated(questionText, askedQuestions = [], threshold = 0.72) {
  return askedQuestions.some((asked) => questionSimilarity(questionText, asked) >= threshold);
}

export function buildRepetitionGuard(askedQuestions = []) {
  if (!askedQuestions.length) return 'No questions have been asked yet.';
  const blockedPhrases = askedQuestions.map((question) => {
    const phrase = words(question).slice(0, 10).join(' ');
    return phrase || normalize(question);
  });
  return [
    'Do not repeat or paraphrase any previous question.',
    'Previously asked exact questions:',
    ...askedQuestions.map((question, index) => `${index + 1}. ${question}`),
    'Blocked key phrases:',
    ...blockedPhrases.map((phrase) => `- ${phrase}`),
  ].join('\n');
}
