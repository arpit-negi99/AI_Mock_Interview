const STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'and', 'are', 'because', 'been', 'being', 'built', 'can', 'could',
  'did', 'does', 'for', 'from', 'had', 'has', 'have', 'how', 'into', 'like', 'more', 'our', 'that',
  'the', 'their', 'then', 'there', 'this', 'through', 'using', 'was', 'were', 'what', 'when', 'where',
  'which', 'while', 'with', 'would', 'your',
]);

const TECH_ALIASES = new Map([
  ['react.js', 'React'],
  ['reactjs', 'React'],
  ['react', 'React'],
  ['redux', 'Redux'],
  ['node.js', 'Node.js'],
  ['nodejs', 'Node.js'],
  ['node', 'Node.js'],
  ['express', 'Express'],
  ['mongodb', 'MongoDB'],
  ['mongo', 'MongoDB'],
  ['postgresql', 'PostgreSQL'],
  ['postgres', 'PostgreSQL'],
  ['mysql', 'MySQL'],
  ['redis', 'Redis'],
  ['javascript', 'JavaScript'],
  ['typescript', 'TypeScript'],
  ['python', 'Python'],
  ['java', 'Java'],
  ['spring', 'Spring'],
  ['docker', 'Docker'],
  ['kubernetes', 'Kubernetes'],
  ['aws', 'AWS'],
  ['azure', 'Azure'],
  ['gcp', 'GCP'],
  ['graphql', 'GraphQL'],
  ['rest', 'REST'],
  ['jwt', 'JWT'],
  ['oauth', 'OAuth'],
  ['tailwind', 'Tailwind CSS'],
  ['next.js', 'Next.js'],
  ['nextjs', 'Next.js'],
]);

const SKILL_PATTERNS = [
  { skill: 'state management', pattern: /\b(state management|redux|context api|zustand|mobx)\b/i },
  { skill: 'API design', pattern: /\b(rest|graphql|api|endpoint|microservice)\b/i },
  { skill: 'database design', pattern: /\b(schema|query|index|transaction|database|mongodb|postgres|mysql)\b/i },
  { skill: 'performance optimization', pattern: /\b(performance|optimi[sz]e|latency|cache|memo|lazy|bundle)\b/i },
  { skill: 'deployment', pattern: /\b(deploy|deployment|ci\/cd|pipeline|docker|kubernetes|vercel|netlify|aws|azure|gcp)\b/i },
  { skill: 'testing', pattern: /\b(test|unit|integration|e2e|jest|vitest|coverage)\b/i },
  { skill: 'security', pattern: /\b(auth|jwt|oauth|csrf|xss|sql injection|encryption|hash)\b/i },
  { skill: 'system design', pattern: /\b(scalable|architecture|queue|cache|load balancer|distributed)\b/i },
];

const EXPERIENCE_PATTERNS = [
  /\b(?:i|we)\s+(built|created|developed|designed|implemented|led|owned|managed|optimized|deployed|integrated|migrated)\b[^.?!]*/gi,
  /\b(?:my|our)\s+(?:role|responsibility|contribution)\s+was\b[^.?!]*/gi,
];

const ACHIEVEMENT_PATTERNS = [
  /\b(?:improved|reduced|increased|decreased|saved|scaled|delivered|launched|achieved)\b[^.?!]*(?:\d+%?|\busers?\b|\bms\b|\bseconds?\b|\bminutes?\b)?/gi,
  /\b\d+%?\s+(?:faster|slower|improvement|reduction|increase|users?|requests?|latency)\b[^.?!]*/gi,
];

const WEAKNESS_PATTERNS = [
  /[^.?!]*\b(?:struggled|challenge|challenging|difficult|issue|problem|blocked|failed|weak|weakness|not sure|don't know|do not know|confused)\b[^.?!]*/gi,
];

function unique(values) {
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}

function normalizeKeyword(value) {
  return value.toLowerCase().replace(/[^a-z0-9.+#-]/g, '');
}

function extractMatches(text, patterns) {
  return unique(patterns.flatMap((pattern) => [...text.matchAll(pattern)].map((match) => match[0].trim())));
}

function extractProjectNames(text) {
  const quoted = [...text.matchAll(/["']([^"']{3,80})["']/g)].map((match) => match[1]);
  const named = [...text.matchAll(/\b(?:project|platform|app|application|system|tool|dashboard|website)\s+(?:called|named)?\s*([A-Z][A-Za-z0-9 -]{2,60})/g)]
    .map((match) => match[1]);
  const descriptive = [...text.matchAll(/\b([a-z][a-z0-9-]+(?:\s+[a-z][a-z0-9-]+){0,3})\s+(?:platform|app|application|system|tool|dashboard|website)\b/gi)]
    .map((match) => match[0]);
  return unique([...quoted, ...named, ...descriptive].map((value) => value
    .replace(/^(?:i|we|my|our|the|an?|built|created|developed|designed|implemented)\s+/i, '')
    .replace(/^(?:an?|the)\s+/i, '')
    .trim()))
    .filter((value) => !/^(?:system|app|application|platform|project|tool)$/i.test(value))
    .slice(0, 8);
}

function estimateSpecificity({ answer, technologies, skills, achievements, experienceClaims }) {
  const words = answer.split(/\s+/).filter(Boolean);
  const numericSignals = (answer.match(/\b\d+(?:\.\d+)?%?\b/g) || []).length;
  const concreteSignals = technologies.length + skills.length + achievements.length + experienceClaims.length + numericSignals;
  return Math.max(0, Math.min(1, (words.length / 80) * 0.35 + (concreteSignals / 8) * 0.65));
}

export const KeywordExtractionService = {
  extract(answer = '', currentQuestion = {}) {
    const question = currentQuestion || {};
    const normalizedWords = answer
      .split(/\s+/)
      .map(normalizeKeyword)
      .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));

    const keywordCounts = normalizedWords.reduce((counts, word) => {
      counts.set(word, (counts.get(word) || 0) + 1);
      return counts;
    }, new Map());

    const keywords = [...keywordCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([word]) => TECH_ALIASES.get(word) || word)
      .slice(0, 16);

    const lower = answer.toLowerCase();
    const technologies = unique([...TECH_ALIASES.entries()]
      .filter(([alias]) => new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lower))
      .map(([, label]) => label));

    const skills = unique([
      ...SKILL_PATTERNS.filter(({ pattern }) => pattern.test(answer)).map(({ skill }) => skill),
      ...(question.expectedConcepts || []),
    ]).slice(0, 12);

    const experienceClaims = extractMatches(answer, EXPERIENCE_PATTERNS).slice(0, 8);
    const achievements = extractMatches(answer, ACHIEVEMENT_PATTERNS).slice(0, 8);
    const weaknesses = extractMatches(answer, WEAKNESS_PATTERNS).slice(0, 8);
    const projectNames = extractProjectNames(answer);
    const specificity = estimateSpecificity({ answer, technologies, skills, achievements, experienceClaims });
    const vagueSignals = [
      answer.split(/\s+/).filter(Boolean).length < 25,
      /\b(stuff|things|etc|basically|somehow|kind of|sort of|maybe|i think)\b/i.test(answer),
      experienceClaims.length === 0 && technologies.length === 0 && achievements.length === 0,
    ].filter(Boolean).length;

    return {
      keywords,
      skills,
      technologies,
      experienceClaims,
      achievements,
      weaknesses,
      projectNames,
      specificity,
      confidence: Math.max(0.1, Math.min(0.98, specificity - vagueSignals * 0.12 + 0.3)),
      isVague: vagueSignals >= 2 || specificity < 0.28,
    };
  },
};
