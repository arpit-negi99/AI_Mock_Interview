import { KeywordExtractionService } from './KeywordExtractionService.js';
import { InterviewMemoryStore } from './InterviewMemoryStore.js';
import { SkillGraphBuilder } from './SkillGraphBuilder.js';
import { FollowUpQuestionGenerator } from './FollowUpQuestionGenerator.js';

function scoreTopicDepth(memory = {}) {
  const topicMap = new Map();
  for (const exchange of memory.exchanges || []) {
    const topic = exchange.topic || exchange.extraction?.skills?.[0] || 'general';
    const current = topicMap.get(topic) || {
      topic,
      exchanges: 0,
      confidenceTotal: 0,
      evidenceSignals: 0,
      vagueAnswers: 0,
    };
    current.exchanges += 1;
    current.confidenceTotal += Number(exchange.extraction?.confidence || 0);
    current.evidenceSignals += (exchange.extraction?.achievements || []).length
      + (exchange.extraction?.experienceClaims || []).length
      + (exchange.extraction?.technologies || []).length;
    current.vagueAnswers += exchange.extraction?.isVague ? 1 : 0;
    topicMap.set(topic, current);
  }

  return [...topicMap.values()].map((item) => ({
    topic: item.topic,
    exchanges: item.exchanges,
    depthScore: Number(Math.max(0, Math.min(1, (item.confidenceTotal / item.exchanges) * 0.55 + (item.evidenceSignals / (item.exchanges * 5)) * 0.45 - item.vagueAnswers * 0.12)).toFixed(2)),
    confidence: Number((item.confidenceTotal / item.exchanges).toFixed(2)),
  })).sort((a, b) => b.depthScore - a.depthScore);
}

function buildConversationGraph(memory = {}, skillGraph = {}) {
  const exchangeNodes = (memory.exchanges || []).map((exchange) => ({
    id: exchange.id,
    type: 'exchange',
    label: exchange.topic || exchange.questionType,
    confidence: exchange.extraction?.confidence || 0,
  }));
  const skillNodes = (skillGraph.nodes || []).map((node) => ({
    id: `skill:${node.label}`,
    type: 'skill',
    label: node.label,
    weight: node.weight,
  }));
  const exchangeEdges = (memory.exchanges || []).flatMap((exchange) => [
    ...(exchange.extraction?.skills || []),
    ...(exchange.extraction?.technologies || []),
    ...(exchange.extraction?.projectNames || []),
  ].map((label) => ({
    source: exchange.id,
    target: `skill:${label}`,
    relation: 'mentions',
    weight: exchange.extraction?.confidence || 0.5,
  })));

  return {
    nodes: [...exchangeNodes, ...skillNodes],
    edges: [
      ...exchangeEdges,
      ...(skillGraph.edges || []).map((edge) => ({
        source: `skill:${edge.source}`,
        target: `skill:${edge.target}`,
        relation: 'co_occurs',
        weight: edge.weight,
      })),
    ],
  };
}

function buildState(session = {}, extraction = {}, memory = {}, topicDepth = []) {
  const averageDepth = topicDepth.length
    ? topicDepth.reduce((sum, item) => sum + item.depthScore, 0) / topicDepth.length
    : 0;
  const answerQuality = extraction.isVague ? 'low' : extraction.confidence >= 0.75 ? 'high' : 'medium';
  const nextDifficulty = answerQuality === 'high' && averageDepth >= 0.55
    ? 'hard'
    : answerQuality === 'low'
      ? 'easy'
      : session.difficulty || 'medium';

  return {
    answerQuality,
    nextDifficulty,
    confidence: extraction.confidence,
    averageTopicDepth: Number(averageDepth.toFixed(2)),
    needsClarification: extraction.isVague,
    shouldIncreaseDifficulty: answerQuality === 'high' && averageDepth >= 0.55,
    memoryExchangeCount: memory.exchanges?.length || 0,
  };
}

export const InterviewContextManager = {
  async updateAfterAnswer({ session, currentQuestion, answerTranscript }) {
    const extraction = KeywordExtractionService.extract(answerTranscript, currentQuestion);
    const memory = await InterviewMemoryStore.appendExchange(session.interviewMemory || {}, {
      question: currentQuestion,
      answer: answerTranscript,
      extraction,
    });
    const relatedExchanges = await InterviewMemoryStore.retrieve(
      memory,
      [currentQuestion?.questionText, answerTranscript, extraction.keywords?.join(' ')].filter(Boolean).join(' '),
      3,
    );
    const skillGraph = SkillGraphBuilder.build(memory);
    const topicDepth = scoreTopicDepth(memory);
    const conversationGraph = buildConversationGraph(memory, skillGraph);
    const interviewState = buildState(session, extraction, memory, topicDepth);
    const suggestedFollowUp = FollowUpQuestionGenerator.generate({
      session,
      currentQuestion,
      extraction,
      memory,
      relatedExchanges,
    });

    return {
      extraction,
      memory,
      relatedExchanges,
      skillGraph,
      topicDepth,
      conversationGraph,
      interviewState,
      suggestedFollowUp,
    };
  },
};
