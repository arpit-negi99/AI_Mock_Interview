import { isDbConnected } from '../config/db.js';
import { createId, memoryStore } from '../utils/memoryStore.js';
import { InterviewReport } from '../modules/interview/interviewReport.model.js';
import { SkillScore } from '../modules/interview/skillScore.model.js';
import { PerformanceMetric } from '../modules/interview/performanceMetric.model.js';

function clampScore(value, fallback = 0) {
  return Number(Math.max(0, Math.min(10, Number.isFinite(Number(value)) ? Number(value) : fallback)).toFixed(1));
}

function average(values = [], fallback = 0) {
  const numeric = values.map(Number).filter(Number.isFinite);
  if (!numeric.length) return fallback;
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
}

function candidateInfo(session = {}) {
  const candidate = session.candidate || {};
  return {
    id: candidate._id?.toString?.() || candidate.id || candidate.toString?.() || candidate,
    name: candidate.name || 'Candidate',
    email: candidate.email || '',
  };
}

function durationMinutes(session = {}) {
  if (session.startedAt && session.endedAt) {
    return Math.max(1, Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000));
  }
  return Number(session.duration || 0);
}

function allExtractions(session = {}) {
  return (session.questionHistory || []).map((item) => item.extractedContext).filter(Boolean);
}

function assessedSkills(session = {}) {
  const memorySummary = session.interviewMemory?.summary || {};
  return [...new Set([
    ...(memorySummary.skills || []),
    ...(memorySummary.technologies || []),
    ...(session.skillGraph?.nodes || []).map((node) => node.label),
    ...(session.questionHistory || []).flatMap((item) => item.expectedConcepts || []),
  ].filter(Boolean))].slice(0, 16);
}

function buildSkillBreakdown(session = {}) {
  const notes = session.evaluationNotes || [];
  const skills = assessedSkills(session);
  const topicScores = new Map(notes.map((note) => [note.topic, Number(note.score || 0)]));
  const graphWeights = new Map((session.skillGraph?.nodes || []).map((node) => [node.label, Number(node.weight || 1)]));
  const maxWeight = Math.max(1, ...graphWeights.values());
  const baseScore = average(notes.map((note) => note.score), 5);

  return skills.map((skill) => {
    const topicScore = topicScores.get(skill);
    const confidenceBoost = (graphWeights.get(skill) || 1) / maxWeight;
    return {
      label: skill,
      score: clampScore(topicScore ?? baseScore * 0.75 + confidenceBoost * 2.5, baseScore),
      evidence: (session.questionHistory || [])
        .filter((item) => [
          item.topic,
          ...(item.expectedConcepts || []),
          ...(item.extractedContext?.skills || []),
          ...(item.extractedContext?.technologies || []),
        ].includes(skill))
        .map((item) => item.answerTranscript || item.questionText)
        .filter(Boolean)
        .slice(0, 2),
    };
  }).sort((a, b) => b.score - a.score);
}

function performanceAnalysis(session = {}, skillBreakdown = []) {
  const notes = session.evaluationNotes || [];
  const extractions = allExtractions(session);
  const avgNote = average(notes.map((note) => note.score), 5);
  const avgConfidence = average(extractions.map((item) => item.confidence * 10), avgNote);
  const avgSpecificity = average(extractions.map((item) => item.specificity * 10), avgNote);
  const technicalSkills = skillBreakdown.filter((item) => /api|database|design|react|node|javascript|system|performance|security|testing|deployment|state/i.test(item.label));
  const technical = average(technicalSkills.map((item) => item.score), avgNote);
  const achievements = extractions.flatMap((item) => item.achievements || []).length;
  const claims = extractions.flatMap((item) => item.experienceClaims || []).length;

  return {
    technicalKnowledge: clampScore(technical, avgNote),
    communication: clampScore(avgNote * 0.6 + avgSpecificity * 0.4, avgNote),
    problemSolving: clampScore(avgNote * 0.7 + Math.min(10, (achievements + claims) * 1.5), avgNote),
    confidence: clampScore(avgConfidence, avgNote),
    clarity: clampScore(avgSpecificity, avgNote),
    domainExpertise: clampScore(average(skillBreakdown.map((item) => item.score), avgNote), avgNote),
  };
}

function uniqueLimited(values = [], limit = 8) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))].slice(0, limit);
}

function learningResources(weakSkills = []) {
  const defaults = ['Review fundamentals with focused notes', 'Practice two spoken answers per weak topic', 'Build one small project that demonstrates the missing skill'];
  const mapped = weakSkills.map((skill) => `Practice ${skill} with one implementation exercise and one tradeoff explanation`);
  return uniqueLimited([...mapped, ...defaults], 6);
}

function buildReport(session = {}) {
  const skillBreakdown = buildSkillBreakdown(session);
  const analysis = performanceAnalysis(session, skillBreakdown);
  const finalScore = clampScore(average(Object.values(analysis)), 0);
  const weakSkills = skillBreakdown.filter((item) => item.score < 7).map((item) => item.label).slice(0, 5);
  const notes = session.evaluationNotes || [];
  const finalEvaluation = session.finalEvaluation || {};
  const strengths = uniqueLimited([
    ...(finalEvaluation.strongestAreas || []),
    ...notes.flatMap((note) => note.strengths || []),
    ...skillBreakdown.filter((item) => item.score >= 8).map((item) => `Strong ${item.label} signal`),
  ], 8);
  const areasForImprovement = uniqueLimited([
    ...(finalEvaluation.areasNeedingImprovement || []),
    ...notes.flatMap((note) => note.gaps || []),
    ...weakSkills.map((skill) => `Improve depth in ${skill}`),
  ], 8);

  return {
    candidate: session.candidate?._id || session.candidate,
    candidateInfo: candidateInfo(session),
    session: session._id || session.id,
    interviewType: session.interviewType,
    startedAt: session.startedAt,
    endedAt: session.endedAt || new Date(),
    durationMinutes: durationMinutes(session),
    totalQuestions: Number(session.totalQuestions || session.questionHistory?.length || 0),
    answeredQuestions: (session.questionHistory || []).filter((item) => item.answerTranscript).length,
    skillsAssessed: assessedSkills(session),
    performanceAnalysis: analysis,
    skillBreakdown,
    strengths,
    areasForImprovement,
    aiFeedback: {
      detailedFeedback: finalEvaluation.summary || finalEvaluation.overallPerformance || 'The interview was evaluated from the saved answer history and extracted skill evidence.',
      suggestedLearningResources: learningResources(weakSkills),
      interviewReadinessScore: Math.round(finalScore * 10),
    },
    finalScore,
    exports: { jsonReady: true, csvReady: true, pdfReady: true },
  };
}

function reportId(report) {
  return report._id?.toString?.() || report.id;
}

function normalizeReport(report) {
  return report?.toObject?.() || report;
}

function sessionKey(sessionId) {
  return sessionId?.toString?.() || sessionId;
}

function metricFromReport(report) {
  const analysis = report.performanceAnalysis || {};
  return {
    candidate: report.candidate,
    session: report.session,
    report: reportId(report),
    recordedAt: report.endedAt || new Date(),
    overallScore: report.finalScore,
    communicationScore: analysis.communication,
    technicalScore: analysis.technicalKnowledge,
    confidenceScore: analysis.confidence,
    clarityScore: analysis.clarity,
    problemSolvingScore: analysis.problemSolving,
    domainExpertiseScore: analysis.domainExpertise,
    completionRate: report.totalQuestions ? Math.round((report.answeredQuestions / report.totalQuestions) * 100) : 0,
    durationMinutes: report.durationMinutes,
    interviewType: report.interviewType,
  };
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(report) {
  const rows = [
    ['Section', 'Metric', 'Value'],
    ['Summary', 'Candidate', report.candidateInfo?.name],
    ['Summary', 'Interview Type', report.interviewType],
    ['Summary', 'Final Score', report.finalScore],
    ...Object.entries(report.performanceAnalysis || {}).map(([key, value]) => ['Performance', key, value]),
    ...(report.skillBreakdown || []).map((item) => ['Skill', item.label, item.score]),
    ...(report.strengths || []).map((item) => ['Strength', '', item]),
    ...(report.areasForImprovement || []).map((item) => ['Improvement', '', item]),
    ...(report.aiFeedback?.suggestedLearningResources || []).map((item) => ['Resource', '', item]),
  ];
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
}

function pdfEscape(value) {
  return String(value ?? '').replace(/[\\()]/g, '\\$&');
}

function toPdf(report) {
  const lines = [
    'Interview Report',
    `Candidate: ${report.candidateInfo?.name || 'Candidate'}`,
    `Interview Type: ${report.interviewType || 'N/A'}`,
    `Date: ${report.startedAt ? new Date(report.startedAt).toLocaleString() : 'N/A'}`,
    `Final Score: ${report.finalScore}/10`,
    `Readiness: ${report.aiFeedback?.interviewReadinessScore || 0}/100`,
    '',
    'Performance Analysis',
    ...Object.entries(report.performanceAnalysis || {}).map(([key, value]) => `${key}: ${value}/10`),
    '',
    'Skill Breakdown',
    ...(report.skillBreakdown || []).map((item) => `${item.label}: ${item.score}/10`),
    '',
    'Strengths',
    ...(report.strengths || []).map((item) => `- ${item}`),
    '',
    'Areas for Improvement',
    ...(report.areasForImprovement || []).map((item) => `- ${item}`),
  ].slice(0, 48);
  const stream = `BT /F1 12 Tf 50 780 Td ${lines.map((line, index) => `${index ? '0 -16 Td ' : ''}(${pdfEscape(line)}) Tj`).join(' ')} ET`;
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`,
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(body));
    body += `${object}\n`;
  }
  const xrefAt = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n');
  body += `\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;
  return Buffer.from(body);
}

function inRange(date, range = 'all') {
  if (range === 'all') return true;
  const days = { '30d': 30, '90d': 90, '6m': 183 }[range] || 36500;
  return new Date(date).getTime() >= Date.now() - days * 24 * 60 * 60 * 1000;
}

function analyticsFromReports(reports = [], range = 'all') {
  const scoped = reports
    .filter((report) => inRange(report.endedAt || report.createdAt, range))
    .sort((a, b) => new Date(a.endedAt || a.createdAt) - new Date(b.endedAt || b.createdAt));
  const scores = scoped.map((report) => Number(report.finalScore || 0));
  const first = scores[0] || 0;
  const last = scores[scores.length - 1] || 0;
  const skillMap = new Map();
  for (const report of scoped) {
    for (const skill of report.skillBreakdown || []) {
      const items = skillMap.get(skill.label) || [];
      items.push({ date: report.endedAt || report.createdAt, score: skill.score });
      skillMap.set(skill.label, items);
    }
  }
  const latest = scoped[scoped.length - 1] || {};
  return {
    range,
    summary: {
      interviewCount: scoped.length,
      averageScore: clampScore(average(scores), 0),
      bestScore: clampScore(Math.max(0, ...scores), 0),
      improvementPercentage: first ? Math.round(((last - first) / first) * 100) : 0,
    },
    interviewHistory: scoped.map((report) => ({
      sessionId: sessionKey(report.session),
      date: report.endedAt || report.createdAt,
      interviewType: report.interviewType,
      duration: report.durationMinutes,
      finalScore: report.finalScore,
      readinessScore: report.aiFeedback?.interviewReadinessScore || 0,
    })).reverse(),
    trends: scoped.map((report) => ({
      date: report.endedAt || report.createdAt,
      overallScore: report.finalScore,
      communicationScore: report.performanceAnalysis?.communication,
      technicalScore: report.performanceAnalysis?.technicalKnowledge,
      confidenceScore: report.performanceAnalysis?.confidence,
    })),
    skillGrowth: [...skillMap.entries()].slice(0, 8).map(([skill, values]) => ({ skill, values })),
    completionRates: scoped.map((report) => ({
      date: report.endedAt || report.createdAt,
      completionRate: report.totalQuestions ? Math.round((report.answeredQuestions / report.totalQuestions) * 100) : 0,
    })),
    topicCoverage: (latest.skillBreakdown || []).slice(0, 8).map((item) => ({ topic: item.label, score: item.score })),
    strengthWeaknessDistribution: {
      strengths: (latest.strengths || []).length,
      weaknesses: (latest.areasForImprovement || []).length,
    },
  };
}

export const interviewReportService = {
  buildReport,

  async generateForSession(session) {
    const report = buildReport(session);
    if (isDbConnected()) {
      await InterviewReport.deleteMany({ session: report.session });
      const created = await InterviewReport.create(report);
      await SkillScore.deleteMany({ session: report.session });
      await PerformanceMetric.deleteMany({ session: report.session });
      await SkillScore.insertMany((report.skillBreakdown || []).map((item) => ({
        candidate: report.candidate,
        session: report.session,
        report: created._id,
        skill: item.label,
        score: item.score,
        confidence: item.score / 10,
        assessedAt: report.endedAt,
      })));
      await PerformanceMetric.create({ ...metricFromReport(report), report: created._id });
      return created;
    }

    const stored = { ...report, id: createId('report'), createdAt: new Date(), updatedAt: new Date() };
    memoryStore.interviewReports = memoryStore.interviewReports || [];
    memoryStore.skillScores = memoryStore.skillScores || [];
    memoryStore.performanceMetrics = memoryStore.performanceMetrics || [];
    memoryStore.interviewReports = memoryStore.interviewReports.filter((item) => sessionKey(item.session) !== sessionKey(report.session));
    memoryStore.skillScores = memoryStore.skillScores.filter((item) => sessionKey(item.session) !== sessionKey(report.session));
    memoryStore.performanceMetrics = memoryStore.performanceMetrics.filter((item) => sessionKey(item.session) !== sessionKey(report.session));
    memoryStore.interviewReports.push(stored);
    memoryStore.skillScores.push(...(report.skillBreakdown || []).map((item) => ({
      id: createId('skill_score'),
      candidate: report.candidate,
      session: report.session,
      report: stored.id,
      skill: item.label,
      score: item.score,
      confidence: item.score / 10,
      assessedAt: report.endedAt,
    })));
    memoryStore.performanceMetrics.push({ id: createId('metric'), ...metricFromReport(stored) });
    return stored;
  },

  async findBySession(sessionId) {
    if (isDbConnected()) return InterviewReport.findOne({ session: sessionId });
    return (memoryStore.interviewReports || []).find((item) => sessionKey(item.session) === sessionKey(sessionId)) || null;
  },

  async listByCandidate(candidateId) {
    if (isDbConnected()) return InterviewReport.find({ candidate: candidateId }).sort({ endedAt: -1 });
    return (memoryStore.interviewReports || [])
      .filter((item) => sessionKey(item.candidate) === sessionKey(candidateId))
      .sort((a, b) => new Date(b.endedAt || b.createdAt) - new Date(a.endedAt || a.createdAt));
  },

  exportReport(report, format = 'json') {
    const normalized = normalizeReport(report);
    if (format === 'csv') return { contentType: 'text/csv', body: toCsv(normalized), filename: 'interview-report.csv' };
    if (format === 'pdf') return { contentType: 'application/pdf', body: toPdf(normalized), filename: 'interview-report.pdf' };
    return { contentType: 'application/json', body: JSON.stringify(normalized, null, 2), filename: 'interview-report.json' };
  },

  analyticsFromReports,
};
